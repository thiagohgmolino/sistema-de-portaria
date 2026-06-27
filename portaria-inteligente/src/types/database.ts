export type UserRole = 'admin' | 'sindico' | 'portaria' | 'morador'
export type UserStatus = 'ativo' | 'inativo'
export type UnitType = 'apartamento' | 'casa' | 'sala' | 'lote' | 'outro'
export type ResidentType = 'proprietario' | 'inquilino' | 'familiar' | 'dependente' | 'funcionario' | 'outro'
export type VehicleType = 'carro' | 'moto' | 'bicicleta' | 'utilitario' | 'caminhao' | 'outro'
export type EventStatus = 'rascunho' | 'aguardando_aprovacao' | 'aprovado' | 'reprovado' | 'cancelado' | 'concluido'
export type EventType = 'aniversario' | 'confraternizacao' | 'reuniao_familiar' | 'evento_infantil' | 'assembleia' | 'outro'
export type GuestStatus = 'aguardado' | 'chegou' | 'ausente' | 'barrado' | 'cancelado'
export type AccessLogStatus = 'dentro' | 'saiu' | 'cancelado'
export type PackageStatus = 'pendente' | 'entregue' | 'devolvida' | 'cancelada'
export type ProviderStatus = 'ativo' | 'inativo' | 'bloqueado'

export interface UserProfile {
  id: string
  auth_user_id: string
  nome: string
  email: string
  telefone?: string
  role: UserRole
  status: UserStatus
  unit_id?: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  bloco: string
  numero: string
  tipo: UnitType
  status: UserStatus
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Resident {
  id: string
  nome: string
  telefone?: string
  email?: string
  cpf?: string
  unit_id: string
  tipo: ResidentType
  status: UserStatus
  observacoes?: string
  created_at: string
  updated_at: string
  unit?: Unit
}

export interface Visitor {
  id: string
  nome: string
  documento?: string
  telefone?: string
  foto_url?: string
  alerta: boolean
  bloqueado: boolean
  motivo_alerta?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface ServiceProvider {
  id: string
  nome: string
  documento?: string
  telefone?: string
  empresa?: string
  tipo_servico?: string
  unit_id?: string
  autorizacao_recorrente: boolean
  dias_autorizados?: string[]
  horario_inicio?: string
  horario_fim?: string
  validade_autorizacao?: string
  status: ProviderStatus
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface CommonArea {
  id: string
  nome: string
  descricao?: string
  capacidade_maxima?: number
  horario_inicio?: string
  horario_fim?: string
  regras_uso?: string
  exige_aprovacao: boolean
  permite_lista_convidados: boolean
  prazo_envio_lista_horas?: number
  prazo_edicao_lista_horas?: number
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  common_area_id: string
  unit_id: string
  resident_id: string
  nome_evento: string
  tipo_evento: EventType
  data_evento: string
  horario_inicio: string
  horario_fim: string
  quantidade_estimada?: number
  observacoes?: string
  status: EventStatus
  regras_aceitas: boolean
  criado_por_user_id: string
  aprovado_por_user_id?: string
  aprovado_em?: string
  cancelado_por_user_id?: string
  cancelado_em?: string
  motivo_cancelamento?: string
  created_at: string
  updated_at: string
  common_area?: CommonArea
  unit?: Unit
  resident?: Resident
}

export interface EventGuest {
  id: string
  event_id: string
  nome: string
  documento?: string
  telefone?: string
  observacao?: string
  acompanhantes_permitidos?: number
  acompanhantes_presentes?: number
  crianca: boolean
  veiculo_autorizado: boolean
  placa?: string
  status: GuestStatus
  checkin_em?: string
  checkin_por_user_id?: string
  barrado_em?: string
  barrado_por_user_id?: string
  motivo_barrado?: string
  observacao_portaria?: string
  entrada_manual: boolean
  autorizado_por_nome?: string
  access_log_id?: string
  created_at: string
  updated_at: string
}

export interface AccessLog {
  id: string
  tipo_pessoa: string
  visitor_id?: string
  provider_id?: string
  resident_id?: string
  event_id?: string
  event_guest_id?: string
  nome_avulso?: string
  documento_avulso?: string
  telefone_avulso?: string
  unit_id?: string
  resident_authorized_id?: string
  motivo?: string
  placa?: string
  veiculo_descricao?: string
  foto_url?: string
  observacoes_entrada?: string
  observacoes_saida?: string
  status: AccessLogStatus
  entrada_em: string
  saida_em?: string
  entrada_por_user_id: string
  saida_por_user_id?: string
  created_at: string
  updated_at: string
}

export interface Package {
  id: string
  codigo_interno: string
  unit_id: string
  resident_id?: string
  transportadora?: string
  descricao: string
  foto_url?: string
  status: PackageStatus
  recebido_por_user_id: string
  recebido_em: string
  retirado_por_nome?: string
  retirado_por_documento?: string
  entregue_por_user_id?: string
  entregue_em?: string
  observacoes?: string
  created_at: string
  updated_at: string
  unit?: Unit
  resident?: Resident
}

export interface Database {
  public: {
    Tables: {
      users_profile: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> }
      units: { Row: Unit; Insert: Partial<Unit>; Update: Partial<Unit> }
      residents: { Row: Resident; Insert: Partial<Resident>; Update: Partial<Resident> }
      visitors: { Row: Visitor; Insert: Partial<Visitor>; Update: Partial<Visitor> }
      service_providers: { Row: ServiceProvider; Insert: Partial<ServiceProvider>; Update: Partial<ServiceProvider> }
      common_areas: { Row: CommonArea; Insert: Partial<CommonArea>; Update: Partial<CommonArea> }
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event> }
      event_guests: { Row: EventGuest; Insert: Partial<EventGuest>; Update: Partial<EventGuest> }
      access_logs: { Row: AccessLog; Insert: Partial<AccessLog>; Update: Partial<AccessLog> }
      packages: { Row: Package; Insert: Partial<Package>; Update: Partial<Package> }
    }
  }
}
