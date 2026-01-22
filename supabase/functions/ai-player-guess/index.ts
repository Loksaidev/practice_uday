import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerId, roomId, round, vipPlayerId } = await req.json();

    // Safety check: VIP should never guess their own order
    if (playerId === vipPlayerId) {
      console.log('Prevented VIP from guessing their own order');
      return new Response(
        JSON.stringify({ success: true, score: 0, message: "VIP cannot guess their own order" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get VIP's actual order (only query we need to read)
    const { data: vipSelection, error: vipError } = await supabase
      .from("player_selections")
      .select("ordered_items")
      .eq("player_id", vipPlayerId)
      .eq("room_id", roomId)
      .eq("round", round)
      .single();

    if (vipError || !vipSelection) {
      throw new Error("VIP selection not found");
    }

    // Extract IDs from ordered_items (could be objects or strings)
    const orderedItems = vipSelection.ordered_items as any[];
    const vipOrder = orderedItems.map(item => typeof item === 'string' ? item : item.id);

    // Randomly shuffle to create AI's guess
    const aiGuess = [...vipOrder].sort(() => Math.random() - 0.5);

    // Calculate score based on new scoring mechanism
    let score = 0;
    let correctCount = 0;
    
    for (let i = 0; i < 5; i++) {
      if (vipOrder[i] === aiGuess[i]) {
        correctCount++;
        if (i === 0) {
          score += 2; // Favorite (1st position)
        } else if (i === 4) {
          score += 2; // Least favorite (5th position)
        } else {
          score += 1; // 2nd, 3rd, 4th positions
        }
      }
    }
    
    // Bonus for all correct
    if (correctCount === 5) {
      score += 3;
    }
    
    // Penalty for none correct
    if (correctCount === 0) {
      score -= 1;
    }

    // Check if guess already exists
    const { data: existingGuess } = await supabase
      .from("player_guesses")
      .select("id")
      .eq("player_id", playerId)
      .eq("room_id", roomId)
      .eq("round", round)
      .eq("vip_player_id", vipPlayerId)
      .maybeSingle();

    // If guess already exists, don't add score again
    if (existingGuess) {
      console.log('AI player already submitted guess for this round');
      return new Response(
        JSON.stringify({ success: true, score: 0, message: "Guess already submitted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new guess
    const { error: insertError } = await supabase.from("player_guesses").insert({
      player_id: playerId,
      room_id: roomId,
      round: round,
      vip_player_id: vipPlayerId,
      guessed_order: aiGuess,
      score: score
    });

    if (insertError) throw insertError;

    // Get and update player score
    const { data: playerData } = await supabase
      .from("players")
      .select("score")
      .eq("id", playerId)
      .single();

    if (playerData) {
      await supabase
        .from("players")
        .update({ score: playerData.score + score })
        .eq("id", playerId);
    }

    console.log(`AI player guess submitted with score: ${score}`);

    return new Response(
      JSON.stringify({ success: true, score }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-player-guess:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
