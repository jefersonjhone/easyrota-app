import type { TripAdminDetail, TripPassengerEntry } from './trips-admin'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 42
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const FOOTER_Y = 24

type PdfFont = 'F1' | 'F2'

type PdfField = {
  label: string
  value: string
}

type PdfTableColumn = {
  label: string
  width: number
}

type PdfPage = {
  commands: string[]
}

const TABLE_COLUMNS: PdfTableColumn[] = [
  { label: '#', width: 24 },
  { label: 'Passageiro', width: 164 },
  { label: 'Documento', width: 78 },
  { label: 'Tipo', width: 86 },
  { label: 'Reserva', width: 76 },
  { label: 'Check-in', width: 72 },
]

export function isCompletedTripStatus(status: string | null | undefined) {
  return normalizeText(status ?? '') === 'CONCLUIDA'
}

export function downloadTripReportPdf(trip: TripAdminDetail) {
  if (!isCompletedTripStatus(trip.status)) {
    throw new Error('O relatorio em PDF so pode ser exportado para viagens concluidas.')
  }

  const pdfBytes = createTripReportPdf(trip)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = buildReportFileName(trip)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function createTripReportPdf(trip: TripAdminDetail) {
  const doc = new PdfDocument()
  const generatedAt = formatDateTime(new Date().toISOString())
  const departureTime = trip.trip_departure_time ?? trip.departure_time
  const arrivalTime = trip.trip_arrival_time ?? trip.arrival_time
  const busCapacity = trip.bus_capacity ?? trip.seating_capacity

  doc.title('Relatorio da viagem')
  doc.muted(`Gerado em ${generatedAt}`)
  doc.spacer(10)
  doc.rule()

  doc.section('Resumo')
  doc.fields([
    { label: 'Data', value: formatDate(trip.trip_date) },
    { label: 'Status', value: trip.status },
    { label: 'Rota', value: `${trip.origin} -> ${trip.destiny}` },
    { label: 'Horario da rota', value: `${trip.departure_time} -> ${trip.arrival_time}` },
    { label: 'Partida da viagem', value: departureTime },
    { label: 'Chegada da viagem', value: arrivalTime },
    { label: 'Motorista', value: formatDriver(trip) },
    { label: 'Onibus', value: formatBus(trip) },
    { label: 'Ocupacao', value: `${trip.active_reservations} / ${busCapacity} vagas` },
    { label: 'Check-ins', value: `${trip.checked_in_count} de ${trip.passengers.length} passageiros` },
  ])

  doc.section('Passageiros')
  doc.paragraph(`${trip.passengers.length} passageiros vinculados a esta viagem.`)
  doc.passengerTable(trip.passengers)

  return doc.toPdfBytes()
}

function formatDriver(trip: TripAdminDetail) {
  if (!trip.driver_name) return 'Nao atribuido'
  if (!trip.driver_cnh) return trip.driver_name
  return `${trip.driver_name} - CNH ${trip.driver_cnh}`
}

function formatBus(trip: TripAdminDetail) {
  if (!trip.bus_plate && !trip.bus_brand) return 'Nao atribuido'

  const parts = [trip.bus_plate, trip.bus_brand].filter(Boolean)
  const capacity = trip.bus_capacity ?? trip.seating_capacity
  return `${parts.join(' - ')} - ${capacity} lugares`
}

function buildReportFileName(trip: TripAdminDetail) {
  const route = slugify(`${trip.origin}-${trip.destiny}`)
  return `relatorio-viagem-${formatDateForFileName(trip.trip_date)}-${route}-${trip.id.slice(0, 8)}.pdf`
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}/${month}/${year}`
}

function formatDateForFileName(dateStr: string) {
  return dateStr.replace(/[^0-9-]/g, '')
}

function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'rota'
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function normalizeForPdf(value: unknown) {
  return String(value ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[→]/g, '->')
    .replace(/[•]/g, '-')
    .normalize('NFC')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapePdfString(value: unknown) {
  return normalizeForPdf(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function fitText(value: unknown, width: number, fontSize = 9) {
  const text = normalizeForPdf(value)
  const maxChars = Math.max(4, Math.floor(width / (fontSize * 0.52)))
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(1, maxChars - 3))}...`
}

