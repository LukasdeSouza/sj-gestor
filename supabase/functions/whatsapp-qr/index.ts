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

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  console.log("WebSocket connection request received");

  const { socket, response } = Deno.upgradeWebSocket(req);

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;
  let currentPhoneNumber: string | null = null;

  socket.onopen = () => {
    console.log("WebSocket connection opened");
    socket.send(JSON.stringify({ 
      type: 'connected',
      message: 'WebSocket connection established' 
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received message:", data);

      if (data.type === 'init') {
        userId = data.userId;
        currentPhoneNumber = data.phoneNumber || null;
        console.log("User ID received:", userId, "Phone:", currentPhoneNumber);

        // Ensure a connection row exists with provided phone (not connected yet)
        if (userId && currentPhoneNumber) {
          const { error: upsertError } = await supabase
            .from('whatsapp_connections')
            .upsert({
              user_id: userId,
              phone_number: currentPhoneNumber,
              is_connected: false,
              last_connected_at: null
            }, { onConflict: 'user_id' });

          if (upsertError) {
            console.error("Error upserting connection on init:", upsertError);
          }
        }

        // Simulate QR Code generation (In production, this would use Baileys)
        const qrCode = await generateMockQRCode();
        
        socket.send(JSON.stringify({
          type: 'qr',
          qr: qrCode
        }));

        // Simulate connection after 5 seconds (for demo purposes)
        setTimeout(async () => {
          const phoneNumberToUse = currentPhoneNumber || ("+55" + Math.floor(Math.random() * 10000000000));
          
          // Update database with connection info
          if (userId) {
            const { error } = await supabase
              .from('whatsapp_connections')
              .update({
                is_connected: true,
                last_connected_at: new Date().toISOString()
              })
              .eq('user_id', userId);

            if (error) {
              console.error("Error updating connection:", error);
            } else {
              console.log("Connection updated successfully");
            }
          }

          socket.send(JSON.stringify({
            type: 'connected',
            phoneNumber: phoneNumberToUse,
            message: 'WhatsApp conectado com sucesso!'
          }));
        }, 5000);

      } else if (data.type === 'disconnect') {
        if (userId) {
          const { error } = await supabase
            .from('whatsapp_connections')
            .update({
              is_connected: false
            })
            .eq('user_id', userId);

          if (error) {
            console.error("Error disconnecting:", error);
          }
        }

        socket.send(JSON.stringify({
          type: 'disconnected',
          message: 'WhatsApp desconectado'
        }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      socket.send(JSON.stringify({
        type: 'error',
        message: errorMessage
      }));
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };

  return response;
});

// Generate a mock QR code as SVG
async function generateMockQRCode(): Promise<string> {
  // In production, this would use Baileys to generate real WhatsApp QR codes
  // For now, we return a mock QR code data URL
  const qrData = `whatsapp-connection-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Simple QR-like pattern as SVG
  const size = 256;
  const cellSize = 8;
  const cells = size / cellSize;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Generate random pattern
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if (Math.random() > 0.5) {
        svg += `<rect x="${i * cellSize}" y="${j * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  
  // Convert SVG to base64 data URL
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
}
