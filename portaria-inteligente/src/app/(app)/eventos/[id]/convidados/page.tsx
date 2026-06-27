'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Plus, Upload, List, Trash2, AlertCircle } from 'lucide-react'
import type { EventGuest } from '@/types/database'
import { toast } from 'sonner'
import { formatPlate, GUEST_STATUS_LABELS, GUEST_STATUS_COLORS } from '@/lib/utils'
import Papa from 'papaparse'

export default function ConvidadosPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [form, setForm] = useState({ nome: '', documento: '', telefone: '', acompanhantes_permitidos: '', veiculo_autorizado: false, placa: '', observacao: '' })
  const [bulkText, setBulkText] = useState('')
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
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

  async function addGuest() {
    if (!form.nome) { toast.error('Nome é obrigatório'); return }
    const { error } = await supabase.from('event_guests').insert({
      event_id: id as string, nome: form.nome, documento: form.documento || null,
      telefone: form.telefone || null, acompanhantes_permitidos: form.acompanhantes_permitidos ? parseInt(form.acompanhantes_permitidos) : null,
      veiculo_autorizado: form.veiculo_autorizado, placa: form.placa ? formatPlate(form.placa) : null,
      observacao: form.observacao || null, status: 'aguardado', crianca: false, entrada_manual: false,
      updated_at: new Date().toISOString()
    })
    if (error) { toast.error('Erro ao adicionar'); return }
    toast.success('Convidado adicionado')
    setForm({ nome: '', documento: '', telefone: '', acompanhantes_permitidos: '', veiculo_autorizado: false, placa: '', observacao: '' })
    load()
  }

  async function addBulk() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const toInsert = lines.map(line => {
      const parts = line.split('-').map(p => p.trim())
      const nome = parts[0]
      let documento = '', telefone = '', observacao = ''
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i]
        if (/\d{4,}/.test(p) && p.includes(' ')) telefone = p
        else if (/\d/.test(p)) documento = p
        else observacao = p
      }
      return { event_id: id as string, nome, documento: documento || null, telefone: telefone || null, observacao: observacao || null, status: 'aguardado', crianca: false, veiculo_autorizado: false, entrada_manual: false, updated_at: new Date().toISOString() }
    })
    const { error } = await supabase.from('event_guests').insert(toInsert)
    if (error) { toast.error('Erro ao importar lista'); return }
    toast.success(`${toInsert.length} convidados adicionados`)
    setBulkText('')
    load()
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const rows = (result.data as any[]).map(row => ({
          nome: row.nome || row.Nome || '',
          documento: row.documento || row.Documento || '',
          telefone: row.telefone || row.Telefone || '',
          placa: row.placa ? formatPlate(row.placa) : '',
          acompanhantes_permitidos: row.acompanhantes || '',
          observacao: row.observacao || '',
        })).filter(r => r.nome)
        setCsvPreview(rows)
      }
    })
  }

  async function confirmCSV() {
    const toInsert = csvPreview.map(r => ({
      event_id: id as string, nome: r.nome, documento: r.documento || null,
      telefone: r.telefone || null, placa: r.placa || null,
      acompanhantes_permitidos: r.acompanhantes_permitidos ? parseInt(r.acompanhantes_permitidos) : null,
      observacao: r.observacao || null, status: 'aguardado', crianca: false, veiculo_autorizado: !!r.placa, entrada_manual: false,
      updated_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('event_guests').insert(toInsert)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success(`${toInsert.length} convidados importados`)
    setCsvPreview([])
    if (fileRef.current) fileRef.current.value = ''
    load()
  }

  async function removeGuest(guestId: string) {
    await supabase.from('event_guests').update({ status: 'cancelado' }).eq('id', guestId)
    load()
  }

  const filtered = guests.filter(g =>
    g.status !== 'cancelado' &&
    (g.nome.toLowerCase().includes(search.toLowerCase()) || (g.documento ?? '').includes(search))
  )

  const counts = { total: guests.filter(g => g.status !== 'cancelado').length, chegou: guests.filter(g => g.status === 'chegou').length }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{event?.nome_evento}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {event?.common_area?.nome} · Bloco {event?.unit?.bloco}-{event?.unit?.numero} · {event?.data_evento}
        </p>
      </div>

      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-xs text-gray-500">convidados</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.chegou}</p>
            <p className="text-xs text-gray-500">chegaram</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{counts.total - counts.chegou}</p>
            <p className="text-xs text-gray-500">aguardando</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lista">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="lista"><List className="h-3 w-3 mr-1" />Lista</TabsTrigger>
          <TabsTrigger value="manual"><Plus className="h-3 w-3 mr-1" />Manual</TabsTrigger>
          <TabsTrigger value="importar"><Upload className="h-3 w-3 mr-1" />Importar</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-3 space-y-2">
          <Input placeholder="Buscar convidado..." value={search} onChange={e => setSearch(e.target.value)} />
          {filtered.map(g => (
            <Card key={g.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{g.nome}</p>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      {g.documento && <span>Doc: {g.documento}</span>}
                      {g.placa && <span>Placa: {g.placa}</span>}
                      {g.acompanhantes_permitidos && <span>+{g.acompanhantes_permitidos} acomp.</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={GUEST_STATUS_COLORS[g.status]}>{GUEST_STATUS_LABELS[g.status]}</Badge>
                    {g.status === 'aguardado' && (
                      <button onClick={() => removeGuest(g.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">Nenhum convidado na lista.</p>}
        </TabsContent>

        <TabsContent value="manual" className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Documento</Label>
              <Input value={form.documento} onChange={e => setForm(f => ({ ...f, documento: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Acompanhantes</Label>
              <Input type="number" value={form.acompanhantes_permitidos} onChange={e => setForm(f => ({ ...f, acompanhantes_permitidos: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Placa</Label>
              <Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value }))} />
            </div>
          </div>
          <Button onClick={addGuest} className="w-full"><Plus className="h-4 w-4 mr-1" />Adicionar convidado</Button>
        </TabsContent>

        <TabsContent value="importar" className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Colar lista</p>
            <p className="text-xs text-gray-400 mb-2">Uma pessoa por linha. Ex: João Silva - RG 12345 - (11) 99999-0000</p>
            <textarea
              className="w-full border rounded-md p-2 text-sm min-h-[100px] resize-y"
              placeholder="João Silva&#10;Maria Souza - RG 123&#10;Carlos - +55 11 99999-1234"
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
            />
            <Button onClick={addBulk} className="w-full mt-2" disabled={!bulkText.trim()}>
              Importar lista colada
            </Button>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-1">Importar CSV</p>
            <p className="text-xs text-gray-400 mb-2">Colunas: nome, documento, telefone, placa, acompanhantes, observacao</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVFile} className="text-sm" />

            {csvPreview.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  {csvPreview.length} registros encontrados. Revise antes de confirmar.
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {csvPreview.map((r, i) => (
                    <div key={i} className="text-xs bg-gray-50 rounded p-2">
                      <span className="font-medium">{r.nome}</span>
                      {r.documento && <span className="text-gray-400 ml-2">Doc: {r.documento}</span>}
                      {r.placa && <span className="text-gray-400 ml-2">Placa: {r.placa}</span>}
                    </div>
                  ))}
                </div>
                <Button onClick={confirmCSV} className="w-full">
                  Confirmar importação
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
