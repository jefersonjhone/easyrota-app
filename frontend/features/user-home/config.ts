export const userHomeQueryKeys = {
  currentTrip: ['user-home', 'current-trip'] as const,
  reservationHistory: ['user-home', 'reservation-history'] as const,
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const historyFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const statusToneMap: Record<string, string> = {
  'CONCLUÍDA': 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/20',
  CONCLUIDA: 'bg-emerald-500/10 text-emerald-700 ring-emerald-600/20',
  CONFIRMADA: 'bg-primary/10 text-primary ring-primary/20',
  PENDENTE: 'bg-amber-500/10 text-amber-700 ring-amber-600/20',
  FALTA: 'bg-rose-500/10 text-rose-700 ring-rose-600/20',
  CANCELADA: 'bg-muted text-muted-foreground ring-border',
  'EM ANDAMENTO': 'bg-sky-500/10 text-sky-700 ring-sky-600/20',
  'RISCO DE CANCELAMENTO': 'bg-amber-500/10 text-amber-700 ring-amber-600/20',
}

export function formatTripDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00`))
}

export function formatReservationCreatedAt(value: string) {
  return historyFormatter.format(new Date(value))
}

export function getStatusTone(status: string) {
  return statusToneMap[status] ?? 'bg-muted text-muted-foreground ring-border'
}

export function getFriendlyError(error: unknown, fallback: string) {
  const errorData = error as { data?: { detail?: string } } | undefined
  const detail = errorData?.data?.detail

  if (!detail) {
    return fallback
  }

  if (detail.includes('Given token not valid')) {
    return 'Token inválido. Faça login novamente.'
  }

  if (detail.includes('Token is invalid')) {
    return 'Token inválido ou expirado. Faça login novamente.'
  }

  if (detail.includes('Authentication credentials')) {
    return 'Faça login para acessar este painel.'
  }

  if (detail.includes('Nenhuma viagem')) {
    return 'Ainda não há uma viagem próxima vinculada ao seu perfil.'
  }

  return detail
}
