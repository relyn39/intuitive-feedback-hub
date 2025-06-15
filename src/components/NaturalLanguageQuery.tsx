
import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const sampleQueries = [
  "Quais foram os problemas mais reportados no módulo de pagamento este mês?",
  "Como está o sentimento dos usuários sobre a nova funcionalidade de checkout?",
  "Quantos feedbacks negativos recebemos sobre performance na última semana?",
  "Quais são os tópicos emergentes nos feedbacks dos últimos 30 dias?"
];

const mockResponses = [
  {
    query: "problemas módulo pagamento",
    response: "Encontrei 847 feedbacks sobre o módulo de pagamento este mês. Os principais problemas são: falhas no processamento de cartão (34%), lentidão no carregamento (28%) e erros de validação (19%). O sentimento geral diminuiu 12% comparado ao mês anterior."
  },
  {
    query: "sentimento checkout",
    response: "O sentimento sobre a nova funcionalidade de checkout é 72% positivo. Usuários elogiam a simplificação (89 menções), mas reportam confusão na seleção de endereço (23 feedbacks negativos). NPS aumentou de 7.2 para 8.1."
  }
];

export const NaturalLanguageQuery = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [lastQueryTime, setLastQueryTime] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const formatTimeAgo = () => {
      if (!lastQueryTime) return;
      const seconds = Math.floor((new Date().getTime() - lastQueryTime.getTime()) / 1000);
      if (seconds < 5) {
        setTimeAgo('agora');
      } else if (seconds < 60) {
        setTimeAgo(`há ${seconds} seg`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`há ${minutes} min`);
      }
    };

    if (lastQueryTime) {
      formatTimeAgo();
      const interval = setInterval(formatTimeAgo, 5000);
      return () => clearInterval(interval);
    }
  }, [lastQueryTime]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setLastQueryTime(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      const { data, error } = await supabase.functions.invoke('natural-language-query', {
        body: { query, user_id: user.id },
      });

      if (error) {
        throw new Error(`Erro ao consultar a IA: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Erro da IA: ${data.error}`);
      }

      setResponse(data.response);
      setLastQueryTime(new Date());

    } catch (error: any) {
      toast({
        title: "Erro na Consulta",
        description: error.message || "Não foi possível obter uma resposta da IA.",
        variant: "destructive",
      });
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuery = (sample: string) => {
    setQuery(sample);
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-card-foreground">Consulta em Linguagem Natural</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Faça uma pergunta sobre seus dados de feedback..."
            className="w-full p-4 border bg-background text-foreground rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground font-medium">Exemplos de consultas:</p>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.slice(0, 2).map((sample, index) => (
            <button
              key={index}
              onClick={() => handleSampleQuery(sample)}
              className="text-xs px-3 py-1 bg-muted text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {sample.length > 50 ? sample.substring(0, 50) + '...' : sample}
            </button>
          ))}
        </div>
      </div>

      {response && (
        <div className="mt-6 p-4 bg-accent rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-accent-foreground">Resposta da IA</span>
            {lastQueryTime && (
              <>
                <Clock className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-accent-foreground/80">{timeAgo}</span>
              </>
            )}
          </div>
          <p className="text-sm text-accent-foreground/90 leading-relaxed whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};
