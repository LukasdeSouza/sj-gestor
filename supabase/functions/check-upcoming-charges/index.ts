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

    // Get all users with reminder settings enabled
    const { data: usersWithSettings, error: settingsError } = await supabase
      .from('reminder_settings')
      .select('user_id, days_before_due')
      .eq('enabled', true);

    if (settingsError) {
      console.error("Error fetching reminder settings:", settingsError);
      throw settingsError;
    }

    if (!usersWithSettings || usersWithSettings.length === 0) {
      console.log("No users with reminder settings enabled");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum usuário com lembretes habilitados',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${usersWithSettings.length} users with reminders enabled`);

    const allResults = [];

    // Process each user with their own settings
    for (const userSettings of usersWithSettings) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reminderDate = new Date(today);
      reminderDate.setDate(reminderDate.getDate() + userSettings.days_before_due);
      reminderDate.setHours(23, 59, 59, 999);

      console.log(`Checking charges for user ${userSettings.user_id} between:`, today.toISOString(), "and", reminderDate.toISOString());

      // Find pending charges for this user
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
        .eq('user_id', userSettings.user_id)
        .eq('status', 'pending')
        .gte('due_date', today.toISOString().split('T')[0])
        .lte('due_date', reminderDate.toISOString().split('T')[0]);

      if (chargesError) {
        console.error("Error fetching charges for user:", userSettings.user_id, chargesError);
        continue;
      }

      console.log(`Found ${charges?.length || 0} charges for user ${userSettings.user_id}`);

      if (!charges || charges.length === 0) {
        continue;
      }

      // Send reminders for each charge
      for (const charge of charges) {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
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
            allResults.push({ 
              chargeId: charge.id, 
              success: false, 
              error: reminderResponse.error 
            });
          } else {
            console.log(`Reminder sent successfully for charge ${charge.id}`);
            allResults.push({ 
              chargeId: charge.id, 
              success: true 
            });
          }

        } catch (error) {
          console.error(`Error processing charge ${charge.id}:`, error);
          allResults.push({ 
            chargeId: charge.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    }

    const successCount = allResults.filter(r => r.success).length;
    console.log(`Processed ${allResults.length} charges total, ${successCount} successful`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processadas ${allResults.length} cobranças`,
        processed: allResults.length,
        successful: successCount,
        results: allResults
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
