// Three.js scene for dental models. Imported lazily (only by the 3D tab), so
// Three.js never lands in the main bundle. Geometry is kept in the file's own
// coordinates: picked points are raw model units, converted to mm only with
// the doctor-confirmed scale.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

const MODEL_COLORS = { model_upper: 0xf5ecd9, model_lower: 0xdbeafe, model_combined: 0xe7e5e4 }

export function createCastScene (container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x0f172a)
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100000)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.12

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 1.1))
  // Headlight: follows the camera so the side being looked at is always lit.
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(1, 1, 2)
  camera.add(key)
  scene.add(camera)

  const models = new Map() // fileId -> { mesh, kind }
  const markers = new THREE.Group()
  scene.add(markers)
  const raycaster = new THREE.Raycaster()
  let bbox = new THREE.Box3()
  let markerSize = 0.5
  let frame = null
  let disposed = false

  function resize () {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function loop () {
    if (disposed) return
    controls.update()
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }

  function parse (buffer, ext) {
    if (ext === 'stl') return new STLLoader().parse(buffer)
    if (ext === 'ply') return new PLYLoader().parse(buffer)
    const obj = new OBJLoader().parse(new TextDecoder().decode(buffer))
    const geoms = []
    obj.traverse(o => { if (o.isMesh) geoms.push(o.geometry) })
    if (!geoms.length) throw new Error('OBJ file has no mesh')
    return geoms.length === 1 ? geoms[0] : mergeGeometries(geoms)
  }

  function addModel (fileId, kind, buffer, ext) {
    const geometry = parse(buffer, ext)
    if (!geometry.attributes.normal) geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    const hasColor = !!geometry.attributes.color
    const material = new THREE.MeshStandardMaterial({
      color: hasColor ? 0xffffff : (MODEL_COLORS[kind] || 0xe5e7eb),
      vertexColors: hasColor,
      roughness: 0.55,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { fileId, kind }
    scene.add(mesh)
    models.set(fileId, { mesh, kind })
    recomputeBounds()
    return { size: geometry.boundingBox.getSize(new THREE.Vector3()).toArray(), vertices: geometry.attributes.position.count }
  }

  function recomputeBounds () {
    bbox = new THREE.Box3()
    for (const { mesh } of models.values()) if (mesh.visible) bbox.expandByObject(mesh)
    if (bbox.isEmpty()) return
    const size = bbox.getSize(new THREE.Vector3())
    markerSize = Math.max(size.x, size.y, size.z) / 160
    for (const m of markers.children) if (m.isMesh && m.userData.isPoint) m.scale.setScalar(markerSize)
  }

  function setView (view = 'front') {
    if (bbox.isEmpty()) return
    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const dist = Math.max(size.x, size.y, size.z) * 1.9
    const dirs = {
      front: [0, 0, 1], back: [0, 0, -1], top: [0, 1, 0.001], bottom: [0, -1, 0.001],
      right: [-1, 0, 0], left: [1, 0, 0], iso: [0.6, 0.5, 0.8]
    }
    const d = new THREE.Vector3(...(dirs[view] || dirs.front)).normalize()
    camera.position.copy(center.clone().addScaledVector(d, dist))
    camera.near = dist / 1000
    camera.far = dist * 100
    camera.updateProjectionMatrix()
    controls.target.copy(center)
    controls.update()
  }

  function setModelStyle (fileId, { visible, opacity }) {
    const m = models.get(fileId)
    if (!m) return
    if (visible !== undefined) m.mesh.visible = visible
    if (opacity !== undefined) {
      m.mesh.material.opacity = opacity
      m.mesh.material.depthWrite = opacity > 0.98
    }
    recomputeBounds()
  }

  /** Point on a visible model under a click, as [x, y, z] model units. */
  function pick (clientX, clientY, onlyKinds = null) {
    const rect = renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    const targets = [...models.values()].filter(m => m.mesh.visible && (!onlyKinds || onlyKinds.includes(m.kind))).map(m => m.mesh)
    const hit = raycaster.intersectObjects(targets, false)[0]
    return hit ? { point: hit.point.toArray().map(v => Math.round(v * 1e4) / 1e4), fileId: hit.object.userData.fileId, kind: hit.object.userData.kind } : null
  }

  /** Redraw every marker: points (spheres), lines and polylines. */
  function setMarkers (items) {
    for (const child of [...markers.children]) {
      child.geometry?.dispose()
      child.material?.dispose()
      markers.remove(child)
    }
    const sphere = new THREE.SphereGeometry(1, 12, 10)
    for (const it of items) {
      const color = new THREE.Color(it.color || '#f43f5e')
      if (it.type === 'point') {
        const m = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color, depthTest: false }))
        m.position.set(...it.p)
        m.scale.setScalar(markerSize * (it.size || 1))
        m.renderOrder = 10
        m.userData.isPoint = true
        markers.add(m)
      } else if (it.type === 'line' && it.points?.length >= 2) {
        const g = new THREE.BufferGeometry().setFromPoints(it.points.map(p => new THREE.Vector3(...p)))
        const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, depthTest: false }))
        l.renderOrder = 9
        markers.add(l)
      }
    }
  }

  function snapshot () {
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/png')
  }

  function dispose () {
    disposed = true
    cancelAnimationFrame(frame)
    controls.dispose()
    for (const { mesh } of models.values()) { mesh.geometry.dispose(); mesh.material.dispose() }
    setMarkers([])
    renderer.dispose()
    renderer.domElement.remove()
  }

  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()
  loop()

  return {
    addModel, setView, setModelStyle, pick, setMarkers, snapshot, resize,
    hasModel: id => models.has(id),
    dispose: () => { ro.disconnect(); dispose() },
    domElement: renderer.domElement
  }
}

function mergeGeometries (geoms) {
  const arrays = geoms.map(g => (g.index ? g.toNonIndexed() : g).attributes.position.array)
  const positions = new Float32Array(arrays.reduce((n, a) => n + a.length, 0))
  let offset = 0
  for (const a of arrays) { positions.set(a, offset); offset += a.length }
  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return merged
}
