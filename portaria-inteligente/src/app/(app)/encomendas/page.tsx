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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Package, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'

const statusColors: Record<string, string> = {
  pendente: 'bg-orange-100 text-orange-700',
  entregue: 'bg-green-100 text-green-700',
  devolvida: 'bg-gray-100 text-gray-500',
  cancelada: 'bg-red-100 text-red-600',
}

export default function EncomendasPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [entregaGuest, setEntregaGuest] = useState<any>(null)
  const [entregaForm, setEntregaForm] = useState({ retirado_por_nome: '', retirado_por_documento: '' })
  const [form, setForm] = useState<{ unit_id: string | null; transportadora: string; descricao: string; observacoes: string }>({ unit_id: '', transportadora: '', descricao: '', observacoes: '' })
  const { profile } = useProfile()
  const supabase = createClient()

  async function load() {
    const [p, u] = await Promise.all([
      supabase.from('packages').select('*, unit:units(bloco,numero)').order('recebido_em', { ascending: false }),
      supabase.from('units').select('*').eq('status', 'ativo').order('bloco').order('numero'),
    ])
    setPackages(p.data ?? [])
    setUnits(u.data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.unit_id || !form.descricao) { toast.error('Unidade e descrição são obrigatórios'); return }
    const now = new Date().toISOString()
    const codigo = `ENC-${Date.now().toString().slice(-6)}`
    const { error } = await supabase.from('packages').insert({
      ...form, codigo_interno: codigo, status: 'pendente',
      recebido_por_user_id: profile?.id ?? '', recebido_em: now, updated_at: now
    })
    if (error) { toast.error('Erro ao registrar'); return }
    toast.success('Encomenda registrada — código: ' + codigo)
    setOpen(false)
    setForm({ unit_id: '', transportadora: '', descricao: '', observacoes: '' })
    load()
  }

  async function entregar() {
    if (!entregaGuest || !entregaForm.retirado_por_nome) { toast.error('Informe quem retirou'); return }
    const now = new Date().toISOString()
    await supabase.from('packages').update({
      status: 'entregue', retirado_por_nome: entregaForm.retirado_por_nome,
      retirado_por_documento: entregaForm.retirado_por_documento || null,
      entregue_por_user_id: profile?.id, entregue_em: now, updated_at: now
    }).eq('id', entregaGuest.id)
    toast.success('Encomenda entregue')
    setEntregaGuest(null)
    setEntregaForm({ retirado_por_nome: '', retirado_por_documento: '' })
    load()
  }

  const filtered = packages.filter(p =>
    p.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo_interno ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.unit?.bloco + p.unit?.numero).toLowerCase().includes(search.toLowerCase())
  )

  const pendentes = filtered.filter(p => p.status === 'pendente')
  const historico = filtered.filter(p => p.status !== 'pendente')

  const PackageCard = ({ p }: { p: any }) => (
    <Card key={p.id}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-900 text-sm">{p.descricao}</p>
              <Badge className={statusColors[p.status]}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {p.codigo_interno} · Bloco {p.unit?.bloco}-{p.unit?.numero}
              {p.transportadora && ` · ${p.transportadora}`}
            </p>
            <p className="text-xs text-gray-400">Recebido: {formatDateTime(p.recebido_em)}</p>
            {p.entregue_em && <p className="text-xs text-green-600">Entregue: {formatDateTime(p.entregue_em)} para {p.retirado_por_nome}</p>}
          </div>
          {p.status === 'pendente' && (
            <Button size="sm" className="shrink-0 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => setEntregaGuest(p)}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />Entregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Encomendas</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova encomenda</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Unidade destinatária *</Label>
                <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u.id} value={u.id}>Bloco {u.bloco} — {u.numero}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Descrição *</Label>
                <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Caixa Amazon, carta, etc." />
              </div>
              <div className="space-y-1">
                <Label>Transportadora / remetente</Label>
                <Input value={form.transportadora} onChange={e => setForm(f => ({ ...f, transportadora: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Observações</Label>
                <Input value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
              <Button onClick={handleSave} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Buscar por código, unidade ou descrição..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="pendentes">
            <Package className="h-3 w-3 mr-1" />Pendentes ({pendentes.length})
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendentes" className="mt-3 space-y-2">
          {pendentes.map(p => <PackageCard key={p.id} p={p} />)}
          {pendentes.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhuma encomenda pendente.</p>}
        </TabsContent>
        <TabsContent value="historico" className="mt-3 space-y-2">
          {historico.map(p => <PackageCard key={p.id} p={p} />)}
          {historico.length === 0 && <p className="text-sm text-gray-500 py-8 text-center">Nenhum histórico.</p>}
        </TabsContent>
      </Tabs>

      <Dialog open={!!entregaGuest} onOpenChange={() => setEntregaGuest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entregar encomenda</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-gray-600">{entregaGuest?.descricao} · Bloco {entregaGuest?.unit?.bloco}-{entregaGuest?.unit?.numero}</p>
            <div className="space-y-1">
              <Label>Retirado por *</Label>
              <Input value={entregaForm.retirado_por_nome} onChange={e => setEntregaForm(f => ({ ...f, retirado_por_nome: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Documento de quem retirou</Label>
              <Input value={entregaForm.retirado_por_documento} onChange={e => setEntregaForm(f => ({ ...f, retirado_por_documento: e.target.value }))} />
            </div>
            <Button onClick={entregar} className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" />Confirmar entrega
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
