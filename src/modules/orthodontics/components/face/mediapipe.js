// MediaPipe Face Landmarker (Apache-2.0), loaded only when the doctor asks
// for automatic points. Runs entirely in the browser: the photo is never sent
// anywhere. Only the runtime (/mediapipe/wasm, served by this app) and the
// model file are downloaded. Set VITE_FACE_LANDMARKER_MODEL_URL to self-host
// the model (recommended for clinics that must avoid third-party requests).
import { MEDIAPIPE_INDEX } from '../../analysis/face.js'

const MODEL_URL = import.meta.env.VITE_FACE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

let landmarkerPromise = null

async function getLandmarker () {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(`${import.meta.env.BASE_URL || '/'}mediapipe/wasm`)
      const create = delegate => FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'IMAGE',
        numFaces: 1
      })
      try { return await create('GPU') } catch (_) { return create('CPU') }
    })().catch(e => { landmarkerPromise = null; throw e })
  }
  return landmarkerPromise
}

/**
 * Detect the face mesh on an <img> and map it to the named points.
 * @returns {Record<string, {x:number,y:number}>} image-pixel coordinates
 */
export async function detectFaceLandmarks (img, codes) {
  const landmarker = await getLandmarker()
  const result = landmarker.detect(img)
  const mesh = result?.faceLandmarks?.[0]
  if (!mesh) return {}
  const w = img.naturalWidth
  const h = img.naturalHeight
  const out = {}
  for (const code of codes) {
    const idx = MEDIAPIPE_INDEX[code]
    const p = idx !== undefined ? mesh[idx] : null
    if (p) out[code] = { x: Math.round(p.x * w * 10) / 10, y: Math.round(p.y * h * 10) / 10 }
  }
  return out
}
