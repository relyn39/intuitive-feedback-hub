import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Minus, AlertTriangle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { fetchTopics, TopicItem } from '@/services/api';

const TopicSentimentIcon: React.FC<{ sentiment: 'positive' | 'negative' | 'neutral' }> = ({ sentiment }) => {
  if (sentiment === 'positive') return <CheckCircle className="h-4 w-4 text-green-500 mr-1" />;
  if (sentiment === 'negative') return <XCircle className="h-4 w-4 text-red-500 mr-1" />;
  return <Minus className="h-4 w-4 text-gray-500 mr-1" />; // Neutral
};

const TrendIcon: React.FC<{ change: string }> = ({ change }) => {
  if (change.startsWith('+')) return <ArrowUp className="h-3 w-3 text-green-500 mr-1" />;
  if (change.startsWith('-')) return <ArrowDown className="h-3 w-3 text-red-500 mr-1" />;
  return <Minus className="h-3 w-3 text-gray-500 mr-1" />;
};

const TopicsCluster: React.FC = () => {
  const { data: topics, isLoading, isError, error } = useQuery<TopicItem[], Error>({
    queryKey: ['topics'],
    queryFn: fetchTopics,
    // staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-1/3" /> {/* Title skeleton */}
          <Skeleton className="h-8 w-1/4" /> {/* Button skeleton */}
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <Skeleton className="h-5 w-1/2" /> {/* Topic name skeleton */}
                <Skeleton className="h-5 w-1/6" /> {/* Count skeleton */}
              </div>
              <div className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-1 rounded-full" /> {/* Sentiment icon skeleton */}
                <Skeleton className="h-4 w-1/4" /> {/* Change skeleton */}
              </div>
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tópicos em Destaque</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao Carregar Tópicos</AlertTitle>
            <AlertDescription>
              {error?.message || 'Não foi possível buscar os tópicos. Tente novamente mais tarde.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getSentimentBgColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    if (sentiment === 'positive') return 'bg-green-100 dark:bg-green-800/30';
    if (sentiment === 'negative') return 'bg-red-100 dark:bg-red-800/30';
    return 'bg-gray-100 dark:bg-gray-700/30';
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tópicos em Destaque</CardTitle>
        <Button variant="outline" size="sm" disabled> {/* Disabled as per current scope */}
          Ver análise completa
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics && topics.length > 0 ? (
          topics.slice(0, 5).map((topic) => ( // Displaying top 5 topics for brevity
            <div key={topic.id} className={`p-3 rounded-lg border ${getSentimentBgColor(topic.sentiment)}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-sm">{topic.name}</h3>
                <span className="text-xs text-muted-foreground">{topic.count} menções</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <TopicSentimentIcon sentiment={topic.sentiment} />
                Sentimento: {topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1)}
                <span className="mx-1.5">·</span>
                <TrendIcon change={topic.change} />
                {topic.change}
              </div>
              <div className="flex flex-wrap gap-1">
                {topic.keywords.slice(0, 3).map((keyword, index) => ( // Display up to 3 keywords
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum tópico encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopicsCluster;
