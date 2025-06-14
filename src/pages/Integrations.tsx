
import React from 'react';
import { Header } from '@/components/Header';
import { IntegrationsManager } from '@/components/IntegrationsManager';

const Integrations = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <IntegrationsManager />
      </div>
    </div>
  );
};

export default Integrations;
