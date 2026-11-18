// Cornerstone3D (MIT) wrapper for the CBCT viewer. Imported lazily by the
// CBCT tab only.
//
// DICOM instances are downloaded through the authenticated orthodontics API
// (JWT + clinic header) and handed to the loader from memory - the browser
// never opens a DICOM URL without credentials, and nothing is public.
import {
  RenderingEngine, Enums, init as coreInit, isCornerstoneInitialized, volumeLoader,
  setVolumesForViewports, cache, utilities as csUtils, metaData, eventTarget
} from '@cornerstonejs/core'
import * as csTools from '@cornerstonejs/tools'
import dicomImageLoader from '@cornerstonejs/dicom-image-loader'
import { orthoApi } from '../../api.js'
import { ot } from '../../i18n.js'
import { withRetry } from '../../utils/retry.js'

// Slices downloaded at once. Every request holds clinic database connections
// on the server, which shared hosting caps, so a study must not use them all.
const PARALLEL_SLICE_DOWNLOADS = 3

const {
  ToolGroupManager, WindowLevelTool, PanTool, ZoomTool, StackScrollTool, LengthTool, AngleTool,
  CrosshairsTool, TrackballRotateTool, annotation, Enums: ToolEnums
} = csTools

let initialized = false
const TOOLS = [WindowLevelTool, PanTool, ZoomTool, StackScrollTool, LengthTool, AngleTool, CrosshairsTool, TrackballRotateTool]

export function setupCornerstone () {
  if (initialized) return
  if (!isCornerstoneInitialized()) coreInit()
  dicomImageLoader.init({
    maxWebWorkers: Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 2) / 2))),
    // Codecs are served from /cornerstone-wasm/ (see vite.config.js).
    wasmBasePath: `${import.meta.env.BASE_URL || '/'}cornerstone-wasm/`,
    // The per-dataset metadata provider: metadata comes from the DICOM
    // headers we prefetch below.
    useLegacyMetadataProvider: true
  })
  csTools.init()
  for (const T of TOOLS) {
    try { csTools.addTool(T) } catch (_) { /* already added */ }
  }
  initialized = true
}

let imageIndexBase = 500000 // keeps our ids clear of anything using fileManager

/**
 * Download a study's instances and prefetch their headers.
 * @returns {{ volumeId, imageIds, release }}
 */
export async function loadStudyVolume ({ caseId, study, instances, onProgress, signal }) {
  setupCornerstone()
  // The biggest series is the CBCT volume (scouts/localisers are skipped).
  const bySeries = new Map()
  for (const inst of instances) {
    const key = inst.series_instance_uid || 'default'
    if (!bySeries.has(key)) bySeries.set(key, [])
    bySeries.get(key).push(inst)
  }
  const series = [...bySeries.values()].sort((a, b) => b.length - a.length)[0] || []
  if (series.length === 1 && series[0].frames > 1) {
    throw new Error(ot('cbct.multiframe'))
  }
  if (series.length < 3) throw new Error(ot('cbct.tooFewSlices'))

  const { dataSetCacheManager } = dicomImageLoader.wadouri
  const imageIds = new Array(series.length)
  const urls = []
  let done = 0
  let cursor = 0
  const worker = async () => {
    while (cursor < series.length) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const i = cursor++
      // One busy moment on the server must not fail the whole study.
      const buffer = await withRetry(() => orthoApi.cbctInstance(caseId, study.id, series[i].id), { signal })
      const url = String(imageIndexBase++)
      imageIds[i] = `dicomfile:${url}`
      urls.push(url)
      // Parse the header now (the pixel data is decoded later, in a worker).
      await dataSetCacheManager.load(url, () => Promise.resolve(buffer), imageIds[i])
      done++
      onProgress?.(done / series.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL_SLICE_DOWNLOADS, series.length) }, worker))

  const volumeId = `cornerstoneStreamingImageVolume:ortho-study-${study.id}-${Date.now()}`
  const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds })
  return {
    volumeId,
    imageIds,
    volume,
    release () {
      try { cache.removeVolumeLoadObject(volumeId) } catch (_) {}
      for (const url of urls) {
        while (dataSetCacheManager.isLoaded(url)) dataSetCacheManager.unload(url)
      }
    }
  }
}

/** Wait until every slice is decoded into the volume. */
export function whenVolumeLoaded (volume, onProgress) {
  const total = volume.imageIds?.length || 1
  const timer = setInterval(() => {
    onProgress?.(volume.loadStatus?.loaded ? 1 : Math.min(0.99, (volume.framesProcessed || volume.framesLoaded || 0) / total))
  }, 250)
  return new Promise(resolve => {
    volume.load(evt => { clearInterval(timer); onProgress?.(1); resolve(evt) })
  })
}

