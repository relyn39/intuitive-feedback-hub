
import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Clock, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface NaturalLanguageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

const sampleQueries = [
  "Quais foram os problemas mais reportados no módulo de pagamento este mês?",
  "Como está o sentimento dos usuários sobre a nova funcionalidade de checkout?",
  "Quantos feedbacks negativos recebemos sobre performance na última semana?",
  "Quais são os tópicos emergentes nos feedbacks dos últimos 30 dias?"
];

export const NaturalLanguageModal = ({ open, onOpenChange, initialQuery = '' }: NaturalLanguageModalProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialQuery && open) {
      setQuery(initialQuery);
    }
  }, [initialQuery, open]);

  useEffect(() => {
    if (!open) {
      // Reset messages when modal closes
      setMessages([]);
      setQuery('');
    }
  }, [open]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return 'agora';
    if (seconds < 60) return `há ${seconds} seg`;
    const minutes = Math.floor(seconds / 60);
    return `há ${minutes} min`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setQuery('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      const { data, error } = await supabase.functions.invoke('natural-language-query', {
        body: { query: userMessage.content, user_id: user.id },
      });

      if (error) {
        throw new Error(`Erro ao consultar a IA: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Erro da IA: ${data.error}`);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      toast({
        title: "Erro na Consulta",
        description: error.message || "Não foi possível obter uma resposta da IA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuery = (sample: string) => {
    setQuery(sample);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Consulta em Linguagem Natural</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">Faça sua primeira pergunta</p>
                <p className="text-sm">Pergunte qualquer coisa sobre seus dados de feedback</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-muted-foreground">
                          IA • {formatTimeAgo(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.type === 'user' && (
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-primary-foreground/70">
                          {formatTimeAgo(message.timestamp)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-muted-foreground">IA está pensando...</span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sample Queries (only show when no messages) */}
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Exemplos de consultas:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((sample, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSampleQuery(sample)}
                    className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Faça uma pergunta sobre seus dados de feedback..."
                className="w-full p-4 border bg-background text-foreground rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                rows={3}
              />
              <Button
                type="submit"
                disabled={!query.trim() || isLoading}
                size="icon"
                className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transition-all duration-200"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
