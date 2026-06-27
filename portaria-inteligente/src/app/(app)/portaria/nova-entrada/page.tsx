'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useProfile } from '@/hooks/useProfile'
import { DoorOpen } from 'lucide-react'

export default function NovaEntradaPage() {
  const [units, setUnits] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [form, setForm] = useState<{
    tipo_pessoa: string | null; nome_avulso: string; documento_avulso: string; telefone_avulso: string;
    unit_id: string | null; event_id: string | null; motivo: string; placa: string; veiculo_descricao: string; observacoes_entrada: string;
  }>({
    tipo_pessoa: 'visitante', nome_avulso: '', documento_avulso: '', telefone_avulso: '',
    unit_id: '', event_id: '', motivo: '', placa: '', veiculo_descricao: '', observacoes_entrada: ''
  })
  const { profile } = useProfile()
  const supabase = createClient()

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('units').select('*').eq('status', 'ativo').order('bloco').order('numero'),
      supabase.from('events').select('*, common_area:common_areas(nome)').eq('data_evento', today).eq('status', 'aprovado'),
    ]).then(([u, e]) => {
      setUnits(u.data ?? [])
      setEvents(e.data ?? [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome_avulso) { toast.error('Nome é obrigatório'); return }
    const now = new Date().toISOString()
    const { error } = await supabase.from('access_logs').insert({
      tipo_pessoa: form.tipo_pessoa, nome_avulso: form.nome_avulso,
      documento_avulso: form.documento_avulso || null, telefone_avulso: form.telefone_avulso || null,
      unit_id: form.unit_id || null, event_id: form.event_id || null,
      motivo: form.motivo || null, placa: form.placa || null,
      veiculo_descricao: form.veiculo_descricao || null, observacoes_entrada: form.observacoes_entrada || null,
      status: 'dentro', entrada_em: now, entrada_por_user_id: profile?.id ?? '', updated_at: now
    })
    if (error) { toast.error('Erro ao registrar entrada'); return }
    toast.success('Entrada registrada')
    setForm({ tipo_pessoa: 'visitante', nome_avulso: '', documento_avulso: '', telefone_avulso: '', unit_id: '', event_id: '', motivo: '', placa: '', veiculo_descricao: '', observacoes_entrada: '' })
  }

  const tipos = [
    { value: 'visitante', label: 'Visitante' },
    { value: 'prestador', label: 'Prestador' },
    { value: 'entregador', label: 'Entregador' },
    { value: 'morador', label: 'Morador' },
    { value: 'convidado_evento', label: 'Convidado de evento' },
    { value: 'outro', label: 'Outro' },
  ]

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Nova entrada</h1>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DoorOpen className="h-4 w-4" /> Registrar entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Tipo de pessoa</Label>
              <Select value={form.tipo_pessoa} onValueChange={v => setForm(f => ({ ...f, tipo_pessoa: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={form.nome_avulso} onChange={e => setForm(f => ({ ...f, nome_avulso: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Documento</Label>
                <Input value={form.documento_avulso} onChange={e => setForm(f => ({ ...f, documento_avulso: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={form.telefone_avulso} onChange={e => setForm(f => ({ ...f, telefone_avulso: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Unidade visitada</Label>
              <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id}>Bloco {u.bloco} — {u.numero}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.tipo_pessoa === 'convidado_evento' && events.length > 0 && (
              <div className="space-y-1">
                <Label>Evento</Label>
                <Select value={form.event_id} onValueChange={v => setForm(f => ({ ...f, event_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o evento" /></SelectTrigger>
                  <SelectContent>
                    {events.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_evento} — {e.common_area?.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Motivo da visita</Label>
              <Input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Placa do veículo</Label>
                <Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1">
                <Label>Modelo/cor</Label>
                <Input value={form.veiculo_descricao} onChange={e => setForm(f => ({ ...f, veiculo_descricao: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Input value={form.observacoes_entrada} onChange={e => setForm(f => ({ ...f, observacoes_entrada: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full text-base h-11">
              <DoorOpen className="h-4 w-4 mr-2" /> Registrar entrada
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
