import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"

export async function POST(request: NextRequest){

  const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
  })

  const params = await request.json();
  const messages = params.messages;
  const use_tools = params.use_tools;

  const tools = [
    {
      type: "function",
      function: {
        name: "get_item_price",
        description: "Get the price to a purchasable item, e.g. merchandise.",
        parameters: {
          type: "object",
          properties: {
            item_id: {
              type: "string",
              description: "The id of the purchasable item",
            },
          },
          required: ["item_id"],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "get_available_merch_products",
        description: "Get availabilty and item_ids about merch products of a certain person.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the person, e.g. Bruno Mars",
            },
          },
          required: ["name"],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "get_info_about_person",
        description: "Get information to a certain person, about what their job, private life and what they are famous for.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the person, e.g. Bruno Mars",
            },
          },
          required: ["name"]
        },
      }
    },
  ]
  
  const standardMessages = [{
  role:"system", content:"You are a helpful assistant."
  }]

  const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo-1106", // TODO: change model to gpt-3.5-turbo-1106, (for low-cost dev: keep gpt-3.5-turbo)
  messages: [...standardMessages, ...messages],
  temperature: 1.0,
  max_tokens: 256,
  tools: tools, // TODO: think about wether to inform about tools in forward_reasoning
  tool_choice: use_tools? "auto" : "none",
  })
  return NextResponse.json(response)
}
