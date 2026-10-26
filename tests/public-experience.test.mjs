import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { clinicBrandTokens, formatMoney, formatPublicDate, phoneHref, whatsappHref } from '../src/utils/publicExperience.js'

test('public formatting stays localized and safe for clinic finance/contact details', () => {
  assert.match(formatPublicDate('2026-10-05', 'en'), /2026/)
  assert.match(formatPublicDate('2026-10-05', 'ar'), /٢٠٢٦|2026/)
  assert.match(formatMoney(150000, 'IQD', 'en'), /150,000|150\s?000/)
  assert.equal(phoneHref('0770 123 4567'), 'tel:07701234567')
  assert.equal(phoneHref('bad'), '')
  assert.equal(whatsappHref('+964 770 123 4567'), 'https://wa.me/9647701234567')
})

test('clinic brand variables retain a safe text foreground for light and dark brand colours', () => {
  assert.equal(clinicBrandTokens('#ffffff')['--clinic-primary-foreground'], 'rgb(15, 35, 52)')
  assert.equal(clinicBrandTokens('#17638d')['--clinic-primary-foreground'], 'rgb(255, 255, 255)')
  assert.equal(clinicBrandTokens('not-a-colour')['--clinic-primary'], 'rgb(23, 99, 141)')
})

test('public routes preserve privacy and clinic-route compatibility in the source', () => {
  const patient = readFileSync(new URL('../src/views/PublicPatientProfile.vue', import.meta.url), 'utf8')
  const router = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8')
  assert.match(patient, /noindex:\s*true/)
  assert.doesNotMatch(patient, /console\.log/)
  assert.match(router, /path:\s*'\/public\/patient\/:token'/)
  assert.match(router, /path:\s*'\/clinic\/:slug'/)
})
