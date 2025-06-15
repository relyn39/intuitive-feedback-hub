
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import SettingsIntegrations from "./pages/SettingsIntegrations";
import SettingsAi from "./pages/SettingsAi";
import NotFound from "./pages/NotFound";
import FeedbackReport from "./pages/FeedbackReport";
import AuthPage from "./pages/AuthPage";
import SettingsUsers from "./pages/SettingsUsers";
import TopicsAnalysis from "./pages/TopicsAnalysis"; // Import the new page
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import { supabase } from './integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();

declare global {
  interface Window {
    pendo?: {
      initialize: (options: {
        visitor: { id: string; email?: string };
        account: { id: string };
      }) => void;
    };
  }
}

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && window.pendo) {
      window.pendo.initialize({
        visitor: {
          id: session.user.id,
          email: session.user.email,
        },
        account: {
          // Using user's id as account id as a placeholder.
          // This should be updated if your application has a concept of accounts/organizations.
          id: session.user.id,
        },
      });
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {session ? (
              <SidebarProvider>
                <div className="min-h-screen flex w-full">
                  <AppSidebar />
                  <SidebarInset className="flex-1 relative">
                    <div className="absolute top-4 right-6 z-50">
                      <ThemeToggle />
                    </div>
                    <Routes>
                      <Route path="/update-password" element={<UpdatePasswordPage />} />
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Navigate to="/" replace />} />
                      <Route path="/feedback" element={<FeedbackReport />} />
                      <Route path="/feedback/:source" element={<FeedbackReport />} />
                      <Route path="/topics-analysis" element={<TopicsAnalysis />} />
                      <Route path="/settings" element={<Settings />}>
                        <Route path="integrations" element={<SettingsIntegrations />} />
                        <Route path="ai" element={<SettingsAi />} />
                        <Route path="users" element={<SettingsUsers />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            ) : (
               <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
              </Routes>
            )}
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
