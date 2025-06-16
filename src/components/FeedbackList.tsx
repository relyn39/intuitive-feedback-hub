
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wand2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';
import { getRecentFeedbacks, analyzeFeedback } from '@/services/feedbackService';
import { useDemoMode } from '@/hooks/useDemoMode';

type Feedback = Tables<'feedbacks'>;

const FeedbackList = () => {
  const queryClient = useQueryClient();
  const { isDemoMode, getDemoFeedbacks } = useDemoMode();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks-recent'],
    queryFn: isDemoMode ? () => Promise.resolve(getDemoFeedbacks().slice(0, 5)) : getRecentFeedbacks,
  });

  const analysisMutation = useMutation({
    mutationFn: analyzeFeedback,
    onSuccess: () => {
        toast.success('Análise iniciada! O feedback será atualizado em breve.');
        queryClient.invalidateQueries({ queryKey: ['feedbacks-recent'] });
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
    },
    onError: (error) => {
        toast.error(`Erro ao analisar: ${error.message}`);
    }
  });

  if (isLoading) {
    return <div>Carregando feedbacks...</div>;
  }

  const renderAnalysis = (analysis: any) => {
    if (!analysis) return <Badge variant="outline">N/A</Badge>;
    const sentimentColor = {
        positive: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
        negative: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
        neutral: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    };
    return (
        <div className="flex flex-col gap-2 items-start">
            <Badge className={`${sentimentColor[analysis.sentiment as keyof typeof sentimentColor] || 'bg-gray-100 dark:bg-gray-800'}`}>
                {analysis.sentiment}
            </Badge>
            <p className="text-xs text-muted-foreground">{analysis.summary}</p>
            <div className="flex flex-wrap gap-1">
                {analysis.tags?.map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                  Últimos Feedbacks
                  {isDemoMode && (
                    <Badge variant="outline" className="text-xs">DEMO</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isDemoMode 
                    ? "Dados de demonstração - feedbacks fictícios para mostrar as funcionalidades"
                    : "Visualize os 5 feedbacks mais recentes."
                  }
                </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link to="/feedback">
                    Ver relatório completo
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Análise IA</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks?.map((fb: Feedback) => (
              <TableRow key={fb.id}>
                <TableCell className="font-medium">{fb.title}</TableCell>
                <TableCell><Badge variant="outline">{fb.source}</Badge></TableCell>
                <TableCell>{renderAnalysis(fb.analysis)}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => isDemoMode ? toast.info('Modo demonstração ativo - análise simulada') : analysisMutation.mutate(fb.id)}
                    disabled={(!isDemoMode && analysisMutation.isPending && analysisMutation.variables === fb.id)}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analisar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!isLoading && (!feedbacks || feedbacks.length === 0) && (
            <div className="text-center py-10 text-sm text-muted-foreground">
                <p>Nenhum feedback para mostrar.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackList;
