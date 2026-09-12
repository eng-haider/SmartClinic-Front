import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, effectScope, nextTick, ref, watch } from 'vue'
import { buildWorkbook } from '../src/utils/excelExport.js'

// Exercise the actual compiled component setup with real Vue reactivity. Only
// external services, navigation, lifecycle and the download boundary are mocked.
const filename = new URL('../src/views/pages/Bills.vue', import.meta.url)
const { descriptor } = parse(readFileSync(filename, 'utf8'))
const setupSource = compileScript(descriptor, { id: 'billing-test' }).content
  .replace(/^import .*\n/gm, '')
  .replace('export default', 'return')
const messages = JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8'))
const translate = key => key.split('.').reduce((value, part) => value?.[part], messages) ?? key
const patient = { id: 1, name: 'Sara', phone: '07701234567', case_count: 2, total_price: 300, paid_amount: 100, period_paid_amount: 40, unpaid_amount: 200, payment_status: 'unpaid', last_payment_at: '2026-09-09 10:00:00' }
const bill = { id: 9, patient: { id: 1, name: 'Sara', phone: '07701234567' }, price: 100, is_paid: true, created_at: '2026-09-09 10:00:00' }
const response = (data, extra = {}) => ({ data, pagination: { total: data.length, last_page: 1 }, summary: { total_price: 300, paid_amount: 100, period_paid_amount: 40, unpaid_amount: 200, patient_count: 1 }, ...extra })
async function flush() { await nextTick(); await Promise.resolve(); await nextTick() }
function harness(context, { query = {}, permission = true, overrides = {} } = {}) {
  const calls = []; const downloads = []; const cleanups = []; const navigation = []
  const defaults = {
    getPatientBalances: async () => response([{ ...patient }]),
    getPayments: async params => response([{ ...bill, price: params.date_from || params.date_to ? 40 : 100 }], { summary: { paid_amount: params.date_from || params.date_to ? 40 : 100, payment_count: 1 } }),
    getPatientBillHistory: async () => response([{ ...bill }], { patient_balance: { ...patient } }),
    delete: async () => ({ success: true })
  }
  const api = Object.fromEntries(Object.entries({ ...defaults, ...overrides }).map(([name, method]) => [name, (...args) => {
    calls.push({ name, args: structuredClone(args) }); return method(...args)
  }]))
  const bindings = {
    computed, ref, watch, onMounted() {}, onBeforeUnmount(callback) { cleanups.push(callback) },
    useI18n: () => ({ t: translate, locale: ref('ar') }),
    useRoute: () => ({ query }), useRouter: () => ({ replace(value) { navigation.push(value) } }),
    useAuthStore: () => ({ hasPermission: () => permission }),
    useClinicSettings: () => ({ formatToothLabel: value => String(value) }),
    billService: api, DoctorService: { getActive: async () => ({ data: [] }) }, BillingPaymentsTable: {},
    exportWorkbook: async data => { downloads.push(data) }
  }
  const component = new Function(...Object.keys(bindings), setupSource)(...Object.values(bindings))
  const scope = effectScope()
  const vm = scope.run(() => component.setup({}, { expose() {} }))
  context.after(() => { cleanups.forEach(callback => callback()); scope.stop() })
  return { vm, calls, downloads, navigation }
}

test('one patient table defaults to all time, three cards and latest payment sorting', async context => {
  const { vm, calls } = harness(context)
  await flush()
  assert.equal(vm.summaryCards.value.length, 3)
  assert.equal(vm.datePreset.value, 'all')
  assert.equal(vm.paidKey.value, 'paid_amount')
  assert.equal(calls[0].args[0].sort, '-last_payment_at')
  assert.equal(calls[0].args[0].date_from, undefined)
  assert.equal(descriptor.template.content.includes('<v-tabs'), false)
  assert.equal(descriptor.template.content.includes('#expanded-row'), true)
  vm.currentPage.value = 3; vm.paymentStatus.value = 'unpaid'; vm.doctorId.value = 7
  await flush()
  assert.equal(vm.currentPage.value, 1)
  assert.equal(calls.at(-1).args[0].payment_status, 'unpaid')
  assert.equal(calls.at(-1).args[0].doctor_id, 7)
  vm.search.value = '0770'; await flush()
  assert.equal(vm.searchPending.value, true)
  await new Promise(resolve => setTimeout(resolve, 380)); await flush()
  assert.equal(calls.at(-1).args[0].search, '0770')
})

