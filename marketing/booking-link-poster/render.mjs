// Renders the online-booking poster to PNG (Story 1080x1920 + Post 1080x1350).
//
//   node marketing/booking-link-poster/render.mjs
//   node marketing/booking-link-poster/render.mjs --name "عيادة د. أحمد" --link "https://app.smartclinic.software/clinic/ahmed"
//
// With --link the bottom bar becomes a QR code + the link; without it, a generic
// "tap the link" bar so the doctor can put the link in the caption / story sticker.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import QRCode from 'qrcode'

const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, i, all) => {
  if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]?.startsWith('--') ? '' : (all[i + 1] ?? '')])
  return pairs
}, []))

const name = args.name || ''
const link = args.link || ''
const outDir = args.out || dirname(here)
const suffix = args.suffix ? `-${args.suffix}` : ''
const qr = link ? await QRCode.toString(link, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1b1d3a', light: '#ffffff' } }) : ''

writeFileSync(join(here, 'config.js'), `window.POSTER = ${JSON.stringify({ name, link, qr })}\n`)

const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const profile = mkdtempSync(join(tmpdir(), 'poster-chrome-'))
const sizes = { story: [1080, 1920], post: [1080, 1350] }

for (const [format, [width, height]] of Object.entries(sizes)) {
  const out = join(outDir, `SmartClinic-Online-Booking-${format === 'story' ? 'Story' : 'Post'}-${width}x${height}${suffix}.png`)
  const url = `${pathToFileURL(join(here, 'poster.html')).href}?format=${format}`
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`, '--allow-file-access-from-files', '--virtual-time-budget=10000',
    `--window-size=${width},${height}`, `--screenshot=${out}`, url,
  ], { stdio: 'ignore' })
  console.log(out)
}