export const VIEWPORTS = [
  { id: 'ortho-axial', orientation: Enums.OrientationAxis.AXIAL },
  { id: 'ortho-coronal', orientation: Enums.OrientationAxis.CORONAL },
  { id: 'ortho-sagittal', orientation: Enums.OrientationAxis.SAGITTAL },
  { id: 'ortho-3d', orientation: null }
]

/**
 * Build the MPR (axial / coronal / sagittal) + 3D layout.
 * @param {Record<string, HTMLElement>} elements viewport id -> element
 */
export async function createViewer (elements, volumeId) {
  setupCornerstone()
  const engineId = `ortho-engine-${Date.now()}`
  const engine = new RenderingEngine(engineId)
  engine.setViewports(VIEWPORTS.filter(v => elements[v.id]).map(v => ({
    viewportId: v.id,
    element: elements[v.id],
    type: v.orientation ? Enums.ViewportType.ORTHOGRAPHIC : Enums.ViewportType.VOLUME_3D,
    defaultOptions: v.orientation ? { orientation: v.orientation, background: [0, 0, 0] } : { background: [0.06, 0.09, 0.16] }
  })))

  const mprIds = VIEWPORTS.filter(v => v.orientation && elements[v.id]).map(v => v.id)
  const has3d = !!elements['ortho-3d']
  await setVolumesForViewports(engine, [{ volumeId }], mprIds)
  if (has3d) {
    await setVolumesForViewports(engine, [{ volumeId }], ['ortho-3d'])
    const vp3d = engine.getViewport('ortho-3d')
    vp3d.setProperties({ preset: 'CT-Bone' })
    vp3d.render()
  }

  const groupId = `ortho-mpr-${engineId}`
  const group = ToolGroupManager.createToolGroup(groupId)
  for (const T of [WindowLevelTool, PanTool, ZoomTool, StackScrollTool, LengthTool, AngleTool]) group.addTool(T.toolName)
  group.addTool(CrosshairsTool.toolName, { getReferenceLineColor: id => ({ 'ortho-axial': '#ef4444', 'ortho-coronal': '#22c55e', 'ortho-sagittal': '#3b82f6' }[id] || '#facc15') })
  mprIds.forEach(id => group.addViewport(id, engineId))

  let group3d = null
  if (has3d) {
    group3d = ToolGroupManager.createToolGroup(`ortho-3d-${engineId}`)
    group3d.addTool(TrackballRotateTool.toolName)
    group3d.addTool(ZoomTool.toolName)
    group3d.addTool(PanTool.toolName)
    group3d.addViewport('ortho-3d', engineId)
    group3d.setToolActive(TrackballRotateTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] })
    group3d.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] })
    group3d.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }] })
  }

  const PRIMARY = [WindowLevelTool, LengthTool, AngleTool, CrosshairsTool, PanTool, ZoomTool].map(T => T.toolName)
  function setPrimaryTool (name) {
    for (const t of PRIMARY) if (t !== name) group.setToolPassive(t)
    group.setToolActive(name, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }] })
    if (name !== PanTool.toolName) group.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }] })
    if (name !== ZoomTool.toolName) group.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }] })
  }
  group.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: ToolEnums.MouseBindings.Wheel }] })
  setPrimaryTool(WindowLevelTool.toolName)
  engine.renderViewports(mprIds)

  function setVOI (lower, upper) {
    for (const id of mprIds) {
      const vp = engine.getViewport(id)
      vp.setProperties({ voiRange: { lower, upper } })
      vp.render()
    }
  }

  function getState () {
    const viewports = {}
    for (const id of mprIds) {
      const vp = engine.getViewport(id)
      const cam = vp.getCamera()
      viewports[id] = {
        camera: { focalPoint: cam.focalPoint, position: cam.position, viewUp: cam.viewUp, parallelScale: cam.parallelScale },
        voiRange: vp.getProperties()?.voiRange || null
      }
    }
    return { viewports, saved_at: new Date().toISOString() }
  }

  function applyState (state) {
    for (const [id, s] of Object.entries(state?.viewports || {})) {
      const vp = mprIds.includes(id) ? engine.getViewport(id) : null
      if (!vp) continue
      if (s.camera) vp.setCamera(s.camera)
      if (s.voiRange) vp.setProperties({ voiRange: s.voiRange })
      vp.render()
    }
  }

  function resetViews () {
    for (const id of [...mprIds, ...(has3d ? ['ortho-3d'] : [])]) {
      const vp = engine.getViewport(id)
      vp.resetCamera()
      if (id !== 'ortho-3d') vp.resetProperties?.()
      vp.render()
    }
  }

  /** Length / angle annotations as world points (DICOM patient mm). */
  function exportMeasurements () {
    const out = []
    for (const a of annotation.state.getAllAnnotations()) {
      const tool = a.metadata?.toolName
      if (tool !== LengthTool.toolName && tool !== AngleTool.toolName) continue
      const points = (a.data?.handles?.points || []).map(p => Array.from(p).map(v => Math.round(v * 1000) / 1000))
      if (points.length < (tool === AngleTool.toolName ? 3 : 2)) continue
      out.push({
        type: tool === AngleTool.toolName ? 'angle' : 'distance',
        label: a.data?.label || '',
        points,
        annotation: { metadata: { toolName: tool, viewPlaneNormal: a.metadata.viewPlaneNormal, viewUp: a.metadata.viewUp, FrameOfReferenceUID: a.metadata.FrameOfReferenceUID } }
      })
    }
    return out
  }

  /** Re-create saved length / angle annotations (best effort). */
  function restoreMeasurements (list = []) {
    const element = elements['ortho-axial']
    for (const m of list) {
      const meta = m.annotation?.metadata
      if (!meta?.FrameOfReferenceUID || !m.points?.length) continue
      try {
        annotation.state.addAnnotation({
          annotationUID: csUtils.uuidv4(),
          highlighted: false,
          invalidated: true,
          isLocked: false,
          isVisible: true,
          metadata: { ...meta },
          data: { label: m.label || '', handles: { points: m.points, activeHandleIndex: null, textBox: { hasMoved: false, worldPosition: [0, 0, 0], worldBoundingBox: { topLeft: [0, 0, 0], topRight: [0, 0, 0], bottomLeft: [0, 0, 0], bottomRight: [0, 0, 0] } } }, cachedStats: {} }
        }, element)
      } catch (e) {
        console.warn('Could not restore a CBCT measurement', e)
      }
    }
    engine.renderViewports(mprIds)
  }

  function clearMeasurements () {
    for (const a of annotation.state.getAllAnnotations()) {
      if ([LengthTool.toolName, AngleTool.toolName].includes(a.metadata?.toolName)) annotation.state.removeAnnotation(a.annotationUID)
    }
    engine.renderViewports(mprIds)
  }

  function resize () {
    engine.resize(true, true)
  }

  /** Call `cb` whenever a measurement is drawn, moved or removed. */
  function onAnnotationsChanged (cb) {
    const names = [ToolEnums.Events.ANNOTATION_COMPLETED, ToolEnums.Events.ANNOTATION_MODIFIED, ToolEnums.Events.ANNOTATION_REMOVED]
    names.forEach(n => eventTarget.addEventListener(n, cb))
    return () => names.forEach(n => eventTarget.removeEventListener(n, cb))
  }

  function snapshot (id = 'ortho-axial') {
    const canvas = engine.getViewport(id)?.getCanvas?.()
    return canvas ? canvas.toDataURL('image/png') : null
  }

  function dispose () {
    try { clearMeasurements() } catch (_) {}
    try { ToolGroupManager.destroyToolGroup(groupId) } catch (_) {}
    try { if (group3d) ToolGroupManager.destroyToolGroup(group3d.id) } catch (_) {}
    try { engine.destroy() } catch (_) {}
  }

  return {
    setPrimaryTool, setVOI, getState, applyState, resetViews, exportMeasurements, restoreMeasurements,
    clearMeasurements, resize, snapshot, dispose, onAnnotationsChanged,
    tools: { WindowLevel: WindowLevelTool.toolName, Length: LengthTool.toolName, Angle: AngleTool.toolName, Crosshairs: CrosshairsTool.toolName, Pan: PanTool.toolName, Zoom: ZoomTool.toolName }
  }
}

/**
 * Plain geometry + voxels of a loaded volume, for the panoramic / cross-
 * section reconstruction (which runs in plain JS on the same voxels).
 */
export function volumeGeometry (volume) {
  const scalars = volume.voxelManager?.getCompleteScalarDataArray?.() || volume.getScalarData?.()
  const plane = metaData.get('imagePlaneModule', volume.imageIds?.[0]) || {}
  return {
    dims: [...volume.dimensions],
    spacing: [...volume.spacing],
    origin: [...volume.origin],
    direction: [...volume.direction],
    scalars,
    frameOfReference: plane.frameOfReferenceUID || null
  }
}
