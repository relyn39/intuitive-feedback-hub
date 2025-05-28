import React, { useState, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react'; // Icons
import { useMutation } from '@tanstack/react-query';
import { postNLQuery, NLQResponse } from '@/services/api'; // Assuming api.ts is in src/services

const NaturalLanguageQuery: React.FC = () => {
  const [query, setQuery] = useState<string>('');

  const nlqMutation = useMutation<NLQResponse, Error, string>({ // <TData, TError, TVariables>
    mutationFn: postNLQuery,
    // Optional: onSuccess, onError, onSettled callbacks
    // onSuccess: (data) => { console.log("NLQ Success:", data); },
    // onError: (error) => { console.error("NLQ Error:", error); },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    nlqMutation.mutate(query);
  };

  const handleSampleQuery = (sample: string) => {
    setQuery(sample);
    // Optionally, submit directly or let user click submit
    // nlqMutation.mutate(sample); 
  };

  const sampleQueries = [
    'total feedbacks',
    'sentiment for module Login',
    'top issues',
    'show feedbacks for module UX',
  ];

  // Helper to render data if it's an array of items (like feedback list)
  const renderDataArray = (dataArray: any[]) => (
    <ul className="list-disc pl-5 space-y-2 mt-2 max-h-60 overflow-y-auto">
      {dataArray.map((item, index) => (
        <li key={item.id || index} className="text-xs border-b pb-1 mb-1">
          {item.text ? ( // Likely a feedback item
            <>
              <p><strong>Text:</strong> {item.text}</p>
              {item.sentiment && <p><strong>Sentiment:</strong> {item.sentiment}</p>}
              {item.user?.name && <p><strong>User:</strong> {item.user.name}</p>}
              {item.createdAt && <p><strong>Date:</strong> {new Date(item.createdAt).toLocaleDateString()}</p>}
            </>
          ) : ( // Fallback for other array data
            <pre>{JSON.stringify(item, null, 2)}</pre>
          )}
        </li>
      ))}
    </ul>
  );


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
          Consulta em Linguagem Natural
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pergunte algo sobre os feedbacks... (ex: 'quantos feedbacks sobre login?')"
            rows={3}
            disabled={nlqMutation.isPending}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            {sampleQueries.map((sq) => (
              <Button
                key={sq}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSampleQuery(sq)}
                disabled={nlqMutation.isPending}
                className="text-xs"
              >
                {sq}
              </Button>
            ))}
          </div>
          <Button type="submit" disabled={nlqMutation.isPending || !query.trim()}>
            {nlqMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Pergunta
          </Button>
        </form>

        {nlqMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
            <div className="flex items-center text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <h4 className="font-semibold">Erro ao Processar Pergunta</h4>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {(nlqMutation.error as Error)?.message || 'Ocorreu um erro desconhecido.'}
            </p>
          </div>
        )}

        {nlqMutation.isSuccess && nlqMutation.data && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
            <h4 className="font-semibold text-blue-700 dark:text-blue-300">Resposta:</h4>
            <p className="text-sm whitespace-pre-wrap">{nlqMutation.data.answer}</p>
            {nlqMutation.data.data && Array.isArray(nlqMutation.data.data) && nlqMutation.data.data.length > 0 && (
              <div className="mt-2">
                <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400">Dados Adicionais:</h5>
                {renderDataArray(nlqMutation.data.data)}
              </div>
            )}
             {nlqMutation.data.data && !Array.isArray(nlqMutation.data.data) && typeof nlqMutation.data.data === 'object' && Object.keys(nlqMutation.data.data).length > 0 && (
              <div className="mt-2">
                <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400">Dados Adicionais:</h5>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-60 overflow-y-auto">
                    {JSON.stringify(nlqMutation.data.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NaturalLanguageQuery;
