
import React from 'react';
import { AiManager } from '@/components/AiManager';

const SettingsAi = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inteligência Artificial</h2>
        <p className="text-muted-foreground">
          Configure seu provedor de LLM para análise automática de feedbacks.
        </p>
      </div>
      
      <AiManager />
    </div>
  );
};

export default SettingsAi;
