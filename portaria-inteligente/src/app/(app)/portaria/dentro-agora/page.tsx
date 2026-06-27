'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'
import { useProfile } from '@/hooks/useProfile'

const tipoLabels: Record<string, string> = {
  visitante: 'Visitante', prestador: 'Prestador', entregador: 'Entregador',
  morador: 'Morador', convidado_evento: 'Convidado', outro: 'Outro',
}

export default function DentroAgoraPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const { profile } = useProfile()
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('access_logs')
      .select('*, unit:units(bloco,numero)')
      .eq('status', 'dentro')
      .order('entrada_em', { ascending: false })
    setLogs(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function registrarSaida(logId: string) {
    const now = new Date().toISOString()
    await supabase.from('access_logs').update({ status: 'saiu', saida_em: now, saida_por_user_id: profile?.id, updated_at: now }).eq('id', logId)
    toast.success('Saída registrada')
    load()
  }

  const filtered = logs.filter(l =>
    (l.nome_avulso ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.placa ?? '').toUpperCase().includes(search.toUpperCase()) ||
    (l.unit?.bloco + l.unit?.numero).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dentro agora</h1>
        <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">{logs.length} pessoas</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Buscar por nome, placa ou unidade..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {filtered.map(log => (
          <Card key={log.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{log.nome_avulso}</p>
                    <Badge className="bg-gray-100 text-gray-600 text-xs">{tipoLabels[log.tipo_pessoa] ?? log.tipo_pessoa}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                    <span>Entrou: {formatDateTime(log.entrada_em)}</span>
                    {log.unit && <span>Unidade: {log.unit.bloco}-{log.unit.numero}</span>}
                    {log.placa && <span>Placa: {log.placa}</span>}
                    {log.motivo && <span>{log.motivo}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => registrarSaida(log.id)} className="shrink-0 h-8">
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Saída
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 py-10 text-center">
            {logs.length === 0 ? 'Nenhuma pessoa dentro do condomínio.' : 'Nenhum resultado para a busca.'}
          </p>
        )}
      </div>
    </div>
  )
}
