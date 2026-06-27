'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import type { Visitor } from '@/types/database'
import { toast } from 'sonner'

export default function VisitantesPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', documento: '', telefone: '', alerta: false, bloqueado: false, motivo_alerta: '', observacoes: '' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('visitors').select('*').order('nome')
    setVisitors(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.nome) { toast.error('Nome é obrigatório'); return }
    const { error } = await supabase.from('visitors').insert({ ...form, updated_at: new Date().toISOString() })
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Visitante cadastrado')
    setOpen(false)
    setForm({ nome: '', documento: '', telefone: '', alerta: false, bloqueado: false, motivo_alerta: '', observacoes: '' })
    load()
  }

  const filtered = visitors.filter(v =>
    v.nome.toLowerCase().includes(search.toLowerCase()) ||
    (v.documento ?? '').includes(search)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Visitantes</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo visitante</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo visitante</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Documento (opcional)</Label>
                  <Input value={form.documento} onChange={e => setForm(f => ({ ...f, documento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Telefone (opcional)</Label>
                  <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.alerta} onChange={e => setForm(f => ({ ...f, alerta: e.target.checked }))} />
                  Alerta
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.bloqueado} onChange={e => setForm(f => ({ ...f, bloqueado: e.target.checked }))} />
                  Bloqueado
                </label>
              </div>
              {(form.alerta || form.bloqueado) && (
                <div className="space-y-1">
                  <Label>Motivo do alerta/bloqueio</Label>
                  <Input value={form.motivo_alerta} onChange={e => setForm(f => ({ ...f, motivo_alerta: e.target.value }))} />
                </div>
              )}
              <div className="space-y-1">
                <Label>Observações</Label>
                <Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Buscar por nome ou documento..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(v => (
          <Card key={v.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{v.nome}</p>
                    {v.alerta && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                  </div>
                  {v.documento && <p className="text-sm text-gray-500">Doc: {v.documento}</p>}
                  {v.telefone && <p className="text-sm text-gray-400">{v.telefone}</p>}
                  {v.motivo_alerta && <p className="text-sm text-orange-600 mt-0.5">{v.motivo_alerta}</p>}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {v.bloqueado && <Badge className="bg-red-100 text-red-700">Bloqueado</Badge>}
                  {v.alerta && !v.bloqueado && <Badge className="bg-orange-100 text-orange-700">Alerta</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhum visitante encontrado.</p>}
      </div>
    </div>
  )
}
