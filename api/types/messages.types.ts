export interface Conversation {
  id: string;
  subject: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  messages: Message[];
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  order_id?: string;
  listing_id?: string;
  parent_message_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_flagged?: boolean;
  reported_by?: string;
  reported_at?: string;
  report_reason?: string;
}
