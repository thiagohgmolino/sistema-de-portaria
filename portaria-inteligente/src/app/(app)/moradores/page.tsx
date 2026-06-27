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
import { Plus, Search, Phone } from 'lucide-react'
import type { Resident, Unit } from '@/types/database'
import { toast } from 'sonner'
import { formatPhone } from '@/lib/utils'

export default function MoradoresPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{nome:string;telefone:string;email:string;cpf:string;unit_id:string|null;tipo:string|null;status:string;observacoes:string}>({ nome: '', telefone: '', email: '', cpf: '', unit_id: '', tipo: 'proprietario', status: 'ativo', observacoes: '' })
  const supabase = createClient()

  async function load() {
    const [r, u] = await Promise.all([
      supabase.from('residents').select('*, unit:units(bloco,numero)').order('nome'),
      supabase.from('units').select('*').eq('status', 'ativo').order('bloco').order('numero'),
    ])
    setResidents(r.data ?? [])
    setUnits(u.data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.nome || !form.unit_id) { toast.error('Nome e unidade são obrigatórios'); return }
    const { error } = await supabase.from('residents').insert({ ...form, updated_at: new Date().toISOString() })
    if (error) { toast.error('Erro ao salvar morador'); return }
    toast.success('Morador cadastrado')
    setOpen(false)
    setForm({ nome: '', telefone: '', email: '', cpf: '', unit_id: '', tipo: 'proprietario', status: 'ativo', observacoes: '' })
    load()
  }

  const filtered = residents.filter(r =>
    r.nome.toLowerCase().includes(search.toLowerCase()) ||
    (r.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const tipoLabels: Record<string, string> = {
    proprietario: 'Proprietário', inquilino: 'Inquilino', familiar: 'Familiar',
    dependente: 'Dependente', funcionario: 'Funcionário', outro: 'Outro',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Moradores</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo morador</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo morador</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Unidade *</Label>
                <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u.id} value={u.id}>Bloco {u.bloco} — {u.numero}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-1">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>CPF (opcional)</Label>
                  <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(r => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.nome}</p>
                  <p className="text-sm text-gray-500">
                    {(r as any).unit ? `Bloco ${(r as any).unit.bloco} — ${(r as any).unit.numero}` : ''} · {tipoLabels[r.tipo]}
                  </p>
                  {r.telefone && <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{r.telefone}</p>}
                </div>
                <Badge className={r.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {r.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhum morador encontrado.</p>}
      </div>
    </div>
  )
}
