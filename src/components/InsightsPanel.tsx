
import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Target } from 'lucide-react';

const insights = [
  {
    type: 'trend',
    icon: TrendingUp,
    title: 'Tendência Emergente',
    description: 'Aumento de 45% em menções sobre "acessibilidade" nos últimos 7 dias',
    severity: 'info',
    action: 'Investigar melhorias de UX'
  },
  {
    type: 'alert',
    icon: AlertCircle,
    title: 'Alerta de Sentimento',
    description: 'Sentimento negativo sobre "tempo de carregamento" subiu 23%',
    severity: 'warning',
    action: 'Review performance'
  },
  {
    type: 'opportunity',
    icon: Target,
    title: 'Oportunidade Identificada',
    description: 'Usuários premium reportam 40% mais satisfação com suporte',
    severity: 'success',
    action: 'Expandir programa premium'
  }
];

export const InsightsPanel = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">Insights Automáticos</h3>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const severityColors = {
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            warning: 'bg-orange-50 border-orange-200 text-orange-800',
            success: 'bg-green-50 border-green-200 text-green-800'
          };

          return (
            <div key={index} className={`p-4 rounded-lg border ${severityColors[insight.severity as keyof typeof severityColors]}`}>
              <div className="flex items-start space-x-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-sm opacity-90 mb-2">{insight.description}</p>
                  <button className="text-xs font-medium px-2 py-1 bg-white bg-opacity-70 rounded hover:bg-opacity-100 transition-colors">
                    {insight.action}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors">
          Ver todos os insights →
        </button>
      </div>
    </div>
  );
};
