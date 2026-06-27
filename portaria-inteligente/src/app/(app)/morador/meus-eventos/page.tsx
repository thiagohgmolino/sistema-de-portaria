'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, ClipboardList } from 'lucide-react'
import { formatDate, EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { useProfile } from '@/hooks/useProfile'

export default function MeusEventosPage() {
  const [events, setEvents] = useState<any[]>([])
  const { profile } = useProfile()
  const supabase = createClient()

  useEffect(() => {
    if (!profile?.unit_id) return
    supabase
      .from('events')
      .select('*, common_area:common_areas(nome), unit:units(bloco,numero)')
      .eq('unit_id', profile.unit_id)
      .order('data_evento', { ascending: false })
      .then(({ data }) => setEvents(data ?? []))
  }, [profile])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Meus eventos</h1>
        <Link href="/eventos/novo">
          <Button>Solicitar evento</Button>
        </Link>
      </div>
      <div className="space-y-2">
        {events.map(ev => (
          <Card key={ev.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-gray-900">{ev.nome_evento}</p>
                    <Badge className={EVENT_STATUS_COLORS[ev.status]}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    <CalendarDays className="inline h-3 w-3 mr-1" />{formatDate(ev.data_evento)} · {ev.horario_inicio}–{ev.horario_fim}
                  </p>
                  <p className="text-sm text-gray-400">{ev.common_area?.nome}</p>
                </div>
                <Link href={`/morador/meus-eventos/${ev.id}/convidados`}>
                  <Button variant="outline" size="sm">
                    <ClipboardList className="h-3 w-3 mr-1" />Convidados
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhum evento ainda.</p>}
      </div>
    </div>
  )
}
