
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, ArrowLeft, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Tables, Constants } from '@/integrations/supabase/types';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddManualFeedback } from '@/components/AddManualFeedback';
import { ImportFeedback } from '@/components/ImportFeedback';

type Feedback = Tables<'feedbacks'>;

const ITEMS_PER_PAGE = 10;

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

const FeedbackReport = () => {
    const queryClient = useQueryClient();
    const { source } = useParams<{ source?: string }>();
    const navigate = useNavigate();
    
    const [page, setPage] = useState(1);
    const [sourceFilter, setSourceFilter] = useState(source || 'all');
    const [addManualOpen, setAddManualOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        setSourceFilter(source || 'all');
        setPage(1);
    }, [source]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['feedbacks', page, ITEMS_PER_PAGE, sourceFilter],
        queryFn: async () => {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from('feedbacks')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (sourceFilter !== 'all') {
                query = query.eq('source', sourceFilter);
            }

            const { data, error, count } = await query;

            if (error) throw error;
            return { feedbacks: data, count };
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

    const feedbacks = data?.feedbacks ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const handleFilterChange = (value: string) => {
        if (value === 'all') {
            navigate('/feedback');
        } else {
            navigate(`/feedback/${value}`);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
                <Button variant="outline" size="sm" asChild>
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Dashboard
                    </Link>
                </Button>
            </header>
            <main className="flex-1 p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Relatório de Feedbacks</CardTitle>
                                <CardDescription>Visualize, analise e gerencie todos os feedbacks recebidos.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-full sm:w-auto sm:min-w-[200px]">
                                    <Select value={sourceFilter} onValueChange={handleFilterChange}>
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
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : isError || feedbacks.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-600">Nenhum feedback encontrado.</p>
                                <p className="text-sm text-gray-500 mt-1">Quando novos feedbacks forem adicionados, eles aparecerão aqui.</p>
                            </div>
                        ) : (
                            <>
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
                                        {feedbacks.map((fb: Feedback) => (
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
                                {totalPages > 1 && (
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
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default FeedbackReport;