test('period filtering uses the balances endpoint, labels period amounts, and rejects invalid ranges', async context => {
  const { vm, calls } = harness(context, { query: { date_from: '2026-09-01', date_to: '2026-09-09' } })
  await flush()
  assert.equal(calls[0].name, 'getPatientBalances')
  assert.equal(calls[0].args[0].date_from, '2026-09-01')
  assert.equal(vm.paidKey.value, 'period_paid_amount')
  assert.equal(vm.summaryCards.value[1].value, 40)
  assert.equal(vm.summaryCards.value[2].value, 200)
  assert.equal(vm.patientHeaders.value.find(h => h.key === 'paid_amount').title, 'Paid during the period')
  vm.patientSort.value = [{ key: 'paid_amount', order: 'desc' }]; await flush()
  assert.equal(calls.at(-1).args[0].sort, '-period_paid_amount')
  vm.patientSort.value = [{ key: 'unpaid_amount', order: 'desc' }]; await flush()
  assert.equal(calls.at(-1).args[0].sort, '-unpaid_amount')
  const count = calls.length
  vm.dateFrom.value = '2026-09-10'; await flush()
  assert.equal(vm.invalidDates.value, true)
  assert.equal(calls.length, count)
  assert.equal(vm.rows.value.length, 0)
  vm.clearFilters(); await flush()
  assert.equal(vm.paidKey.value, 'paid_amount')
  assert.equal(vm.datePreset.value, 'all')
  assert.equal(vm.invalidDates.value, false)
})

test('quick dates use local calendar days and changing shared filters closes expanded payments', async context => {
  const { vm } = harness(context)
  await flush()
  vm.datePreset.value = 'today'; await flush()
  assert.equal(vm.dateFrom.value, vm.localDate(new Date()))
  assert.equal(vm.dateTo.value, vm.dateFrom.value)
  vm.openPatientPayments(patient); await flush()
  assert.deepEqual(vm.expanded.value, [1])
  vm.datePreset.value = 'month'; await flush()
  assert.equal(vm.dateFrom.value.endsWith('-01'), true)
  assert.equal(vm.expanded.value.length, 0)
  vm.datePreset.value = 'week'; await flush()
  assert.deepEqual({ from: vm.dateFrom.value, to: vm.dateTo.value }, vm.presetRange('week'))
  assert.deepEqual(vm.presetRange('week', new Date(2026, 0, 1)), { from: '2025-12-27', to: '2026-01-01' })
  assert.deepEqual(vm.presetRange('week', new Date(2026, 0, 3)), { from: '2026-01-03', to: '2026-01-03' })
  vm.datePreset.value = 'year'; await flush()
  assert.equal(vm.dateFrom.value, `${new Date().getFullYear()}-01-01`)
  assert.equal(vm.dateTo.value, vm.localDate(new Date()))
  vm.updateDateRange('from', '2000-01-01'); await flush()
  assert.equal(vm.datePreset.value, 'custom')
  assert.equal(vm.dateFrom.value, '2000-01-01')
  vm.updateDateRange('from', vm.localDate(new Date())); await flush()
  assert.equal(vm.datePreset.value, 'today')
  vm.updateDateRange('from', null); vm.updateDateRange('to', null); await flush()
  assert.equal(vm.datePreset.value, 'all')
  vm.clearFilters(); await flush()
  assert.equal(vm.dateFrom.value, '')
  assert.equal(vm.dateTo.value, '')
})

test('a slower old response cannot overwrite a newer filter result', async context => {
  const pending = []
  const { vm } = harness(context, { overrides: { getPatientBalances: () => new Promise(resolve => pending.push(resolve)) } })
  vm.paymentStatus.value = 'paid'; await flush()
  pending[1](response([{ ...patient, id: 2, name: 'Newest' }])); await flush()
  pending[0](response([{ ...patient, name: 'Outdated' }])); await flush()
  assert.equal(vm.rows.value[0].name, 'Newest')
  assert.equal(vm.loading.value, false)
})

