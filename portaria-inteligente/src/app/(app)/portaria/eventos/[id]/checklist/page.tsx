'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, UserPlus, Search, Phone } from 'lucide-react'
import type { EventGuest } from '@/types/database'
import { toast } from 'sonner'
import { formatDateTime, GUEST_STATUS_COLORS, GUEST_STATUS_LABELS } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'

const MOTIVOS_BARRADO = ['Nome não localizado', 'Documento divergente', 'Orientação do morador', 'Comportamento inadequado', 'Evento cancelado', 'Outro']

export default function ChecklistPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [search, setSearch] = useState('')
  const [checkInGuest, setCheckInGuest] = useState<EventGuest | null>(null)
  const [barrarGuest, setBarrarGuest] = useState<EventGuest | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [checkInForm, setCheckInForm] = useState({ acompanhantes_presentes: '', placa: '', observacao_portaria: '' })
  const [barrarForm, setBarrarForm] = useState<{ motivo_barrado: string | null; observacao_portaria: string }>({ motivo_barrado: '', observacao_portaria: '' })
  const [manualForm, setManualForm] = useState({ nome: '', documento: '', telefone: '', autorizado_por_nome: '', observacao_portaria: '' })
  const { profile } = useProfile()
  const supabase = createClient()

  async function load() {
    const [ev, gs] = await Promise.all([
      supabase.from('events').select('*, common_area:common_areas(nome), unit:units(bloco,numero), resident:residents(nome)').eq('id', id).single(),
      supabase.from('event_guests').select('*').eq('event_id', id).order('nome'),
    ])
    setEvent(ev.data)
    setGuests(gs.data ?? [])
  }

  useEffect(() => { load() }, [id])

  async function confirmarChegada() {
    if (!checkInGuest) return
    const now = new Date().toISOString()
    const { data: log } = await supabase.from('access_logs').insert({
      tipo_pessoa: 'convidado_evento', event_id: id as string, event_guest_id: checkInGuest.id,
      nome_avulso: checkInGuest.nome, placa: checkInForm.placa || checkInGuest.placa || null,
      status: 'dentro', entrada_em: now, entrada_por_user_id: profile?.id ?? '',
      updated_at: now
    }).select().single()

    await supabase.from('event_guests').update({
      status: 'chegou', checkin_em: now, checkin_por_user_id: profile?.id,
      acompanhantes_presentes: checkInForm.acompanhantes_presentes ? parseInt(checkInForm.acompanhantes_presentes) : null,
      observacao_portaria: checkInForm.observacao_portaria || null,
      access_log_id: log?.id ?? null, updated_at: now
    }).eq('id', checkInGuest.id)

    toast.success(`✓ ${checkInGuest.nome} confirmado`)
    setCheckInGuest(null)
    setCheckInForm({ acompanhantes_presentes: '', placa: '', observacao_portaria: '' })
    load()
  }

  async function barrarConvidado() {
    if (!barrarGuest || !barrarForm.motivo_barrado) { toast.error('Informe o motivo'); return }
    const now = new Date().toISOString()
    await supabase.from('event_guests').update({
      status: 'barrado', barrado_em: now, barrado_por_user_id: profile?.id,
      motivo_barrado: barrarForm.motivo_barrado, observacao_portaria: barrarForm.observacao_portaria || null,
      updated_at: now
    }).eq('id', barrarGuest.id)
    toast.success(`${barrarGuest.nome} barrado`)
    setBarrarGuest(null)
    setBarrarForm({ motivo_barrado: '', observacao_portaria: '' })
    load()
  }

  async function entradaManual() {
    if (!manualForm.nome || !manualForm.autorizado_por_nome) { toast.error('Nome e autorização são obrigatórios'); return }
    const now = new Date().toISOString()
    const { data: guest } = await supabase.from('event_guests').insert({
      event_id: id as string, nome: manualForm.nome, documento: manualForm.documento || null,
      telefone: manualForm.telefone || null, autorizado_por_nome: manualForm.autorizado_por_nome,
      observacao_portaria: manualForm.observacao_portaria, status: 'chegou', entrada_manual: true,
      crianca: false, veiculo_autorizado: false, checkin_em: now, checkin_por_user_id: profile?.id,
      updated_at: now
    }).select().single()

    await supabase.from('access_logs').insert({
      tipo_pessoa: 'convidado_evento', event_id: id as string, event_guest_id: guest?.id,
      nome_avulso: manualForm.nome, status: 'dentro', entrada_em: now,
      entrada_por_user_id: profile?.id ?? '', updated_at: now
    })

    toast.success('Entrada manual registrada')
    setManualOpen(false)
    setManualForm({ nome: '', documento: '', telefone: '', autorizado_por_nome: '', observacao_portaria: '' })
    load()
  }

  const filtered = guests.filter(g =>
    g.nome.toLowerCase().includes(search.toLowerCase()) ||
    (g.documento ?? '').includes(search) ||
    (g.placa ?? '').toUpperCase().includes(search.toUpperCase())
  )

  const counts = {
    total: guests.filter(g => g.status !== 'cancelado').length,
    chegou: guests.filter(g => g.status === 'chegou').length,
    ausente: guests.filter(g => g.status === 'aguardado').length,
    barrado: guests.filter(g => g.status === 'barrado').length,
    manual: guests.filter(g => g.entrada_manual).length,
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{event?.nome_evento}</h1>
        <p className="text-sm text-gray-500">{event?.common_area?.nome} · {event?.horario_inicio}–{event?.horario_fim} · {event?.resident?.nome}</p>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Convidados', value: counts.total, color: 'text-gray-900' },
          { label: 'Chegaram', value: counts.chegou, color: 'text-green-600' },
          { label: 'Aguardando', value: counts.ausente, color: 'text-gray-400' },
          { label: 'Barrados', value: counts.barrado, color: 'text-red-500' },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="p-2 text-center">
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-400">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Busca + botão entrada manual */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input className="pl-9 h-10 text-base" placeholder="Buscar por nome, doc ou placa..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <Button variant="outline" onClick={() => setManualOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1" /> Manual
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map(g => (
          <Card key={g.id} className={g.entrada_manual ? 'border-purple-200' : ''}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{g.nome}</p>
                    <Badge className={GUEST_STATUS_COLORS[g.status]}>{GUEST_STATUS_LABELS[g.status]}</Badge>
                    {g.entrada_manual && <Badge className="bg-purple-100 text-purple-700">Manual</Badge>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                    {g.documento && <span>Doc: {g.documento}</span>}
                    {g.placa && <span>Placa: {g.placa}</span>}
                    {g.acompanhantes_permitidos && <span>+{g.acompanhantes_permitidos} acomp.</span>}
                    {g.checkin_em && <span>Chegou: {formatDateTime(g.checkin_em)}</span>}
                    {g.motivo_barrado && <span className="text-red-400">{g.motivo_barrado}</span>}
                  </div>
                </div>
                {g.status === 'aguardado' && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-2 text-xs" onClick={() => setCheckInGuest(g)}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Chegou
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-2 text-xs" onClick={() => setBarrarGuest(g)}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />Barrar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">Nenhum convidado encontrado.</p>
        )}
      </div>

      {/* Modal check-in */}
      <Dialog open={!!checkInGuest} onOpenChange={() => setCheckInGuest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar chegada — {checkInGuest?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Acompanhantes presentes</Label>
                <Input type="number" value={checkInForm.acompanhantes_presentes} onChange={e => setCheckInForm(f => ({ ...f, acompanhantes_presentes: e.target.value }))} placeholder={checkInGuest?.acompanhantes_permitidos?.toString()} />
              </div>
              <div className="space-y-1">
                <Label>Placa do veículo</Label>
                <Input value={checkInForm.placa} onChange={e => setCheckInForm(f => ({ ...f, placa: e.target.value }))} placeholder={checkInGuest?.placa ?? ''} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observação</Label>
              <Input value={checkInForm.observacao_portaria} onChange={e => setCheckInForm(f => ({ ...f, observacao_portaria: e.target.value }))} />
            </div>
            <Button onClick={confirmarChegada} className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" /> Confirmar chegada
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal barrar */}
      <Dialog open={!!barrarGuest} onOpenChange={() => setBarrarGuest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Barrar — {barrarGuest?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Motivo *</Label>
              <Select value={barrarForm.motivo_barrado} onValueChange={v => setBarrarForm(f => ({ ...f, motivo_barrado: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  {MOTIVOS_BARRADO.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Observação</Label>
              <Input value={barrarForm.observacao_portaria} onChange={e => setBarrarForm(f => ({ ...f, observacao_portaria: e.target.value }))} />
            </div>
            <Button onClick={barrarConvidado} className="w-full bg-red-600 hover:bg-red-700">
              <XCircle className="h-4 w-4 mr-1" /> Confirmar barramento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal entrada manual */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entrada manual no evento</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={manualForm.nome} onChange={e => setManualForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Documento</Label>
                <Input value={manualForm.documento} onChange={e => setManualForm(f => ({ ...f, documento: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={manualForm.telefone} onChange={e => setManualForm(f => ({ ...f, telefone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Autorizado por *</Label>
              <Input value={manualForm.autorizado_por_nome} onChange={e => setManualForm(f => ({ ...f, autorizado_por_nome: e.target.value }))} placeholder="Nome de quem autorizou" />
            </div>
            <div className="space-y-1">
              <Label>Observação obrigatória</Label>
              <Input value={manualForm.observacao_portaria} onChange={e => setManualForm(f => ({ ...f, observacao_portaria: e.target.value }))} />
            </div>
            <Button onClick={entradaManual} className="w-full">
              <UserPlus className="h-4 w-4 mr-1" /> Registrar entrada manual
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
