import { cn } from '@utils'
import type { QrFeedback } from '../types'

export function FeedbackBanner({ feedback }: { feedback: QrFeedback | null }) {
  if (!feedback) {
    return null
  }

  return (
    <p
      role={feedback.kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-lg border px-4 py-3 text-sm font-semibold',
        feedback.kind === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : feedback.kind === 'error'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-sky-200 bg-sky-50 text-sky-800',
      )}
    >
      {feedback.message}
    </p>
  )
}
