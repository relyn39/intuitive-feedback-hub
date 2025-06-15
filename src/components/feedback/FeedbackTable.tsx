
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { FeedbackTableRow } from './FeedbackTableRow';
import { FeedbackPagination } from './FeedbackPagination';

type Feedback = Tables<'feedbacks'>;

interface FeedbackTableProps {
  feedbacks: Feedback[];
  isLoading: boolean;
  isError: boolean;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  page: number;
  totalPages: number;
  setPage: (page: number | ((prevPage: number) => number)) => void;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({
  feedbacks,
  isLoading,
  isError,
  selectedRows,
  setSelectedRows,
  page,
  totalPages,
  setPage
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(feedbacks.map(fb => fb.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleRowSelectionChange = (feedbackId: string, checked: boolean) => {
    setSelectedRows(prev =>
      checked
        ? [...prev, feedbackId]
        : prev.filter(id => id !== feedbackId)
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || feedbacks.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">Nenhum feedback encontrado.</p>
        <p className="text-sm text-gray-500 mt-1">Quando novos feedbacks forem adicionados, eles aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={feedbacks.length > 0 && selectedRows.length === feedbacks.length}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                aria-label="Selecionar todas as linhas"
              />
            </TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Fonte</TableHead>
            <TableHead>Análise IA</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((fb) => (
            <FeedbackTableRow
              key={fb.id}
              feedback={fb}
              isSelected={selectedRows.includes(fb.id)}
              onSelectionChange={(checked) => handleRowSelectionChange(fb.id, checked)}
            />
          ))}
        </TableBody>
      </Table>
      <FeedbackPagination page={page} totalPages={totalPages} setPage={setPage} />
    </>
  );
};
