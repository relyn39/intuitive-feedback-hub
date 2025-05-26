
import React from 'react';
import { MetricsOverview } from './MetricsOverview';
import { SentimentAnalysis } from './SentimentAnalysis';
import { TopicsCluster } from './TopicsCluster';
import { NaturalLanguageQuery } from './NaturalLanguageQuery';
import { InsightsPanel } from './InsightsPanel';
import { TrendChart } from './TrendChart';

export const FeedbackDashboard = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Feedback</h1>
          <p className="text-gray-600 mt-1">Análise inteligente de feedback dos usuários em tempo real</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
            Atualizar Dados
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Exportar Relatório
          </button>
        </div>
      </div>

      <MetricsOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NaturalLanguageQuery />
        <InsightsPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>
        <SentimentAnalysis />
      </div>

      <TopicsCluster />
    </div>
  );
};
