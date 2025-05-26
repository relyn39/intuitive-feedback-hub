
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
  { date: '01/05', positive: 68, negative: 15, neutral: 17, total: 1200 },
  { date: '02/05', positive: 72, negative: 12, neutral: 16, total: 1350 },
  { date: '03/05', positive: 70, negative: 18, neutral: 12, total: 1100 },
  { date: '04/05', positive: 75, negative: 10, neutral: 15, total: 1450 },
  { date: '05/05', positive: 69, negative: 16, neutral: 15, total: 1320 },
  { date: '06/05', positive: 73, negative: 11, neutral: 16, total: 1380 },
  { date: '07/05', positive: 78, negative: 8, neutral: 14, total: 1520 }
];

export const TrendChart = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Análise de Sentimento - Últimos 7 dias</h3>
          <p className="text-sm text-gray-600">Distribuição e tendências do sentimento dos feedbacks</p>
        </div>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Positivo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Negativo</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600">Neutro</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="positive" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorPositive)"
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="negative" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorNegative)"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="neutral" 
              stroke="#6b7280" 
              strokeWidth={2}
              dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
