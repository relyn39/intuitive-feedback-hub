
import React from 'react';
import { Button } from '@/components/ui/button';

interface FeedbackPaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number | ((prevPage: number) => number)) => void;
}

export const FeedbackPagination: React.FC<FeedbackPaginationProps> = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center space-x-2 pt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
      >
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
      >
        Próxima
      </Button>
    </div>
  );
};
