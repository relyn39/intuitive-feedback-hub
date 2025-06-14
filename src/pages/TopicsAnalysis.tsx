
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TopicsAnalysis = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background -mx-6 -mt-6 mb-6 sm:px-6">
        <h1 className="text-xl font-bold text-gray-900">Análise de Tópicos</h1>
        <Button variant="outline" asChild>
            <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
            </Link>
        </Button>
      </header>
      <p className="text-gray-600">
        Análise detalhada dos tópicos e clusters identificados a partir dos feedbacks dos seus usuários.
      </p>
      <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-center text-gray-500 font-medium">Página em construção.</p>
        <p className="text-sm text-gray-400 mt-2">Em breve, você poderá ver detalhes aprofundados sobre cada tópico aqui.</p>
      </div>
    </div>
  );
};

export default TopicsAnalysis;
