
import React, { useState } from 'react';
import { Send, Sparkles, Clock } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockResponse = mockResponses.find(r => 
        query.toLowerCase().includes(r.query)
      )?.response || "Analisando seus dados... Encontrei insights relevantes sobre essa consulta. Os dados mostram padrões interessantes que podem ajudar na tomada de decisão.";
      
      setResponse(mockResponse);
      setIsLoading(false);
    }, 2000);
  };

  const handleSampleQuery = (sample: string) => {
    setQuery(sample);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Consulta em Linguagem Natural</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Faça uma pergunta sobre seus dados de feedback..."
            className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
        <p className="text-sm text-gray-600 font-medium">Exemplos de consultas:</p>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.slice(0, 2).map((sample, index) => (
            <button
              key={index}
              onClick={() => handleSampleQuery(sample)}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {sample.length > 50 ? sample.substring(0, 50) + '...' : sample}
            </button>
          ))}
        </div>
      </div>

      {response && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Resposta da IA</span>
            <Clock className="w-3 h-3 text-purple-600" />
            <span className="text-xs text-purple-700">Agora</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{response}</p>
        </div>
      )}
    </div>
  );
};