function wrapText(value: unknown, width: number, fontSize = 10) {
  const text = normalizeForPdf(value)
  const maxChars = Math.max(8, Math.floor(width / (fontSize * 0.52)))

  if (text.length <= maxChars) return [text || '-']

  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars) {
      current = next
      continue
    }

    if (current) lines.push(current)
    current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}-` : word
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['-']
}

class PdfDocument {
  private pages: PdfPage[] = []
  private currentPage: PdfPage
  private y = PAGE_HEIGHT - MARGIN

  constructor() {
    this.currentPage = this.addPage()
  }

  title(text: string) {
    this.drawText(text, MARGIN, this.y, 18, 'F2')
    this.y -= 22
  }

  muted(text: string) {
    this.drawText(text, MARGIN, this.y, 9, 'F1')
    this.y -= 14
  }

  spacer(size = 8) {
    this.y -= size
  }

  rule() {
    this.ensureSpace(14)
    this.currentPage.commands.push(`0.75 w ${MARGIN} ${this.y} m ${PAGE_WIDTH - MARGIN} ${this.y} l S`)
    this.y -= 14
  }

  section(text: string) {
    this.ensureSpace(36)
    this.y -= 4
    this.drawText(text, MARGIN, this.y, 12, 'F2')
    this.y -= 18
  }

  paragraph(text: string) {
    const lines = wrapText(text, CONTENT_WIDTH, 10)
    this.ensureSpace(lines.length * 13 + 6)

    for (const line of lines) {
      this.drawText(line, MARGIN, this.y, 10, 'F1')
      this.y -= 13
    }

    this.y -= 6
  }

  fields(fields: PdfField[]) {
    const columnWidth = (CONTENT_WIDTH - 22) / 2

    for (let index = 0; index < fields.length; index += 2) {
      const left = fields[index]
      const right = fields[index + 1]
      const leftLines = wrapText(left.value, columnWidth, 10)
      const rightLines = right ? wrapText(right.value, columnWidth, 10) : []
      const rowHeight = 18 + Math.max(leftLines.length, rightLines.length, 1) * 12

      this.ensureSpace(rowHeight + 6)
      this.drawField(left, MARGIN, this.y, columnWidth)

      if (right) {
        this.drawField(right, MARGIN + columnWidth + 22, this.y, columnWidth)
      }

      this.y -= rowHeight
    }

    this.y -= 2
  }

  passengerTable(passengers: TripPassengerEntry[]) {
    this.ensureSpace(44)
    this.drawPassengerHeader()

    if (passengers.length === 0) {
      this.ensureSpace(24)
      this.drawText('Nenhum passageiro nesta viagem.', MARGIN, this.y, 10, 'F1')
      this.y -= 20
      return
    }

    passengers.forEach((passenger, index) => {
      if (this.y < MARGIN + 58) {
        this.currentPage = this.addPage()
        this.drawText('Passageiros (continuacao)', MARGIN, this.y, 12, 'F2')
        this.y -= 18
        this.drawPassengerHeader()
      }

      this.ensureSpace(24)
      this.drawPassengerRow(passenger, index + 1)
    })
  }

  toPdfBytes() {
    this.addFooters()
    return buildPdf(this.pages.map((page) => page.commands.join('\n')))
  }

  private addPage() {
    const page: PdfPage = { commands: [] }
    this.pages.push(page)
    this.y = PAGE_HEIGHT - MARGIN
    return page
  }

  private addFooters() {
    const totalPages = this.pages.length

    this.pages.forEach((page, index) => {
      const label = `Easy Rota - Pagina ${index + 1} de ${totalPages}`
      page.commands.push(`BT /F1 8 Tf ${MARGIN} ${FOOTER_Y} Td (${escapePdfString(label)}) Tj ET`)
    })
  }

  private ensureSpace(height: number) {
    if (this.y - height < MARGIN) {
      this.currentPage = this.addPage()
    }
  }

  private drawText(text: string, x: number, y: number, size: number, font: PdfFont) {
    this.currentPage.commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfString(text)}) Tj ET`)
  }

  private drawField(field: PdfField, x: number, y: number, width: number) {
    this.drawText(field.label.toUpperCase(), x, y, 7, 'F2')

    wrapText(field.value, width, 10).forEach((line, index) => {
      this.drawText(line, x, y - 13 - index * 12, 10, 'F1')
    })
  }

  private drawPassengerHeader() {
    let x = MARGIN

    this.ensureSpace(26)
    this.currentPage.commands.push(`0.5 w ${MARGIN} ${this.y + 6} m ${PAGE_WIDTH - MARGIN} ${this.y + 6} l S`)

    for (const column of TABLE_COLUMNS) {
      this.drawText(column.label.toUpperCase(), x, this.y, 8, 'F2')
      x += column.width
    }

    this.currentPage.commands.push(`0.5 w ${MARGIN} ${this.y - 8} m ${PAGE_WIDTH - MARGIN} ${this.y - 8} l S`)
    this.y -= 22
  }

  private drawPassengerRow(passenger: TripPassengerEntry, index: number) {
    let x = MARGIN
    const checkIn = passenger.check_in ? 'Sim' : 'Nao'
    const values = [
      String(index),
      passenger.passenger_name,
      passenger.passenger_id_display ?? '-',
      passenger.passenger_type,
      passenger.reservation_status ?? '-',
      checkIn,
    ]

    values.forEach((value, columnIndex) => {
      const column = TABLE_COLUMNS[columnIndex]
      this.drawText(fitText(value, column.width - 6, 9), x, this.y, 9, 'F1')
      x += column.width
    })

    if (passenger.checkin_date) {
      this.y -= 11
      this.drawText(`Check-in em ${formatDateTime(passenger.checkin_date)}`, MARGIN + TABLE_COLUMNS[0].width, this.y, 7, 'F1')
    }

    this.currentPage.commands.push(`0.25 w ${MARGIN} ${this.y - 7} m ${PAGE_WIDTH - MARGIN} ${this.y - 7} l S`)
    this.y -= 18
  }
}

