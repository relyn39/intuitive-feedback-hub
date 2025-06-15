
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { FeedbackDashboard } from '@/components/FeedbackDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Roadmap from '@/components/Roadmap';

const Index = () => {
  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 md:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Dashboard de Feedback</h1>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-[300px] mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <FeedbackDashboard />
          </TabsContent>
          <TabsContent value="roadmap">
            <Roadmap />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
