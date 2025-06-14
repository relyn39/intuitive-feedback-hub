
export interface FeedbackPayload {
  external_id?: string;
  title: string;
  description?: string;
  customer_name?: string;
  tags?: string[];
  created_at?: string; // Should be ISO 8601 string
}
