
export interface Insight {
  id: string;
  user_id: string;
  type: 'trend' | 'alert' | 'opportunity' | 'other';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  action: string | null;
  created_at: string;
  tags: string[] | null;
}
