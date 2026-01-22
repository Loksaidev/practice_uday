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
    const { playerId, roomId, round } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if player already has a selection for this round
    const { data: existingSelection } = await supabase
      .from("player_selections")
      .select("id")
      .eq("player_id", playerId)
      .eq("room_id", roomId)
      .eq("round", round)
      .maybeSingle();

    if (existingSelection) {
      console.log("AI player already has a selection for this round");
      return new Response(
        JSON.stringify({ success: true, message: "Selection already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get game room and organization settings
    const { data: roomData } = await supabase
      .from("game_rooms")
      .select("organization_id, organizations(use_knowsy_topics)")
      .eq("id", roomId)
      .single();

    let allTopics: any[] = [];

    // Load Knowsy topics if enabled or no organization
    if (!roomData?.organization_id || (roomData.organizations as any)?.use_knowsy_topics) {
      const { data: knowsyTopics, error: knowsyError } = await supabase
        .from("topics")
        .select("*");

      if (!knowsyError && knowsyTopics) {
        allTopics = [...knowsyTopics];
      }
    }

    // Load custom topics if organization exists
    if (roomData?.organization_id) {
      const { data: customTopics, error: customError } = await supabase
        .from("custom_topics")
        .select("*")
        .eq("organization_id", roomData.organization_id);

      if (!customError && customTopics) {
        allTopics = [...allTopics, ...customTopics.map(t => ({ ...t, isCustom: true }))];
      }
    }

    if (allTopics.length === 0) {
      throw new Error("No topics available");
    }

    // Randomly select a topic
    const selectedTopic = allTopics[Math.floor(Math.random() * allTopics.length)];

    // Get all items for this topic
    let items: any[] = [];
    
    if (selectedTopic.isCustom) {
      const { data: customItems, error: itemsError } = await supabase
        .from("custom_topic_items")
        .select("*")
        .eq("custom_topic_id", selectedTopic.id);

      if (itemsError) throw itemsError;
      items = customItems || [];
    } else {
      const { data: knowsyItems, error: itemsError } = await supabase
        .from("topic_items")
        .select("*")
        .eq("topic_id", selectedTopic.id);

      if (itemsError) throw itemsError;
      items = knowsyItems || [];
    }

    // Randomly select 5 items and shuffle them
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, 5);

    // Create ordered items array with the new format
    const orderedItems = selectedItems.map((item) => ({
      id: item.id,
      name: item.name,
      image_url: item.image_url || null,
      isCustom: selectedTopic.isCustom || false
    }));

    // Insert the selection
    const { error: insertError } = await supabase
      .from("player_selections")
      .insert({
        player_id: playerId,
        room_id: roomId,
        round: round,
        topic_id: selectedTopic.id,
        ordered_items: orderedItems
      });

    // Handle duplicate key error (race condition - another instance already inserted)
    if (insertError) {
      if (insertError.code === '23505') {
        console.log("Selection was created by another instance (race condition)");
        return new Response(
          JSON.stringify({ success: true, message: "Selection created by another instance" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-player-topic-selection:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
