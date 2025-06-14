
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import subDays from 'https://esm.sh/date-fns@2.22.1/subDays';
import startOfDay from 'https://esm.sh/date-fns@2.22.1/startOfDay';

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    if (current === previous) {
        return 0;
    }
    return ((current - previous) / previous) * 100;
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { user_id } = await req.json();
        if (!user_id) throw new Error('O user_id é obrigatório.');

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const now = new Date();
        const thirtyDaysAgo = subDays(startOfDay(now), 30);
        const sixtyDaysAgo = subDays(startOfDay(now), 60);

        // Fetch data for the last 30 days
        const { data: currentFeedbacks, error: currentError } = await supabaseAdmin
            .from('feedbacks')
            .select('analysis, priority')
            .eq('user_id', user_id)
            .gte('created_at', thirtyDaysAgo.toISOString());
        
        if (currentError) throw currentError;

        // Fetch data for the 30 days before that
        const { data: previousFeedbacks, error: previousError } = await supabaseAdmin
            .from('feedbacks')
            .select('analysis, priority')
            .eq('user_id', user_id)
            .gte('created_at', sixtyDaysAgo.toISOString())
            .lt('created_at', thirtyDaysAgo.toISOString());
        
        if (previousError) throw previousError;

        // Calculate metrics for current period
        const totalItems = currentFeedbacks.length;
        const positiveCount = currentFeedbacks.filter(fb => (fb.analysis as any)?.sentiment === 'positive').length;
        const positivePercentage = totalItems > 0 ? (positiveCount / totalItems) * 100 : 0;
        const criticalCount = currentFeedbacks.filter(fb => fb.priority === 'critical').length;
        
        // Calculate metrics for previous period
        const prevTotalItems = previousFeedbacks.length;
        const prevPositiveCount = previousFeedbacks.filter(fb => (fb.analysis as any)?.sentiment === 'positive').length;
        const prevPositivePercentage = prevTotalItems > 0 ? (prevPositiveCount / prevTotalItems) * 100 : 0;
        const prevCriticalCount = previousFeedbacks.filter(fb => fb.priority === 'critical').length;

        // Calculate changes
        const totalItemsChange = calculateChange(totalItems, prevTotalItems);
        const positivePercentageChange = positivePercentage - prevPositivePercentage;
        const criticalCountChange = calculateChange(criticalCount, prevCriticalCount);

        const metrics = {
            totalItems: {
                value: totalItems,
                change: totalItemsChange,
            },
            positiveSentiment: {
                value: positivePercentage,
                change: positivePercentageChange,
            },
            criticalIssues: {
                value: criticalCount,
                change: criticalCountChange,
            },
        };

        return new Response(JSON.stringify(metrics), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Erro na função calculate-metrics:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