function buildPdf(contentStreams: string[]) {
  const objects: string[] = []
  const pageObjectNumbers = contentStreams.map((_, index) => 5 + index * 2)
  const contentObjectNumbers = contentStreams.map((_, index) => 6 + index * 2)

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(' ')}] /Count ${contentStreams.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  contentStreams.forEach((stream, index) => {
    const pageObjectNumber = pageObjectNumbers[index]
    const contentObjectNumber = contentObjectNumbers[index]
    const streamLength = byteLength(stream)

    objects[pageObjectNumber] = [
      '<< /Type /Page',
      '/Parent 2 0 R',
      `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
      '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>',
      `/Contents ${contentObjectNumber} 0 R`,
      '>>',
    ].join(' ')

    objects[contentObjectNumber] = `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`
  })

  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let offset = 0

  const append = (value: string) => {
    const bytes = asciiBytes(value)
    chunks.push(bytes)
    offset += bytes.length
  }

  append('%PDF-1.4\n')

  for (let index = 1; index < objects.length; index += 1) {
    const object = objects[index]
    if (!object) continue

    offsets[index] = offset
    append(`${index} 0 obj\n${object}\nendobj\n`)
  }

  const xrefOffset = offset
  append(`xref\n0 ${objects.length}\n`)
  append('0000000000 65535 f \n')

  for (let index = 1; index < objects.length; index += 1) {
    append(`${String(offsets[index] ?? 0).padStart(10, '0')} 00000 n \n`)
  }

  append(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  return concatBytes(chunks)
}

function byteLength(value: string) {
  return asciiBytes(value).length
}

function asciiBytes(value: string) {
  const bytes = new Uint8Array(value.length)
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff
  }
  return bytes
}

function concatBytes(chunks: Uint8Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }

  return output
}
