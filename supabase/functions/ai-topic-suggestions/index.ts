import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, topicName, existingCategories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let tools: any[] = [];
    let toolChoice: any = undefined;

    if (type === "topics") {
      systemPrompt = `You are an expert at brainstorming engaging game topics. Generate creative, fun, and diverse topics that would work well for a social guessing game where players rank their preferences.

Available categories: ${existingCategories.join(", ")}

Consider topics that:
- Are universally relatable or interesting
- Have enough variety for 5+ rankable items
- Work well for social settings
- Are appropriate for all audiences
- Cover different aspects of life and interests`;

      tools = [{
        type: "function",
        function: {
          name: "suggest_topics",
          description: "Suggest 5-8 game topics based on the user's prompt",
          parameters: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { 
                      type: "string",
                      description: "The topic name, should be engaging and clear"
                    },
                    category: { 
                      type: "string",
                      description: `Must be one of: ${existingCategories.join(", ")}`
                    },
                    reasoning: {
                      type: "string",
                      description: "Brief explanation of why this topic would be fun"
                    }
                  },
                  required: ["name", "category", "reasoning"],
                  additionalProperties: false
                }
              }
            },
            required: ["topics"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "suggest_topics" } };
    } else if (type === "items") {
      systemPrompt = `You are an expert at generating diverse, interesting items for ranking games. Generate 8-12 items for the topic "${topicName}" that players would enjoy ranking.

The items should:
- Be specific and concrete (not generic)
- Cover a good range of options
- Be recognizable to most people
- Include both popular and unique choices
- Be appropriate for all audiences
- Be suitable for ranking by preference`;

      tools = [{
        type: "function",
        function: {
          name: "suggest_items",
          description: `Suggest 8-12 rankable items for the topic: ${topicName}`,
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { 
                      type: "string",
                      description: "The item name, should be clear and specific"
                    },
                    reasoning: {
                      type: "string",
                      description: "Brief note on why this item fits the topic"
                    }
                  },
                  required: ["name", "reasoning"],
                  additionalProperties: false
                }
              }
            },
            required: ["items"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "suggest_items" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        tools,
        tool_choice: toolChoice
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract tool call results
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-topic-suggestions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
