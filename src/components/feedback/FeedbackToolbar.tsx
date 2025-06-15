
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddManualFeedback } from '@/components/AddManualFeedback';
import { ImportFeedback } from '@/components/ImportFeedback';
import { Wand2, Loader2, Plus, Upload } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';

interface FeedbackToolbarProps {
  selectedRowsCount: number;
  onGenerateInsight: () => void;
  isGeneratingInsight: boolean;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  tagInput: string;
  onTagInputChange: (value: string) => void;
}

export const FeedbackToolbar: React.FC<FeedbackToolbarProps> = ({
  selectedRowsCount,
  onGenerateInsight,
  isGeneratingInsight,
  sourceFilter,
  onSourceFilterChange,
  tagInput,
  onTagInputChange,
}) => {
  const [addManualOpen, setAddManualOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <CardTitle>Relatório de Feedbacks</CardTitle>
        <CardDescription>Visualize, analise e gerencie todos os feedbacks recebidos.</CardDescription>
      </div>
      <div className="flex items-center flex-wrap gap-2">
        {selectedRowsCount > 0 && (
          <Button onClick={onGenerateInsight} disabled={isGeneratingInsight}>
            {isGeneratingInsight ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Gerar Insight ({selectedRowsCount})
          </Button>
        )}
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as fontes</SelectItem>
              {Constants.public.Enums.feedback_source.map(sourceOpt => (
                <SelectItem key={sourceOpt} value={sourceOpt}>
                  {sourceOpt.charAt(0).toUpperCase() + sourceOpt.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto sm:min-w-[200px]">
          <Input
            placeholder="Filtrar por tag da IA..."
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
          />
        </div>
        <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Feedback Manualmente</DialogTitle>
            </DialogHeader>
            <AddManualFeedback setOpen={setAddManualOpen} />
          </DialogContent>
        </Dialog>

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Importar Feedbacks de CSV</DialogTitle>
            </DialogHeader>
            <ImportFeedback setOpen={setImportOpen} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
