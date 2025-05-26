
import React from 'react';
import { FeedbackDashboard } from '@/components/FeedbackDashboard';
import { Header } from '@/components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <FeedbackDashboard />
    </div>
  );
};

export default Index;
