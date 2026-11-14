# Orthodontics module (frontend)

The full documentation lives in the API repo, `SmartClinic-API-Laravel/docs/ORTHODONTICS_MODULE.md`: rules, security, API, formulas, licences and limitations. This page covers the frontend side only.

## Where it is

- `src/modules/orthodontics/`
  - `components/OrthodonticsWorkspace.vue`: the «تحليل التقويم» workspace with seven tabs. Each tab is an async component, so Three.js, Cornerstone3D and MediaPipe load only when that tab is opened.
  - `components/ceph/`: `CephAnalysisViewer` (list and compare) and `CephLandmarkEditor` (zoom, pan, brightness/contrast, landmarks, ruler calibration, live measurements, review).
  - `components/cast/`: `DentalCastViewer` (Three.js: STL/PLY/OBJ, units confirmation, point picking) and `DentalCastMeasurements`.
  - `components/cbct/`: `CbctStudies`, `CbctUploader` (files, folder or ZIP; batched upload), `CBCTViewer` (Cornerstone3D MPR + 3D), `CbctPanoramic` (curved reconstruction, cross-sections, bone measurements, implant planning) and `panoramic.js`.
  - `components/face/`: `FacialAnalysisViewer` (MediaPipe suggestions the doctor confirms, overlays, before/after).
  - `components/OrthodonticTreatmentPlan.vue`: assessment, plan and stages. Follow-up sessions are saved as the case's existing notes, using the `[تقويم]` quick fields.
  - `components/OrthodonticReports.vue` + `utils/reportHtml.js`: an RTL report printed by the browser, which also saves it as PDF.
  - `analysis/*.js`: the browser twins of the API calculators, for live preview. The API recomputes and stores the real results.
  - `composables/useOrthodontics.js`: `moduleEnabled`, `canView`, `canManage` and `showForCategory`.
- Integration points:
  - `views/cases/CaseDetail.vue`: the tab.
  - `views/patients/PatientDetail.vue`: the button on orthodontic cases.
  - `components/specialties/dental/DentalAddCaseModal.vue`: the notice, and the confirmation when leaving an orthodontic category.
  - `views/pages/Settings.vue`: the switch.
  - `views/settings/CaseCategories.vue`: the suggested orthodontic category.
  - `composables/useClinicSettings.js`: `orthodonticsEnabled`.

The module shows only when `enable_orthodontics` is on **and** the case's category has `is_orthodontic`. The API enforces the same rules on every request.

## Build notes (`vite.config.js`)

- `orthodonticsStaticAssets()` serves (in dev) and emits (in build) `cornerstone-wasm/*.wasm` (DICOM codecs) and `mediapipe/wasm/*` (the MediaPipe runtime).
- Heavy libraries are split into `ortho-three`, `ortho-cornerstone`, `ortho-mediapipe` and `ortho-fflate` chunks. They, the WASM files and the DICOM workers are excluded from the PWA precache.
- The PWA runtime cache uses `NetworkOnly` for `/orthodontics/`, so medical images and DICOM are never stored by the service worker.
- `worker.format = 'es'`. `optimizeDeps` excludes `@cornerstonejs/dicom-image-loader` and pre-bundles its CommonJS codecs.
- `events` is a direct dependency because Cornerstone's vtk.js pulls in xmlbuilder2, which needs Node's `events`. Without it, the CBCT viewer fails at load.

Optional env: `VITE_FACE_LANDMARKER_MODEL_URL` self-hosts the MediaPipe face model. Photos are always processed in the browser.

## Tests

```bash
node --test tests/orthodontics-analysis.test.mjs tests/orthodontics-cbct.test.mjs
```

- `orthodontics-analysis` checks the twins against the API's constructed fixtures (copied into `tests/fixtures/orthodontics`).
- `orthodontics-cbct` checks the panoramic and cross-section reconstruction on synthetic volumes.
