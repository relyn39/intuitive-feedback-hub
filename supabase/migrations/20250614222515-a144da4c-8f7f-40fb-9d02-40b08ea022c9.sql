
-- Adiciona 'zapier' como uma nova opção de fonte de integração
ALTER TYPE public.feedback_source ADD VALUE IF NOT EXISTS 'zapier';

-- Adiciona um índice único para garantir que não haja feedbacks duplicados
-- de um mesmo sistema externo (como Jira ou Zapier).
-- Isso é importante para a função de "upsert" (atualizar ou inserir).
CREATE UNIQUE INDEX IF NOT EXISTS feedbacks_integration_id_external_id_idx
ON public.feedbacks (integration_id, external_id)
WHERE external_id IS NOT NULL;
