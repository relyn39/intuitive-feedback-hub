import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, X, Loader2 } from 'lucide-react';

export const ImportFeedback = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles.find(
      (file) => file.type === 'text/csv' || file.name.endsWith('.csv')
    );
    if (csvFile) {
      setFile(csvFile);
    } else {
      toast({
        title: 'Formato de arquivo inválido',
        description: 'Por favor, envie um arquivo no formato CSV.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Por favor, selecione um arquivo CSV para importar.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const feedbacks = results.data
          .filter((row: any): row is { title: string } => 
            row.title && typeof row.title === 'string' && row.title.trim() !== ''
          )
          .map((row: any) => ({
            title: row.title,
            description: row.description || null,
            customer_name: row.customer_name || null,
            interviewee_name: row.interviewee_name || null,
            conversation_at: row.conversation_at ? new Date(row.conversation_at).toISOString() : null,
          }));

        if (feedbacks.length === 0) {
          toast({
            title: 'Nenhum feedback válido encontrado',
            description: 'Verifique se o arquivo CSV tem uma coluna "title" com dados.',
            variant: 'destructive',
          });
          setIsImporting(false);
          return;
        }

        try {
          const { error } = await supabase.functions.invoke('manual-import-sync', {
            body: { feedbacks },
          });

          if (error) throw error;
          
          toast({
            title: 'Importação bem-sucedida!',
            description: `${feedbacks.length} feedbacks foram importados.`,
          });
          await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
          await queryClient.invalidateQueries();
          setOpen(false);
        } catch (error: any) {
          toast({
            title: 'Erro na importação',
            description: error.message || 'Não foi possível importar os feedbacks.',
            variant: 'destructive',
          });
        } finally {
          setIsImporting(false);
        }
      },
      error: (error: any) => {
        toast({
            title: 'Erro ao processar o arquivo',
            description: error.message,
            variant: 'destructive',
        });
        setIsImporting(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-semibold">
            {isDragActive ? 'Solte o arquivo aqui...' : 'Arraste e solte um arquivo CSV ou clique para selecionar'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Colunas: title, description (opcional), customer_name (opcional), interviewee_name (opcional), conversation_at (opcional).</p>
        </div>
      ) : (
        <div className="flex items-center justify-between space-x-2 p-3 border rounded-md bg-muted/50">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setFile(null)}>
              <X className="h-4 w-4" />
            </Button>
        </div>
      )}
      <Button onClick={handleImport} disabled={isImporting || !file} className="w-full">
        {isImporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importando...
          </>
        ) : (
          'Importar Feedbacks'
        )}
      </Button>
    </div>
  );
};
