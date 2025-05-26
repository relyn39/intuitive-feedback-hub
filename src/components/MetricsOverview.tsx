
import React from 'react';
import { TrendingUp, TrendingDown, Users, MessageCircle, Star, AlertTriangle } from 'lucide-react';

const metrics = [
  {
    title: 'Total de Feedbacks',
    value: '342.5K',
    change: '+12.5%',
    trend: 'up',
    icon: MessageCircle,
    color: 'blue'
  },
  {
    title: 'Sentimento Positivo',
    value: '68.3%',
    change: '+4.2%',
    trend: 'up',
    icon: Star,
    color: 'green'
  },
  {
    title: 'Usuários Ativos',
    value: '89.2K',
    change: '+8.7%',
    trend: 'up',
    icon: Users,
    color: 'purple'
  },
  {
    title: 'Issues Críticos',
    value: '127',
    change: '-15.3%',
    trend: 'down',
    icon: AlertTriangle,
    color: 'red'
  }
];

export const MetricsOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${metric.color}-50`}>
                <Icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span>{metric.change}</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
