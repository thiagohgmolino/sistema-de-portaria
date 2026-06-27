'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, CalendarDays, Users, ClipboardList } from 'lucide-react'
import type { Event, CommonArea, Unit, Resident } from '@/types/database'
import { toast } from 'sonner'
import { formatDate, EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'
import { useProfile } from '@/hooks/useProfile'

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [areas, setAreas] = useState<CommonArea[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [residents, setResidents] = useState<Resident[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{
    nome_evento: string; tipo_evento: string | null; common_area_id: string | null; unit_id: string | null;
    resident_id: string | null; data_evento: string; horario_inicio: string; horario_fim: string;
    quantidade_estimada: string; observacoes: string; regras_aceitas: boolean;
  }>({
    nome_evento: '', tipo_evento: 'aniversario', common_area_id: '', unit_id: '',
    resident_id: '', data_evento: '', horario_inicio: '', horario_fim: '',
    quantidade_estimada: '', observacoes: '', regras_aceitas: false
  })
  const supabase = createClient()
  const { profile } = useProfile()

  async function load() {
    const [ev, ar, un, re] = await Promise.all([
      supabase.from('events').select('*, common_area:common_areas(nome), unit:units(bloco,numero), resident:residents(nome)').order('data_evento', { ascending: false }),
      supabase.from('common_areas').select('*').eq('status', 'ativo'),
      supabase.from('units').select('*').eq('status', 'ativo').order('bloco').order('numero'),
      supabase.from('residents').select('*, unit:units(bloco,numero)').eq('status', 'ativo').order('nome'),
    ])
    setEvents(ev.data ?? [])
    setAreas(ar.data ?? [])
    setUnits(un.data ?? [])
    setResidents(re.data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.nome_evento || !form.common_area_id || !form.unit_id || !form.resident_id || !form.data_evento) {
      toast.error('Preencha os campos obrigatórios'); return
    }
    const area = areas.find(a => a.id === form.common_area_id)
    const status = area?.exige_aprovacao ? 'aguardando_aprovacao' : 'aprovado'
    const { error } = await supabase.from('events').insert({
      ...form,
      quantidade_estimada: form.quantidade_estimada ? parseInt(form.quantidade_estimada) : null,
      status,
      criado_por_user_id: profile?.id ?? '',
      updated_at: new Date().toISOString()
    })
    if (error) { toast.error('Erro ao criar evento'); return }
    toast.success(`Evento criado — status: ${EVENT_STATUS_LABELS[status]}`)
    setOpen(false)
    load()
  }

  async function aprovar(id: string) {
    await supabase.from('events').update({ status: 'aprovado', aprovado_por_user_id: profile?.id, aprovado_em: new Date().toISOString() }).eq('id', id)
    toast.success('Evento aprovado')
    load()
  }

  const filtered = events.filter(e =>
    e.nome_evento.toLowerCase().includes(search.toLowerCase()) ||
    (e as any).resident?.nome?.toLowerCase().includes(search.toLowerCase())
  )

  const tipoLabels: Record<string, string> = {
    aniversario: 'Aniversário', confraternizacao: 'Confraternização', reuniao_familiar: 'Reunião familiar',
    evento_infantil: 'Evento infantil', assembleia: 'Assembleia', outro: 'Outro',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Eventos</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo evento</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label>Nome do evento *</Label>
                <Input value={form.nome_evento} onChange={e => setForm(f => ({ ...f, nome_evento: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.tipo_evento} onValueChange={v => setForm(f => ({ ...f, tipo_evento: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Área comum *</Label>
                  <Select value={form.common_area_id} onValueChange={v => setForm(f => ({ ...f, common_area_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Unidade responsável *</Label>
                  <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u.id} value={u.id}>Bloco {u.bloco} — {u.numero}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Morador responsável *</Label>
                  <Select value={form.resident_id} onValueChange={v => setForm(f => ({ ...f, resident_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {residents.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Data *</Label>
                  <Input type="date" value={form.data_evento} onChange={e => setForm(f => ({ ...f, data_evento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Início</Label>
                  <Input type="time" value={form.horario_inicio} onChange={e => setForm(f => ({ ...f, horario_inicio: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Término</Label>
                  <Input type="time" value={form.horario_fim} onChange={e => setForm(f => ({ ...f, horario_fim: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Convidados estimados</Label>
                <Input type="number" value={form.quantidade_estimada} onChange={e => setForm(f => ({ ...f, quantidade_estimada: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.regras_aceitas} onChange={e => setForm(f => ({ ...f, regras_aceitas: e.target.checked }))} />
                Aceito as regras de uso da área comum
              </label>
              <Button onClick={handleSave} className="w-full">Criar evento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Buscar por nome ou morador..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(ev => (
          <Card key={ev.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{ev.nome_evento}</p>
                    <Badge className={EVENT_STATUS_COLORS[ev.status]}>{EVENT_STATUS_LABELS[ev.status]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <CalendarDays className="inline h-3 w-3 mr-1" />{formatDate(ev.data_evento)} · {ev.horario_inicio}–{ev.horario_fim}
                  </p>
                  <p className="text-sm text-gray-400">
                    {(ev as any).common_area?.nome} · {(ev as any).unit?.bloco}-{(ev as any).unit?.numero} · {(ev as any).resident?.nome}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  <Link href={`/eventos/${ev.id}/convidados`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <ClipboardList className="h-3 w-3 mr-1" /> Convidados
                    </Button>
                  </Link>
                  {ev.status === 'aguardando_aprovacao' && (profile?.role === 'admin' || profile?.role === 'sindico') && (
                    <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700" onClick={() => aprovar(ev.id)}>
                      Aprovar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhum evento encontrado.</p>}
      </div>
    </div>
  )
}
