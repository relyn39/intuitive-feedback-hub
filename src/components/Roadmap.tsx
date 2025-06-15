import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddOpportunityDialog from './AddOpportunityDialog';

// Tipos locais, já que types.ts é somente leitura
type OpportunityStatus = 'backlog' | 'próximo' | 'em_andamento' | 'concluído';
const statuses: OpportunityStatus[] = ['backlog', 'próximo', 'em_andamento', 'concluído'];

interface ProductOpportunity {
  id: string;
  title: string;
  description: string | null;
  status: OpportunityStatus;
}

const statusTranslations: Record<OpportunityStatus, string> = {
  backlog: 'Backlog',
  próximo: 'Próximo',
  em_andamento: 'Em Andamento',
  concluído: 'Concluído',
};

const fetchOpportunities = async (): Promise<ProductOpportunity[]> => {
  const { data, error } = await supabase.from('product_opportunities').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Erro ao buscar oportunidades:', error);
    throw new Error('Não foi possível carregar as oportunidades do produto.');
  }
  return data as ProductOpportunity[];
};

const Roadmap = () => {
  const { data: opportunities, isLoading, error } = useQuery<ProductOpportunity[]>({
    queryKey: ['product_opportunities'],
    queryFn: fetchOpportunities,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Roadmap Visual</CardTitle>
        <AddOpportunityDialog />
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <p className="ml-2 text-gray-500">Carregando o roadmap...</p>
          </div>
        )}
        {error instanceof Error && (
            <div className="text-center py-16 text-red-500">
                <p>Ocorreu um erro ao carregar o roadmap.</p>
                <p className="text-sm">{error.message}</p>
            </div>
        )}
        {opportunities && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statuses.map(status => (
              <div key={status} className="bg-muted p-4 rounded-lg border">
                <h3 className="font-semibold capitalize text-foreground mb-4">{statusTranslations[status]}</h3>
                <div className="space-y-3 min-h-[100px]">
                  {opportunities.filter(o => o.status === status).map(opp => (
                    <Card key={opp.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm text-card-foreground">{opp.title}</h4>
                        {opp.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{opp.description}</p>}
                      </CardContent>
                    </Card>
                  ))}
                  {opportunities.filter(o => o.status === status).length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-4">
                          Nenhuma oportunidade nesta etapa.
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && !error && !opportunities?.length && (
            <div className="text-center py-16">
                <p className="font-medium text-muted-foreground">Nenhuma oportunidade no roadmap.</p>
                <p className="mt-2 text-sm text-muted-foreground">Comece criando uma nova oportunidade para visualizar aqui.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Roadmap;
