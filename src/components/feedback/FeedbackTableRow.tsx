
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

type Feedback = Tables<'feedbacks'>;

interface FeedbackTableRowProps {
  feedback: Feedback;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
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
};

export const FeedbackTableRow: React.FC<FeedbackTableRowProps> = ({ feedback, isSelected, onSelectionChange }) => {
  const queryClient = useQueryClient();

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
    },
  });

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(!!checked)}
          aria-label="Selecionar linha"
        />
      </TableCell>
      <TableCell className="font-medium">{feedback.title}</TableCell>
      <TableCell><Badge variant="outline">{feedback.source}</Badge></TableCell>
      <TableCell>{renderAnalysis(feedback.analysis)}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => analysisMutation.mutate(feedback.id)}
          disabled={analysisMutation.isPending && analysisMutation.variables === feedback.id}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Analisar
        </Button>
      </TableCell>
    </TableRow>
  );
};
