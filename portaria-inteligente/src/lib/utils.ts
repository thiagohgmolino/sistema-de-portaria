import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function formatPlate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
}

export const GUEST_STATUS_LABELS: Record<string, string> = {
  aguardado: 'Aguardado',
  chegou: 'Chegou',
  ausente: 'Ausente',
  barrado: 'Barrado',
  cancelado: 'Cancelado',
}

export const EVENT_STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  aguardando_aprovacao: 'bg-yellow-100 text-yellow-700',
  aprovado: 'bg-green-100 text-green-700',
  reprovado: 'bg-red-100 text-red-700',
  cancelado: 'bg-red-100 text-red-700',
  concluido: 'bg-blue-100 text-blue-700',
}

export const GUEST_STATUS_COLORS: Record<string, string> = {
  aguardado: 'bg-gray-100 text-gray-700',
  chegou: 'bg-green-100 text-green-700',
  ausente: 'bg-yellow-100 text-yellow-700',
  barrado: 'bg-red-100 text-red-700',
  cancelado: 'bg-gray-100 text-gray-500',
}
