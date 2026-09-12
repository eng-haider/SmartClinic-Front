// null means the browser can return to an earlier authenticated app route.
// A direct link or a visit from login falls back to the relevant list or home.
export function getMobileBackTarget(router, route) {
  const previous = router.options.history.state.back
  if (typeof previous === 'string' && previous.startsWith('/') && !previous.startsWith('//')) {
    const resolved = router.resolve(previous)
    if (resolved.matched.some(record => record.meta.requiresAuth)) return null
  }
  if (['PatientDetail', 'OphthalmologyPatientDetail'].includes(route.name)) return { name: 'Patients' }
  if (route.name === 'CaseDetail') return { name: 'Cases' }
  return { name: 'Dashboard' }
}
