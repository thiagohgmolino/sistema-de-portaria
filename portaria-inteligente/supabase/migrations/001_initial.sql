-- Portaria Inteligente — Migration inicial

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- Perfis de usuário
create table users_profile (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  role text not null check (role in ('admin','sindico','portaria','morador')),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  unit_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unidades
create table units (
  id uuid primary key default uuid_generate_v4(),
  bloco text not null,
  numero text not null,
  tipo text not null default 'apartamento' check (tipo in ('apartamento','casa','sala','lote','outro')),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (bloco, numero)
);

-- Moradores
create table residents (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text,
  email text,
  cpf text,
  unit_id uuid not null references units(id),
  tipo text not null default 'proprietario' check (tipo in ('proprietario','inquilino','familiar','dependente','funcionario','outro')),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users_profile add constraint fk_unit foreign key (unit_id) references units(id);

-- Visitantes
create table visitors (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  documento text,
  telefone text,
  foto_url text,
  alerta boolean default false,
  bloqueado boolean default false,
  motivo_alerta text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prestadores
create table service_providers (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  documento text,
  telefone text,
  empresa text,
  tipo_servico text,
  unit_id uuid references units(id),
  autorizacao_recorrente boolean default false,
  dias_autorizados text[],
  horario_inicio time,
  horario_fim time,
  validade_autorizacao date,
  status text not null default 'ativo' check (status in ('ativo','inativo','bloqueado')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Áreas comuns
create table common_areas (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  capacidade_maxima int,
  horario_inicio time,
  horario_fim time,
  regras_uso text,
  exige_aprovacao boolean default false,
  permite_lista_convidados boolean default true,
  prazo_envio_lista_horas int default 24,
  prazo_edicao_lista_horas int default 2,
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Eventos
create table events (
  id uuid primary key default uuid_generate_v4(),
  common_area_id uuid not null references common_areas(id),
  unit_id uuid not null references units(id),
  resident_id uuid not null references residents(id),
  nome_evento text not null,
  tipo_evento text not null default 'outro' check (tipo_evento in ('aniversario','confraternizacao','reuniao_familiar','evento_infantil','assembleia','outro')),
  data_evento date not null,
  horario_inicio time,
  horario_fim time,
  quantidade_estimada int,
  observacoes text,
  status text not null default 'rascunho' check (status in ('rascunho','aguardando_aprovacao','aprovado','reprovado','cancelado','concluido')),
  regras_aceitas boolean default false,
  criado_por_user_id uuid references users_profile(id),
  aprovado_por_user_id uuid references users_profile(id),
  aprovado_em timestamptz,
  cancelado_por_user_id uuid references users_profile(id),
  cancelado_em timestamptz,
  motivo_cancelamento text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Convidados do evento
create table event_guests (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id),
  nome text not null,
  documento text,
  telefone text,
  observacao text,
  acompanhantes_permitidos int,
  acompanhantes_presentes int,
  crianca boolean default false,
  veiculo_autorizado boolean default false,
  placa text,
  status text not null default 'aguardado' check (status in ('aguardado','chegou','ausente','barrado','cancelado')),
  checkin_em timestamptz,
  checkin_por_user_id uuid references users_profile(id),
  barrado_em timestamptz,
  barrado_por_user_id uuid references users_profile(id),
  motivo_barrado text,
  observacao_portaria text,
  entrada_manual boolean default false,
  autorizado_por_nome text,
  access_log_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Logs de acesso
create table access_logs (
  id uuid primary key default uuid_generate_v4(),
  tipo_pessoa text not null,
  visitor_id uuid references visitors(id),
  provider_id uuid references service_providers(id),
  resident_id uuid references residents(id),
  event_id uuid references events(id),
  event_guest_id uuid references event_guests(id),
  nome_avulso text,
  documento_avulso text,
  telefone_avulso text,
  unit_id uuid references units(id),
  resident_authorized_id uuid references residents(id),
  motivo text,
  placa text,
  veiculo_descricao text,
  foto_url text,
  observacoes_entrada text,
  observacoes_saida text,
  status text not null default 'dentro' check (status in ('dentro','saiu','cancelado')),
  entrada_em timestamptz default now(),
  saida_em timestamptz,
  entrada_por_user_id uuid references users_profile(id),
  saida_por_user_id uuid references users_profile(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table event_guests add constraint fk_access_log foreign key (access_log_id) references access_logs(id);

-- Encomendas
create table packages (
  id uuid primary key default uuid_generate_v4(),
  codigo_interno text not null unique,
  unit_id uuid not null references units(id),
  resident_id uuid references residents(id),
  transportadora text,
  descricao text not null,
  foto_url text,
  status text not null default 'pendente' check (status in ('pendente','entregue','devolvida','cancelada')),
  recebido_por_user_id uuid references users_profile(id),
  recebido_em timestamptz default now(),
  retirado_por_nome text,
  retirado_por_documento text,
  entregue_por_user_id uuid references users_profile(id),
  entregue_em timestamptz,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Logs de auditoria
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users_profile(id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  created_at timestamptz default now()
);

-- Índices
create index on events(data_evento);
create index on events(status);
create index on event_guests(event_id);
create index on event_guests(status);
create index on access_logs(status);
create index on access_logs(entrada_em);
create index on packages(status);
create index on packages(unit_id);

-- RLS
alter table users_profile enable row level security;
alter table units enable row level security;
alter table residents enable row level security;
alter table visitors enable row level security;
alter table service_providers enable row level security;
alter table common_areas enable row level security;
alter table events enable row level security;
alter table event_guests enable row level security;
alter table access_logs enable row level security;
alter table packages enable row level security;
alter table audit_logs enable row level security;

-- Política base: usuário autenticado vê tudo (refinamentos por perfil no código)
create policy "Authenticated read all" on users_profile for select to authenticated using (true);
create policy "Authenticated read" on units for select to authenticated using (true);
create policy "Authenticated read" on residents for select to authenticated using (true);
create policy "Authenticated read" on visitors for select to authenticated using (true);
create policy "Authenticated read" on service_providers for select to authenticated using (true);
create policy "Authenticated read" on common_areas for select to authenticated using (true);
create policy "Authenticated read" on events for select to authenticated using (true);
create policy "Authenticated read" on event_guests for select to authenticated using (true);
create policy "Authenticated read" on access_logs for select to authenticated using (true);
create policy "Authenticated read" on packages for select to authenticated using (true);
create policy "Authenticated read" on audit_logs for select to authenticated using (true);

create policy "Authenticated write" on units for all to authenticated using (true) with check (true);
create policy "Authenticated write" on residents for all to authenticated using (true) with check (true);
create policy "Authenticated write" on visitors for all to authenticated using (true) with check (true);
create policy "Authenticated write" on service_providers for all to authenticated using (true) with check (true);
create policy "Authenticated write" on common_areas for all to authenticated using (true) with check (true);
create policy "Authenticated write" on events for all to authenticated using (true) with check (true);
create policy "Authenticated write" on event_guests for all to authenticated using (true) with check (true);
create policy "Authenticated write" on access_logs for all to authenticated using (true) with check (true);
create policy "Authenticated write" on packages for all to authenticated using (true) with check (true);
create policy "Authenticated write" on audit_logs for all to authenticated using (true) with check (true);
create policy "Own profile" on users_profile for all to authenticated using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
