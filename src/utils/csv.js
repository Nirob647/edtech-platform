// Minimal CSV parser: handles quoted fields (with commas/newlines inside quotes) and \r\n line endings.
// Returns an array of row objects keyed by the header row.
export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { pushField(); rows.push(row); row = [] }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++ }
      else if (char === '"') { inQuotes = false }
      else { field += char }
    } else {
      if (char === '"') inQuotes = true
      else if (char === ',') pushField()
      else if (char === '\r') { /* skip */ }
      else if (char === '\n') { pushRow() }
      else field += char
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  const nonEmptyRows = rows.filter(r => r.some(c => c.trim() !== ''))
  if (nonEmptyRows.length === 0) return []

  const headers = nonEmptyRows[0].map(h => h.trim().toLowerCase())
  return nonEmptyRows.slice(1).map(r => {
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = (r[idx] || '').trim() })
    return obj
  })
}

export function downloadCSVTemplate() {
  const template = `question,option_a,option_b,option_c,option_d,correct_answer,explanation,difficulty
"What is consideration in contract law?","Something of value exchanged","A written document","A verbal promise","A court order","A","Consideration is the value exchanged between parties in a contract.","medium"
"Which of these is NOT an element of a valid contract?","Offer","Acceptance","Consideration","Witness signature","D","A witness is not always required for a valid contract.","easy"
`
  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'question-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
