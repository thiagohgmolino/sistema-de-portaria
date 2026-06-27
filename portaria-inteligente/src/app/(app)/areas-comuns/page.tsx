'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users } from 'lucide-react'
import type { CommonArea } from '@/types/database'
import { toast } from 'sonner'

export default function AreasComunsPage() {
  const [areas, setAreas] = useState<CommonArea[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    nome: '', descricao: '', capacidade_maxima: '', horario_inicio: '', horario_fim: '',
    regras_uso: '', exige_aprovacao: false, permite_lista_convidados: true,
    prazo_envio_lista_horas: '24', prazo_edicao_lista_horas: '2', status: 'ativo'
  })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('common_areas').select('*').order('nome')
    setAreas(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.nome) { toast.error('Nome é obrigatório'); return }
    const { error } = await supabase.from('common_areas').insert({
      ...form,
      capacidade_maxima: form.capacidade_maxima ? parseInt(form.capacidade_maxima) : null,
      prazo_envio_lista_horas: parseInt(form.prazo_envio_lista_horas),
      prazo_edicao_lista_horas: parseInt(form.prazo_edicao_lista_horas),
      updated_at: new Date().toISOString()
    })
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Área criada')
    setOpen(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Áreas comuns</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova área</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova área comum</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Salão de Festas" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Capacidade máxima</Label>
                  <Input type="number" value={form.capacidade_maxima} onChange={e => setForm(f => ({ ...f, capacidade_maxima: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Horário (início)</Label>
                  <Input type="time" value={form.horario_inicio} onChange={e => setForm(f => ({ ...f, horario_inicio: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Regras de uso</Label>
                <Textarea value={form.regras_uso} onChange={e => setForm(f => ({ ...f, regras_uso: e.target.value }))} rows={3} />
              </div>
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.exige_aprovacao} onChange={e => setForm(f => ({ ...f, exige_aprovacao: e.target.checked }))} />
                  Exige aprovação
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.permite_lista_convidados} onChange={e => setForm(f => ({ ...f, permite_lista_convidados: e.target.checked }))} />
                  Permite lista de convidados
                </label>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {areas.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.nome}</p>
                  {a.capacidade_maxima && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" /> Até {a.capacidade_maxima} pessoas
                    </p>
                  )}
                  {a.horario_inicio && <p className="text-sm text-gray-400">{a.horario_inicio} — {a.horario_fim}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge className={a.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {a.status === 'ativo' ? 'Ativa' : 'Inativa'}
                  </Badge>
                  {a.exige_aprovacao && <Badge className="bg-yellow-100 text-yellow-700">Aprovação</Badge>}
                  {a.permite_lista_convidados && <Badge className="bg-blue-100 text-blue-700">Convidados</Badge>}
                </div>
              </div>
              {a.regras_uso && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{a.regras_uso}</p>}
            </CardContent>
          </Card>
        ))}
        {areas.length === 0 && <p className="text-sm text-gray-500 py-8 text-center col-span-2">Nenhuma área cadastrada.</p>}
      </div>
    </div>
  )
}
