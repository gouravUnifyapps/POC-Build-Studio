import { toast } from 'sonner'

export const ok = (title: string, description?: string) => toast.success(title, { description })
export const warn = (title: string, description?: string) => toast.warning(title, { description })
export const fail = (title: string, error?: unknown) =>
  toast.error(title, { description: error instanceof Error ? error.message : 'Try again in a moment.' })
