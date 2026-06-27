'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Package, CalendarDays, DoorOpen, UserCheck, Truck } from 'lucide-react'
import { formatDateTime, EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'

interface Stats {
  dentroAgora: number
  entradasHoje: number
  saidasHoje: number
  encomendasPendentes: number
  encomendasEntreguesHoje: number
  eventosHoje: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ dentroAgora: 0, entradasHoje: 0, saidasHoje: 0, encomendasPendentes: 0, encomendasEntreguesHoje: 0, eventosHoje: 0 })
  const [eventosHoje, setEventosHoje] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]

      const [dentro, entradas, saidas, encPendentes, encEntregues, eventos] = await Promise.all([
        supabase.from('access_logs').select('id', { count: 'exact' }).eq('status', 'dentro'),
        supabase.from('access_logs').select('id', { count: 'exact' }).gte('entrada_em', today),
        supabase.from('access_logs').select('id', { count: 'exact' }).gte('saida_em', today).not('saida_em', 'is', null),
        supabase.from('packages').select('id', { count: 'exact' }).eq('status', 'pendente'),
        supabase.from('packages').select('id', { count: 'exact' }).eq('status', 'entregue').gte('entregue_em', today),
        supabase.from('events').select('*, common_area:common_areas(nome), unit:units(bloco,numero), resident:residents(nome)').eq('data_evento', today).in('status', ['aprovado']),
      ])

      setStats({
        dentroAgora: dentro.count ?? 0,
        entradasHoje: entradas.count ?? 0,
        saidasHoje: saidas.count ?? 0,
        encomendasPendentes: encPendentes.count ?? 0,
        encomendasEntreguesHoje: encEntregues.count ?? 0,
        eventosHoje: eventos.data?.length ?? 0,
      })

      if (eventos.data) {
        const eventosComConvidados = await Promise.all(
          eventos.data.map(async (ev) => {
            const [total, chegaram] = await Promise.all([
              supabase.from('event_guests').select('id', { count: 'exact' }).eq('event_id', ev.id),
              supabase.from('event_guests').select('id', { count: 'exact' }).eq('event_id', ev.id).eq('status', 'chegou'),
            ])
            return { ...ev, totalConvidados: total.count ?? 0, chegaram: chegaram.count ?? 0 }
          })
        )
        setEventosHoje(eventosComConvidados)
      }
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Dentro agora', value: stats.dentroAgora, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/portaria/dentro-agora' },
    { label: 'Entradas hoje', value: stats.entradasHoje, icon: DoorOpen, color: 'text-green-600', bg: 'bg-green-50', href: '/portaria/nova-entrada' },
    { label: 'Saídas hoje', value: stats.saidasHoje, icon: UserCheck, color: 'text-gray-600', bg: 'bg-gray-100', href: '/portaria/dentro-agora' },
    { label: 'Encomendas pendentes', value: stats.encomendasPendentes, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', href: '/encomendas' },
    { label: 'Encomendas entregues', value: stats.encomendasEntreguesHoje, icon: Package, color: 'text-green-600', bg: 'bg-green-50', href: '/encomendas' },
    { label: 'Eventos hoje', value: stats.eventosHoje, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50', href: '/portaria/eventos-hoje' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${s.bg} p-2 rounded-lg`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {eventosHoje.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Eventos de hoje</h2>
          <div className="space-y-3">
            {eventosHoje.map(ev => (
              <Card key={ev.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{ev.nome_evento}</p>
                        <Badge className={EVENT_STATUS_COLORS[ev.status]}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {ev.common_area?.nome} · {ev.unit?.bloco}-{ev.unit?.numero} · {ev.horario_inicio} às {ev.horario_fim}
                      </p>
                      <p className="text-sm text-gray-500">Responsável: {ev.resident?.nome}</p>
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <p className="font-medium text-gray-900">{ev.totalConvidados} convidados</p>
                      <p className="text-green-600">{ev.chegaram} chegaram</p>
                      <p className="text-gray-500">{ev.totalConvidados - ev.chegaram} faltam</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/portaria/eventos/${ev.id}/checklist`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Abrir checklist →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
