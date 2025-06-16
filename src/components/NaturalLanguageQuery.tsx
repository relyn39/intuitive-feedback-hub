
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NaturalLanguageModal } from './NaturalLanguageModal';

const sampleQueries = [
  "Quais foram os problemas mais reportados no módulo de pagamento este mês?",
  "Como está o sentimento dos usuários sobre a nova funcionalidade de checkout?",
  "Quantos feedbacks negativos recebemos sobre performance na última semana?",
  "Quais são os tópicos emergentes nos feedbacks dos últimos 30 dias?"
];

export const NaturalLanguageQuery = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState('');

  const handleSampleQuery = (sample: string) => {
    setSelectedQuery(sample);
    setModalOpen(true);
  };

  const handleOpenModal = () => {
    setSelectedQuery('');
    setModalOpen(true);
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-card-foreground">Consulta em Linguagem Natural</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Faça perguntas sobre seus dados de feedback e obtenha insights detalhados através de nossa IA.
        </p>

        <Button
          onClick={handleOpenModal}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Abrir Consulta IA
        </Button>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Exemplos de consultas:</p>
          <div className="grid grid-cols-1 gap-2">
            {sampleQueries.slice(0, 3).map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSampleQuery(sample)}
                className="text-xs px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NaturalLanguageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialQuery={selectedQuery}
      />
    </div>
  );
};
