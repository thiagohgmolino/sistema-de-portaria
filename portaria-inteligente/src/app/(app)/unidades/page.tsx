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
import { Plus, Search } from 'lucide-react'
import type { Unit } from '@/types/database'
import { toast } from 'sonner'

export default function UnidadesPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ bloco: string; numero: string; tipo: string | null; status: string; observacoes: string }>({ bloco: '', numero: '', tipo: 'apartamento', status: 'ativo', observacoes: '' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('units').select('*').order('bloco').order('numero')
    setUnits(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    const { error } = await supabase.from('units').insert({ ...form, updated_at: new Date().toISOString() })
    if (error) { toast.error('Erro ao salvar unidade'); return }
    toast.success('Unidade criada')
    setOpen(false)
    setForm({ bloco: '', numero: '', tipo: 'apartamento', status: 'ativo', observacoes: '' })
    load()
  }

  const filtered = units.filter(u =>
    `${u.bloco} ${u.numero}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Unidades</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova unidade</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova unidade</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Bloco</Label>
                  <Input value={form.bloco} onChange={e => setForm(f => ({ ...f, bloco: e.target.value }))} placeholder="A" />
                </div>
                <div className="space-y-1">
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="101" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem>
                    <SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="sala">Sala</SelectItem>
                    <SelectItem value="lote">Lote</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
        <Input className="pl-9" placeholder="Buscar por bloco ou número..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(u => (
          <Card key={u.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Bloco {u.bloco} — {u.numero}</p>
                  <p className="text-sm text-gray-500 capitalize">{u.tipo}</p>
                </div>
                <Badge className={u.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {u.status === 'ativo' ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              {u.observacoes && <p className="text-sm text-gray-400 mt-1 truncate">{u.observacoes}</p>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 col-span-3 py-8 text-center">Nenhuma unidade encontrada.</p>}
      </div>
    </div>
  )
}
