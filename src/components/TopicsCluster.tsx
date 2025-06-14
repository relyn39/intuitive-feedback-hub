import React from 'react';
import { Hash, ArrowUp, ArrowDown, Minus, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface Topic {
  id: number;
  name: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  change: number;
  keywords: string[];
}

const fetchTopics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.functions.invoke('analyze-topics', {
        body: { user_id: user.id },
    });

    if (error) throw new Error(error.message);
    if (!data || !data.topics) throw new Error("Invalid response from analyze-topics function");

    return data.topics as Topic[];
};

export const TopicsCluster = () => {
    const { data: topics, isLoading, isError, error } = useQuery<Topic[]>({
        queryKey: ['topics-cluster'],
        queryFn: fetchTopics,
    });

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tópicos Mais Discutidos</h3>
                    <p className="text-sm text-gray-600">Clustering automático baseado em análise semântica</p>
                </div>
                <Link to="/topics-analysis" className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center gap-1">
                    Ver análise completa
                    <ArrowUpRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="space-y-4">
                {isLoading && (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
                )}

                {!isLoading && (isError || !topics || topics.length === 0) && (
                    <div className="text-center py-10">
                        <p className="text-gray-600">Não há tópicos para serem exibidos.</p>
                        <p className="text-sm text-gray-500 mt-1">Analise mais feedbacks para ver os tópicos discutidos aqui.</p>
                    </div>
                )}
                
                {!isLoading && !isError && topics && topics.map((topic) => {
                    const sentimentColors = {
                        positive: 'bg-green-50 border-green-200',
                        negative: 'bg-red-50 border-red-200',
                        neutral: 'bg-gray-50 border-gray-200'
                    };

                    const ChangeIcon = topic.change > 0 ? ArrowUp : topic.change < 0 ? ArrowDown : Minus;
                    const changeColor = topic.change > 0 ? 'text-green-600' : topic.change < 0 ? 'text-red-600' : 'text-gray-600';

                    return (
                        <div key={topic.id} className={`p-4 rounded-lg border ${sentimentColors[topic.sentiment as keyof typeof sentimentColors]}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <Hash className="w-5 h-5 text-gray-600" />
                                    <h4 className="font-medium text-gray-900">{topic.name}</h4>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-700">{topic.count.toLocaleString()} menções</span>
                                    <div className={`flex items-center space-x-1 ${changeColor}`}>
                                        <ChangeIcon className="w-3 h-3" />
                                        <span className="text-xs font-medium">{Math.abs(topic.change)}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {topic.keywords.map((keyword, index) => (
                                    <span key={index} className="px-2 py-1 bg-white bg-opacity-60 text-xs text-gray-700 rounded-md">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
