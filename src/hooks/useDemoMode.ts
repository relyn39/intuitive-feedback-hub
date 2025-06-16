
import { useState, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';

type Feedback = Tables<'feedbacks'>;
type Insight = Tables<'insights'>;

const DEMO_FEEDBACKS: Feedback[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    integration_id: null,
    source: 'manual',
    status: 'new',
    priority: 'high',
    title: 'Bug no checkout - Pagamento não processado',
    description: 'O sistema de pagamento falha quando tento usar cartão de crédito. Aparece uma mensagem de erro genérica.',
    tags: ['bug', 'pagamento', 'checkout'],
    customer_name: 'Maria Silva',
    interviewee_name: null,
    metadata: {},
    analysis: {
      sentiment: 'negative',
      summary: 'Bug crítico no sistema de pagamento afetando conversões',
      tags: ['bug-critico', 'pagamento', 'ux']
    },
    external_id: null,
    external_created_at: null,
    external_updated_at: null,
    conversation_at: null,
    is_topic_analyzed: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'demo-2',
    user_id: 'demo-user',
    integration_id: null,
    source: 'jira',
    status: 'in_progress',
    priority: 'medium',
    title: 'Interface do dashboard poderia ser mais intuitiva',
    description: 'Adorei o produto! Só acho que o dashboard principal poderia ter os botões mais destacados e talvez cores mais vibrantes.',
    tags: ['ui', 'dashboard', 'usabilidade'],
    customer_name: 'João Santos',
    interviewee_name: null,
    metadata: {},
    analysis: {
      sentiment: 'positive',
      summary: 'Feedback positivo com sugestão de melhoria na interface',
      tags: ['melhoria-ui', 'dashboard', 'experiencia-positiva']
    },
    external_id: 'JIRA-123',
    external_created_at: '2024-01-14T14:20:00Z',
    external_updated_at: '2024-01-14T14:20:00Z',
    conversation_at: null,
    is_topic_analyzed: true,
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T14:20:00Z'
  },
  {
    id: 'demo-3',
    user_id: 'demo-user',
    integration_id: null,
    source: 'notion',
    status: 'resolved',
    priority: 'low',
    title: 'Funcionalidade de relatórios é excelente',
    description: 'A nova funcionalidade de relatórios automatizados economizou muito tempo da nossa equipe. Parabéns!',
    tags: ['relatórios', 'automação', 'produtividade'],
    customer_name: 'Ana Costa',
    interviewee_name: null,
    metadata: {},
    analysis: {
      sentiment: 'positive',
      summary: 'Elogio à funcionalidade de relatórios automatizados',
      tags: ['feature-sucesso', 'produtividade', 'automacao']
    },
    external_id: 'NOTION-456',
    external_created_at: '2024-01-13T09:15:00Z',
    external_updated_at: '2024-01-13T09:15:00Z',
    conversation_at: null,
    is_topic_analyzed: true,
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z'
  },
  {
    id: 'demo-4',
    user_id: 'demo-user',
    integration_id: null,
    source: 'manual',
    status: 'new',
    priority: 'medium',
    title: 'Performance lenta em dispositivos móveis',
    description: 'O app demora muito para carregar no meu celular. Às vezes trava completamente.',
    tags: ['performance', 'mobile', 'lentidão'],
    customer_name: 'Carlos Oliveira',
    interviewee_name: null,
    metadata: {},
    analysis: {
      sentiment: 'negative',
      summary: 'Problemas de performance em dispositivos móveis',
      tags: ['performance', 'mobile', 'otimizacao']
    },
    external_id: null,
    external_created_at: null,
    external_updated_at: null,
    conversation_at: null,
    is_topic_analyzed: true,
    created_at: '2024-01-12T16:45:00Z',
    updated_at: '2024-01-12T16:45:00Z'
  },
  {
    id: 'demo-5',
    user_id: 'demo-user',
    integration_id: null,
    source: 'zapier',
    status: 'in_progress',
    priority: 'high',
    title: 'Integração com Slack não funciona',
    description: 'Configurei a integração com o Slack mas as notificações não estão chegando. Já tentei reconfigurar várias vezes.',
    tags: ['integração', 'slack', 'notificações'],
    customer_name: 'Fernanda Lima',
    interviewee_name: null,
    metadata: {},
    analysis: {
      sentiment: 'negative',
      summary: 'Falha na integração com Slack afetando notificações',
      tags: ['integracao', 'slack', 'notificacoes']
    },
    external_id: 'ZAP-789',
    external_created_at: '2024-01-11T11:30:00Z',
    external_updated_at: '2024-01-11T11:30:00Z',
    conversation_at: null,
    is_topic_analyzed: true,
    created_at: '2024-01-11T11:30:00Z',
    updated_at: '2024-01-11T11:30:00Z'
  }
];

const DEMO_INSIGHTS: Insight[] = [
  {
    id: 'insight-1',
    user_id: 'demo-user',
    type: 'trend',
    severity: 'error',
    title: 'Aumento de 40% em bugs de pagamento',
    description: 'Identificamos um padrão crescente de problemas relacionados ao sistema de pagamento nas últimas duas semanas. Isso pode estar impactando significativamente as conversões.',
    action: 'Priorizar correção do módulo de pagamento e implementar testes automatizados mais robustos.',
    tags: ['pagamento', 'bugs', 'conversao'],
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: 'insight-2',
    user_id: 'demo-user',
    type: 'opportunity',
    severity: 'success',
    title: 'Sentimento positivo sobre relatórios',
    description: 'Os usuários estão muito satisfeitos com a nova funcionalidade de relatórios automatizados, mencionando ganhos significativos de produtividade.',
    action: 'Considerar expandir as funcionalidades de relatórios com base no feedback positivo.',
    tags: ['relatorios', 'produtividade', 'satisfacao'],
    created_at: '2024-01-14T12:00:00Z'
  },
  {
    id: 'insight-3',
    user_id: 'demo-user',
    type: 'other',
    severity: 'info',
    title: 'Demanda por melhorias na interface',
    description: 'Vários usuários sugerem melhorias na interface do dashboard, focando em maior destaque para botões principais e cores mais vibrantes.',
    action: 'Agendar sessão de design para revisar e atualizar a interface do dashboard.',
    tags: ['ui', 'dashboard', 'design'],
    created_at: '2024-01-13T15:30:00Z'
  }
];

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const stored = localStorage.getItem('feedback-hub-demo-mode');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('feedback-hub-demo-mode', isDemoMode.toString());
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
  };

  const getDemoFeedbacks = () => DEMO_FEEDBACKS;
  const getDemoInsights = () => DEMO_INSIGHTS;

  return {
    isDemoMode,
    toggleDemoMode,
    getDemoFeedbacks,
    getDemoInsights
  };
};
