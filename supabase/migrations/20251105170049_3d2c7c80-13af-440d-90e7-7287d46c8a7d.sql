-- Create messages log table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own messages"
  ON public.messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_client_id ON public.messages(client_id);
CREATE INDEX idx_messages_status ON public.messages(status);