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
    console.log("Starting check-upcoming-charges cron job");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date and date 3 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + 3);
    reminderDate.setHours(23, 59, 59, 999);

    console.log("Checking charges between:", today.toISOString(), "and", reminderDate.toISOString());

    // Find pending charges with due dates in the next 3 days
    const { data: charges, error: chargesError } = await supabase
      .from('charges')
      .select(`
        id,
        user_id,
        client_id,
        product_id,
        amount,
        due_date,
        status,
        clients (
          id,
          name,
          phone
        ),
        products (
          id,
          name
        )
      `)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', reminderDate.toISOString().split('T')[0]);

    if (chargesError) {
      console.error("Error fetching charges:", chargesError);
      throw chargesError;
    }

    console.log(`Found ${charges?.length || 0} charges to process`);

    if (!charges || charges.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma cobrança pendente encontrada',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send reminders for each charge
    const results = [];
    for (const charge of charges) {
      try {
        // Check if reminder was already sent today
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('client_id', charge.id)
          .gte('sent_at', today.toISOString())
          .maybeSingle();

        if (existingMessages) {
          console.log(`Reminder already sent today for charge ${charge.id}`);
          continue;
        }

        // Send reminder through the send-whatsapp-reminder function
        const reminderPayload = {
          chargeId: charge.id,
          clientPhone: charge.clients?.phone,
          clientName: charge.clients?.name,
          productName: charge.products?.name,
          amount: charge.amount,
          dueDate: charge.due_date,
          userId: charge.user_id
        };

        console.log("Calling send-whatsapp-reminder with:", reminderPayload);

        const reminderResponse = await supabase.functions.invoke('send-whatsapp-reminder', {
          body: reminderPayload
        });

        if (reminderResponse.error) {
          console.error(`Error sending reminder for charge ${charge.id}:`, reminderResponse.error);
          results.push({ 
            chargeId: charge.id, 
            success: false, 
            error: reminderResponse.error 
          });
        } else {
          console.log(`Reminder sent successfully for charge ${charge.id}`);
          results.push({ 
            chargeId: charge.id, 
            success: true 
          });
        }

      } catch (error) {
        console.error(`Error processing charge ${charge.id}:`, error);
        results.push({ 
          chargeId: charge.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Processed ${results.length} charges, ${successCount} successful`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processadas ${results.length} cobranças`,
        processed: results.length,
        successful: successCount,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in check-upcoming-charges:", error);
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
