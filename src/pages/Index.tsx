
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { FeedbackDashboard } from '@/components/FeedbackDashboard';
import FeedbackList from '@/components/FeedbackList';

const Index = () => {
  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard de Feedback</h1>
      </header>
      
      <main className="flex-1 p-6 space-y-6">
        <FeedbackDashboard />
        <FeedbackList />
      </main>
    </div>
  );
};

export default Index;
