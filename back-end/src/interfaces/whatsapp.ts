export interface CreateConnectionDTO {
  userId: string;
  phone_number: string;
}

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  phone_number: string;
  is_connected: boolean;
  last_connected_at: string | null;
}