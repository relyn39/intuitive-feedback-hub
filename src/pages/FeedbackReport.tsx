
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ReviewInsightDialog, InsightFormData } from '@/components/ReviewInsightDialog';
import { FeedbackToolbar } from '@/components/feedback/FeedbackToolbar';
import { FeedbackTable } from '@/components/feedback/FeedbackTable';
import { useDemoMode } from '@/hooks/useDemoMode';

const ITEMS_PER_PAGE = 10;

const FeedbackReport = () => {
    const queryClient = useQueryClient();
    const { source } = useParams<{ source?: string }>();
    const navigate = useNavigate();
    const { isDemoMode, getDemoFeedbacks } = useDemoMode();
    
    const [page, setPage] = useState(1);
    const [sourceFilter, setSourceFilter] = useState(source || 'all');
    const [tagInput, setTagInput] = useState('');
    const [debouncedTagFilter, setDebouncedTagFilter] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [insightToReview, setInsightToReview] = useState<InsightFormData | null>(null);

    useEffect(() => {
        setSourceFilter(source || 'all');
        setPage(1);
    }, [source]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTagFilter(tagInput);
            setPage(1);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [tagInput]);

    useEffect(() => {
        setSelectedRows([]);
    }, [page, sourceFilter, debouncedTagFilter]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['feedbacks', page, ITEMS_PER_PAGE, sourceFilter, debouncedTagFilter],
        queryFn: async () => {
            if (isDemoMode) {
                const demoFeedbacks = getDemoFeedbacks();
                let filteredFeedbacks = demoFeedbacks;

                if (sourceFilter !== 'all') {
                    filteredFeedbacks = demoFeedbacks.filter(fb => fb.source === sourceFilter);
                }

                if (debouncedTagFilter) {
                    filteredFeedbacks = filteredFeedbacks.filter(fb => 
                        fb.analysis?.tags?.some((tag: string) => 
                            tag.toLowerCase().includes(debouncedTagFilter.toLowerCase().trim())
                        )
                    );
                }

                const from = (page - 1) * ITEMS_PER_PAGE;
                const to = from + ITEMS_PER_PAGE;
                const paginatedFeedbacks = filteredFeedbacks.slice(from, to);

                return { 
                    feedbacks: paginatedFeedbacks, 
                    count: filteredFeedbacks.length 
                };
            }

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

            if (debouncedTagFilter) {
                query = query.contains('analysis', { tags: [debouncedTagFilter.toLowerCase().trim()] });
            }

            const { data, error, count } = await query;

            if (error) throw error;
            return { feedbacks: data, count };
        },
    });

    const generateInsightFromSelectionMutation = useMutation({
        mutationFn: async (feedbackIds: string[]) => {
            if (isDemoMode) {
                // Simular geração de insight em modo demo
                return {
                    insight: {
                        type: 'trend' as const,
                        severity: 'warning' as const,
                        title: 'Insight gerado a partir da seleção (DEMO)',
                        description: 'Este é um insight de demonstração gerado a partir dos feedbacks selecionados.',
                        action: 'Ação recomendada para demonstração.',
                        tags: ['demo', 'selecionado']
                    }
                };
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");
    
            const { data, error } = await supabase.functions.invoke('generate-insight-from-selection', {
                body: { feedback_ids: feedbackIds, user_id: user.id },
            });
            if (error) throw new Error(error.message);
            return data;
        },
        onSuccess: (data) => {
            toast.info('Insight preliminar gerado. Revise e aprove abaixo.');
            setInsightToReview(data.insight);
            setSelectedRows([]);
        },
        onError: (error) => {
            toast.error(`Erro ao gerar insight: ${error.message}`);
        }
    });

    const saveInsightMutation = useMutation({
        mutationFn: async (insightData: InsightFormData) => {
            if (isDemoMode) {
                // Simular salvamento em modo demo
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");
    
            const insightToInsert = { ...insightData, user_id: user.id };
            const { error } = await supabase.from('insights').insert(insightToInsert);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(isDemoMode ? 'Insight salvo com sucesso (DEMO)!' : 'Insight salvo com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['insights'] });
            setInsightToReview(null);
        },
        onError: (error: Error) => {
            toast.error(`Erro ao salvar o insight: ${error.message}`);
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

    const handleGenerateInsight = () => {
        if (selectedRows.length > 0) {
            generateInsightFromSelectionMutation.mutate(selectedRows);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ReviewInsightDialog
                open={!!insightToReview}
                onOpenChange={(open) => !open && setInsightToReview(null)}
                insight={insightToReview}
                onSave={(data) => saveInsightMutation.mutate(data)}
                isSaving={saveInsightMutation.isPending}
            />
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
                       <FeedbackToolbar 
                            selectedRowsCount={selectedRows.length}
                            onGenerateInsight={handleGenerateInsight}
                            isGeneratingInsight={generateInsightFromSelectionMutation.isPending}
                            sourceFilter={sourceFilter}
                            onSourceFilterChange={handleFilterChange}
                            tagInput={tagInput}
                            onTagInputChange={setTagInput}
                       />
                    </CardHeader>
                    <CardContent>
                        <FeedbackTable
                            feedbacks={feedbacks}
                            isLoading={isLoading}
                            isError={isError && !isDemoMode}
                            selectedRows={selectedRows}
                            setSelectedRows={setSelectedRows}
                            page={page}
                            totalPages={totalPages}
                            setPage={setPage}
                        />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default FeedbackReport;
