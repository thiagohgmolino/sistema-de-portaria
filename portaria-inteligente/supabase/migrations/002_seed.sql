-- Seed de dados para testes
-- Execute APÓS criar os usuários via Supabase Auth com os e-mails abaixo.
-- Depois cole os auth_user_id reais nos INSERTs de users_profile.

-- Unidades
insert into units (bloco, numero, tipo) values
  ('A', '101', 'apartamento'),
  ('A', '102', 'apartamento'),
  ('B', '201', 'apartamento'),
  ('B', '202', 'apartamento');

-- Moradores (vincule ao unit_id real após criar as unidades)
-- insert into residents (nome, email, telefone, unit_id, tipo) values
--   ('João Silva', 'morador@portaria.local', '(11) 98888-1111', '<uuid-A101>', 'proprietario'),
--   ('Maria Souza', 'maria@email.com', '(11) 98888-2222', '<uuid-A102>', 'proprietario'),
--   ('Carlos Oliveira', 'carlos@email.com', '(11) 98888-3333', '<uuid-B201>', 'inquilino');

-- Áreas comuns
insert into common_areas (nome, descricao, capacidade_maxima, exige_aprovacao, permite_lista_convidados, prazo_envio_lista_horas, prazo_edicao_lista_horas) values
  ('Salão de Festas', 'Salão principal para festas e eventos', 80, false, true, 24, 2),
  ('Churrasqueira', 'Área de churrasqueira coberta', 30, false, true, 12, 1),
  ('Espaço Gourmet', 'Cozinha equipada e área social', 40, true, true, 24, 2);

-- Nota: o evento de exemplo e seus convidados devem ser criados após
-- ter os IDs reais de units, residents e common_areas.
-- Use o script abaixo substituindo os UUIDs:

-- insert into events (common_area_id, unit_id, resident_id, nome_evento, tipo_evento, data_evento, horario_inicio, horario_fim, quantidade_estimada, status, regras_aceitas, criado_por_user_id) values
--   ('<common_area_id>', '<unit_id>', '<resident_id>', 'Aniversário do Gabriel', 'aniversario', current_date, '18:00', '23:00', 40, 'aprovado', true, '<user_profile_id>');

-- insert into event_guests (event_id, nome, status) values
--   ('<event_id>', 'Pedro Almeida', 'aguardado'),
--   ('<event_id>', 'Ana Costa', 'aguardado'),
--   ('<event_id>', 'Bruno Martins', 'chegou'),
--   ('<event_id>', 'Fernanda Lima', 'aguardado'),
--   ('<event_id>', 'Rafael Souza', 'aguardado');
