'use client'

import { useCallback } from 'react'
import { toast as sonnerToast } from 'sonner'

export type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'default' }: ToastProps) => {
      if (variant === 'destructive') {
        sonnerToast.error(title, {
          description,
        })
      } else {
        sonnerToast(title, {
          description,
        })
      }
    },
    []
  )

  return { toast }
}
