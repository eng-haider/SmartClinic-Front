import test from 'node:test'
import assert from 'node:assert/strict'
import { createRouter, createMemoryHistory } from 'vue-router'
import { getMobileBackTarget } from '../src/utils/mobileNavigation.js'

function setup(previous) {
  const history = createMemoryHistory()
  const router = createRouter({
    history,
    routes: [
      { path: '/login', component: {} },
      { path: '/', meta: { requiresAuth: true }, component: {}, children: [
        { path: '', name: 'Dashboard', component: {} },
        { path: 'patients', name: 'Patients', component: {} },
        { path: 'patients/:id', name: 'PatientDetail', component: {} },
        { path: 'cases', name: 'Cases', component: {} }
      ] }
    ]
  })
  history.replace('/patients/43', { back: previous })
  return router
}

test('returns through history to the patient list, preserving its query filters', () => {
  const router = setup('/patients?page=3&payment_status=has_unpaid_cases')
  assert.equal(getMobileBackTarget(router, { name: 'PatientDetail' }), null)
})

test('direct patient links fall back to the patients list', () => {
  for (const name of ['PatientDetail', 'OphthalmologyPatientDetail']) {
    assert.deepEqual(getMobileBackTarget(setup(null), { name }), { name: 'Patients' })
  }
})

test('back never sends a user to login or an external site', () => {
  for (const previous of ['/login', 'https://example.com', '//example.com']) {
    assert.deepEqual(getMobileBackTarget(setup(previous), { name: 'Patients' }), { name: 'Dashboard' })
  }
})

test('direct case links fall back to the cases list', () => {
  assert.deepEqual(getMobileBackTarget(setup(null), { name: 'CaseDetail' }), { name: 'Cases' })
})

test('back from a list can return to the dashboard', () => {
  assert.equal(getMobileBackTarget(setup('/'), { name: 'Patients' }), null)
})
