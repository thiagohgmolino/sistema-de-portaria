'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, ClipboardList } from 'lucide-react'
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'

export default function EventosHojePage() {
  const [events, setEvents] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('events')
        .select('*, common_area:common_areas(nome), unit:units(bloco,numero), resident:residents(nome,telefone)')
        .eq('data_evento', today)
        .eq('status', 'aprovado')
        .order('horario_inicio')

      if (!data) return
      const withCounts = await Promise.all(data.map(async ev => {
        const [total, chegaram, barrados] = await Promise.all([
          supabase.from('event_guests').select('id', { count: 'exact' }).eq('event_id', ev.id).neq('status', 'cancelado'),
          supabase.from('event_guests').select('id', { count: 'exact' }).eq('event_id', ev.id).eq('status', 'chegou'),
          supabase.from('event_guests').select('id', { count: 'exact' }).eq('event_id', ev.id).eq('status', 'barrado'),
        ])
        return { ...ev, total: total.count ?? 0, chegaram: chegaram.count ?? 0, barrados: barrados.count ?? 0 }
      }))
      setEvents(withCounts)
    }
    load()
  }, [])

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Eventos de hoje</h1>
        <div className="text-center py-16 text-gray-400">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum evento aprovado para hoje.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Eventos de hoje</h1>
      <div className="space-y-3">
        {events.map(ev => (
          <Card key={ev.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900">{ev.nome_evento}</p>
                    <Badge className={EVENT_STATUS_COLORS[ev.status]}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    <CalendarDays className="inline h-3 w-3 mr-1" />
                    {ev.horario_inicio} às {ev.horario_fim} · {ev.common_area?.nome}
                  </p>
                  <p className="text-sm text-gray-500">
                    Bloco {ev.unit?.bloco}-{ev.unit?.numero} · {ev.resident?.nome}
                    {ev.resident?.telefone && ` · ${ev.resident.telefone}`}
                  </p>

                  <div className="flex gap-4 mt-3 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-lg">{ev.total}</p>
                      <p className="text-gray-400 text-xs">convidados</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600 text-lg">{ev.chegaram}</p>
                      <p className="text-gray-400 text-xs">chegaram</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-400 text-lg">{ev.total - ev.chegaram - ev.barrados}</p>
                      <p className="text-gray-400 text-xs">faltam</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-red-500 text-lg">{ev.barrados}</p>
                      <p className="text-gray-400 text-xs">barrados</p>
                    </div>
                  </div>
                </div>

                <Link href={`/portaria/eventos/${ev.id}/checklist`}>
                  <Button className="shrink-0">
                    <ClipboardList className="h-4 w-4 mr-1" /> Checklist
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