test('one export includes every patient page and payments with the same doctor, dates and status', async context => {
  const patients = Array.from({ length: 501 }, (_, i) => ({ ...patient, id: i + 1 }))
  const { vm, calls, downloads } = harness(context, { overrides: {
    getPatientBalances: async params => params.per_page === 500
      ? response(patients.slice((params.page - 1) * 500, params.page * 500), { pagination: { total: 501, last_page: 2 } }) : response([patient])
  } })
  await flush()
  vm.paymentStatus.value = 'unpaid'; vm.doctorId.value = 7; vm.dateFrom.value = '2026-09-01'
  await flush(); await vm.exportData()
  assert.equal(downloads.length, 1)
  assert.equal(downloads[0].sheets.length, 3)
  assert.equal(downloads[0].sheets[1].rows.length, 501)
  assert.equal(downloads[0].sheets[1].rows[0].phone, '07701234567')
  assert.equal(typeof downloads[0].sheets[1].rows[0].period_paid_amount, 'number')
  assert.equal(downloads[0].sheets[1].columns.find(c => c.key === 'period_paid_amount').header, 'Paid during the period')
  const exported = calls.filter(c => c.args[0]?.per_page === 500)
  assert.deepEqual(exported.filter(c => c.name === 'getPatientBalances').map(c => c.args[0].page), [1, 2])
  for (const call of exported) {
    assert.equal(call.args[0].doctor_id, 7)
    assert.equal(call.args[0].date_from, '2026-09-01')
    assert.equal(call.args[0].payment_status, 'unpaid')
  }
})

test('incomplete pages and mismatched financial totals fail instead of producing a partial export', async context => {
  const { vm, downloads } = harness(context, { overrides: { getPayments: async () => response([bill], { summary: { paid_amount: 999 } }) } })
  await flush()
  await assert.rejects(vm.fetchAll(async () => response([patient], { pagination: { total: 2, last_page: 1 } }), {}))
  await assert.rejects(vm.fetchAll(async () => response([patient], { pagination: { total: 2, last_page: 2 } }), {}))
  await vm.exportData()
  assert.equal(downloads.length, 0)
  assert.equal(vm.snackbar.value.color, 'error')
})

test('inline details request only paid payments in the shared period and do not refetch on balance refresh', async context => {
  const { vm, calls } = harness(context, { query: { doctor_id: '7', date_from: '2026-09-01', date_to: '2026-09-09' } })
  await flush(); vm.openPatientPayments(patient); await flush()
  const history = calls.filter(c => c.name === 'getPayments')
  assert.equal(history.length, 1)
  assert.equal(history[0].args[0].patient_id, 1)
  assert.equal(history[0].args[0].doctor_id, 7)
  assert.equal(history[0].args[0].date_to, '2026-09-09')
  assert.equal(vm.historyRows.value[0].is_paid, true)
  await vm.loadRows(); await flush()
  assert.equal(calls.filter(c => c.name === 'getPayments').length, 1)
  vm.openPatientPayments(patient); await flush()
  assert.equal(vm.expanded.value.length, 0)
})

test('deletion refreshes patient totals and expanded payments, while missing permission blocks deletion', async context => {
  let paid = 100
  const { vm } = harness(context, { overrides: {
    delete: async () => { paid = 0 },
    getPatientBalances: async () => response([{ ...patient, paid_amount: paid, unpaid_amount: 300 - paid }]),
    getPayments: async () => response(paid ? [bill] : [])
  } })
  await flush(); vm.openPatientPayments(patient); await flush()
  vm.confirmDelete(bill); await vm.deleteBill(); await flush()
  assert.equal(vm.selectedPatient.value.paid_amount, 0)
  assert.equal(vm.historyRows.value.length, 0)
  assert.equal(vm.deleteDialog.value, false)
  const blocked = harness(context, { permission: false })
  await flush(); blocked.vm.confirmDelete(bill); await blocked.vm.deleteBill()
  assert.equal(blocked.calls.some(c => c.name === 'delete'), false)
})

test('XLSX preserves Arabic, leading zeros, numeric amounts and literal formula-like text', async () => {
  const workbook = await buildWorkbook({ rtl: true, sheets: [{ name: 'حسابات المرضى', columns: [
    { header: 'المريض', key: 'name' }, { header: 'الهاتف', key: 'phone' }, { header: 'المبلغ', key: 'amount' }
  ], rows: [{ name: 'سارة', phone: '07701234567', amount: 125000 }, { name: '=SUM(A1)', phone: '+9647701234567', amount: 5000 }] }] })
  const bytes = await workbook.xlsx.writeBuffer()
  assert.equal(bytes.subarray(0, 2).toString(), 'PK')
  const module = await import('exceljs')
  const restored = new module.default.Workbook()
  await restored.xlsx.load(bytes)
  const sheet = restored.worksheets[0]
  assert.equal(sheet.getCell('A2').value, 'سارة')
  assert.equal(sheet.getCell('B2').value, '07701234567')
  assert.equal(sheet.getCell('C2').value, 125000)
  assert.equal(sheet.getCell('A3').value, '=SUM(A1)')
  assert.equal(sheet.getCell('A3').formula, undefined)
  assert.equal(sheet.views[0].rightToLeft, true)
  assert.equal(sheet.views[0].ySplit, 1)
})
