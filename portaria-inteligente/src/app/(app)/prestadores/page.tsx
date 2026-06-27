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
import { Plus, Search, Phone, Building } from 'lucide-react'
import type { ServiceProvider } from '@/types/database'
import { toast } from 'sonner'
import { formatPhone, formatDate } from '@/lib/utils'

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
  bloqueado: 'bg-red-100 text-red-700',
}

export default function PrestadoresPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{
    nome: string; documento: string; telefone: string; empresa: string; tipo_servico: string;
    autorizacao_recorrente: boolean; validade_autorizacao: string; status: string | null; observacoes: string;
  }>({
    nome: '', documento: '', telefone: '', empresa: '', tipo_servico: '',
    autorizacao_recorrente: false, validade_autorizacao: '', status: 'ativo', observacoes: ''
  })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('service_providers').select('*').order('nome')
    setProviders(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.nome) { toast.error('Nome é obrigatório'); return }
    const { error } = await supabase.from('service_providers').insert({ ...form, updated_at: new Date().toISOString() })
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Prestador cadastrado')
    setOpen(false)
    setForm({ nome: '', documento: '', telefone: '', empresa: '', tipo_servico: '', autorizacao_recorrente: false, validade_autorizacao: '', status: 'ativo', observacoes: '' })
    load()
  }

  const filtered = providers.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.empresa ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.tipo_servico ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Prestadores</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo prestador</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo prestador</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Nome / Razão social *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Empresa</Label>
                  <Input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de serviço</Label>
                  <Input value={form.tipo_servico} onChange={e => setForm(f => ({ ...f, tipo_servico: e.target.value }))} placeholder="Elétrica, limpeza..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Documento (CPF/CNPJ)</Label>
                  <Input value={form.documento} onChange={e => setForm(f => ({ ...f, documento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Validade da autorização</Label>
                  <Input type="date" value={form.validade_autorizacao} onChange={e => setForm(f => ({ ...f, validade_autorizacao: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.autorizacao_recorrente} onChange={e => setForm(f => ({ ...f, autorizacao_recorrente: e.target.checked }))} />
                Autorização recorrente
              </label>
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
        <Input className="pl-9" placeholder="Buscar por nome, empresa ou serviço..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(p => {
          const vencido = p.validade_autorizacao && new Date(p.validade_autorizacao) < new Date()
          return (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{p.nome}</p>
                    {p.empresa && <p className="text-sm text-gray-500 flex items-center gap-1"><Building className="h-3 w-3" />{p.empresa}</p>}
                    {p.tipo_servico && <p className="text-sm text-gray-400">{p.tipo_servico}</p>}
                    {p.telefone && <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{p.telefone}</p>}
                    {p.validade_autorizacao && (
                      <p className={`text-xs mt-1 ${vencido ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                        Validade: {formatDate(p.validade_autorizacao)} {vencido ? '⚠ Vencida' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className={statusColors[p.status]}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Badge>
                    {p.autorizacao_recorrente && <Badge className="bg-blue-100 text-blue-700">Recorrente</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {filtered.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhum prestador encontrado.</p>}
      </div>
    </div>
  )
}
