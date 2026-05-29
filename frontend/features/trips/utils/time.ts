export function normalizeTripTime(time?: string | null) {
  if (!time) {
    return '00:00'
  }

  const timeMatch = time.match(/\d{2}:\d{2}/)

  if (timeMatch) {
    return timeMatch[0]
  }

  const date = new Date(time)

  if (Number.isNaN(date.getTime())) {
    return '00:00'
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
