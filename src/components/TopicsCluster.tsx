
import React from 'react';
import { Hash, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const topics = [
  {
    id: 1,
    name: 'Performance & Velocidade',
    count: 2847,
    sentiment: 'negative',
    change: -12,
    keywords: ['lento', 'carregamento', 'performance', 'travando']
  },
  {
    id: 2,
    name: 'Interface & Design',
    count: 1923,
    sentiment: 'positive',
    change: 8,
    keywords: ['bonito', 'design', 'interface', 'visual']
  },
  {
    id: 3,
    name: 'Funcionalidades de Pagamento',
    count: 1456,
    sentiment: 'negative',
    change: -5,
    keywords: ['pagamento', 'cartão', 'falha', 'erro']
  },
  {
    id: 4,
    name: 'Suporte ao Cliente',
    count: 1203,
    sentiment: 'positive',
    change: 15,
    keywords: ['suporte', 'atendimento', 'ajuda', 'rápido']
  },
  {
    id: 5,
    name: 'Mobile Experience',
    count: 987,
    sentiment: 'neutral',
    change: 0,
    keywords: ['mobile', 'celular', 'app', 'responsivo']
  }
];

export const TopicsCluster = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tópicos Mais Discutidos</h3>
          <p className="text-sm text-gray-600">Clustering automático baseado em análise semântica</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
          Ver análise completa →
        </button>
      </div>

      <div className="space-y-4">
        {topics.map((topic) => {
          const sentimentColors = {
            positive: 'bg-green-50 border-green-200',
            negative: 'bg-red-50 border-red-200',
            neutral: 'bg-gray-50 border-gray-200'
          };

          const ChangeIcon = topic.change > 0 ? ArrowUp : topic.change < 0 ? ArrowDown : Minus;
          const changeColor = topic.change > 0 ? 'text-green-600' : topic.change < 0 ? 'text-red-600' : 'text-gray-600';

          return (
            <div key={topic.id} className={`p-4 rounded-lg border ${sentimentColors[topic.sentiment as keyof typeof sentimentColors]}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{topic.name}</h4>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">{topic.count.toLocaleString()} menções</span>
                  <div className={`flex items-center space-x-1 ${changeColor}`}>
                    <ChangeIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">{Math.abs(topic.change)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {topic.keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-white bg-opacity-60 text-xs text-gray-700 rounded-md">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
