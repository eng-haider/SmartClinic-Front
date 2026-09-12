const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function sheetName(name, index, usedNames) {
  const base = String(name || `Sheet ${index + 1}`)
    .replace(/[\\/*?:\[\]\u0000-\u001f]/g, ' ')
    .replace(/^'+|'+$/g, '')
    .trim()
    .slice(0, 31) || `Sheet ${index + 1}`
  let candidate = base
  let suffix = 2
  while (usedNames.has(candidate.toLowerCase())) {
    const ending = ` (${suffix++})`
    candidate = `${base.slice(0, 31 - ending.length)}${ending}`
  }
  usedNames.add(candidate.toLowerCase())
  return candidate
}

function cellValue(value) {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'boolean' || value instanceof Date) return value
  // Plain strings are stored as text by ExcelJS, even when starting with =, +, - or @.
  // Never pass through objects: ExcelJS interprets { formula } and { hyperlink } specially.
  return String(value)
}

/**
 * Build an XLSX workbook without downloading it (also usable in tests).
 * Rows are objects addressed by column.key. Supply phone numbers as strings to
 * retain leading zeroes; amounts should be numbers so Excel can calculate totals.
 * A column may provide width and an Excel number format in format.
 */
export async function buildWorkbook({ sheets, rtl = true }) {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    throw new Error('At least one worksheet is required for an Excel export.')
  }

  // Keep the spreadsheet library out of the initial page bundle.
  const module = await import('exceljs')
  const ExcelJS = module.default || module
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SmartClinic'
  workbook.created = new Date()
  const usedNames = new Set()

  sheets.forEach(({ name, columns, rows = [] }, index) => {
    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error('Each worksheet must have at least one column.')
    }

    const sheet = workbook.addWorksheet(sheetName(name, index, usedNames), {
      views: [{ state: 'frozen', ySplit: 1, rightToLeft: Boolean(rtl), showGridLines: false }],
      properties: { defaultRowHeight: 23 },
    })
    sheet.columns = columns.map(({ header, key, width }) => ({
      header: String(header ?? key),
      key,
      width: width || 22,
    }))

    for (const record of rows) {
      const row = sheet.addRow(columns.map(({ key }) => cellValue(record[key])))
      row.eachCell({ includeEmpty: true }, (cell, columnIndex) => {
        cell.font = { name: 'Arial', size: 11, color: { argb: 'FF1E293B' } }
        cell.alignment = {
          vertical: 'middle',
          horizontal: typeof cell.value === 'number' ? 'right' : rtl ? 'right' : 'left',
          readingOrder: rtl ? 'rtl' : 'ltr',
        }
        const column = columns[columnIndex - 1]
        if (typeof cell.value === 'string') cell.numFmt = '@'
        else if (column.format) cell.numFmt = column.format
        else if (typeof cell.value === 'number') cell.numFmt = '#,##0.##'
        else if (cell.value instanceof Date) cell.numFmt = 'yyyy-mm-dd hh:mm'
        if (row.number % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
        }
      })
    }

    const headerRow = sheet.getRow(1)
    headerRow.height = 32
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
      cell.alignment = {
        vertical: 'middle',
        horizontal: rtl ? 'right' : 'left',
        readingOrder: rtl ? 'rtl' : 'ltr',
        wrapText: true,
      }
    })
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(sheet.rowCount, 1), column: columns.length },
    }
  })

  return workbook
}

/** Download one genuine .xlsx file containing the supplied worksheets. */
export async function exportWorkbook({ filename = 'SmartClinic.xlsx', sheets, rtl = true }) {
  const workbook = await buildWorkbook({ sheets, rtl })
  const buffer = await workbook.xlsx.writeBuffer()
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME }))
  const link = document.createElement('a')
  const safeFilename = String(filename).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').trim() || 'SmartClinic'
  link.href = url
  link.download = /\.xlsx$/i.test(safeFilename) ? safeFilename : `${safeFilename}.xlsx`
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    link.remove()
    // Give browsers time to start reading the Blob before releasing its URL.
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }
}
