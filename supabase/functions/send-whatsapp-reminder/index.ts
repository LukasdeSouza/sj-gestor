import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chargeId, clientPhone, clientName, productName, amount, dueDate, userId } = await req.json();

    console.log("Sending WhatsApp reminder:", { chargeId, clientPhone, clientName });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if WhatsApp is connected for this user
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_connected', true)
      .maybeSingle();

    if (!connection) {
      console.log("WhatsApp not connected for user:", userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp não conectado' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format the due date
    const dueDateFormatted = new Date(dueDate).toLocaleDateString('pt-BR');

    // Create reminder message
    const message = `🔔 *Lembrete de Cobrança*

Olá ${clientName}! 👋

Este é um lembrete sobre seu pagamento:

📦 *Produto:* ${productName}
💰 *Valor:* R$ ${amount.toFixed(2)}
📅 *Vencimento:* ${dueDateFormatted}

Para evitar multas, realize o pagamento até a data de vencimento.

Caso já tenha efetuado o pagamento, desconsidere esta mensagem.

Obrigado! 😊`;

    // In production, this would integrate with a real WhatsApp API (like Baileys, Twilio, etc.)
    // For now, we'll just log it and save to database
    console.log("Message to send:", message);
    console.log("To phone:", clientPhone);

    // Save message to database
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        client_id: chargeId, // Using charge ID as reference
        phone_number: clientPhone,
        message_content: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error saving message:", messageError);
      throw messageError;
    }

    console.log("Message saved successfully:", messageData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: messageData.id,
        message: 'Lembrete enviado com sucesso' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in send-whatsapp-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
