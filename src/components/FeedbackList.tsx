
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type Feedback = Tables<'feedbacks'>;

const FeedbackList = () => {
  const queryClient = useQueryClient();

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
        const { error } = await supabase.functions.invoke('analyze-feedback', {
            body: { feedback_id: feedbackId },
        });
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
        toast.success('Análise iniciada! O feedback será atualizado em breve.');
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
        positive: 'bg-green-100 text-green-800',
        negative: 'bg-red-100 text-red-800',
        neutral: 'bg-yellow-100 text-yellow-800',
    };
    return (
        <div className="flex flex-col gap-2 items-start">
            <Badge className={sentimentColor[analysis.sentiment as keyof typeof sentimentColor] || 'bg-gray-100'}>
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
        <CardTitle>Últimos Feedbacks</CardTitle>
        <CardDescription>Visualize e analise os feedbacks recebidos.</CardDescription>
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
                    onClick={() => analysisMutation.mutate(fb.id)}
                    disabled={analysisMutation.isPending && analysisMutation.variables === fb.id}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analisar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FeedbackList;
