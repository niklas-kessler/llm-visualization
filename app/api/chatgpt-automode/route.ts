import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"
import { operations } from "@/app/utils/tools";

export async function POST(request: NextRequest){
  /** This function can be used to send requests to the LLM and let it generate an answer, either with or without tool-use. */
  const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
  })

  const params = await request.json();
  const messages = params.messages;
  const nodes = params.nodes;

  const standardMessages = [{
  role:"system", content:"You are a helpful assistant."
  }]
  const errorMessage = [{role:"system", content:"Only leaf nodes can be used. Try again."}]

  let response: any = {};
  let false_node = false;
  let tries = 0;

  // Try to generate a valid response without calls to hallucinated tools (max 3 tries)
  do {
    tries++;
    if(tries > 3){
      return NextResponse.json({error: "Could not generate a valid response."})
    }
    //console.log("ChatGPT Attempt number: ", tries);

    //generate response / tool calls
    response = await openai.chat.completions.create({
      model: "gpt-4-turbo-2024-04-09",
      messages: [...standardMessages, ...messages, ...(false_node? errorMessage : [])],
      temperature: 0.8,
      max_tokens: 256,
      tools: operations,
      tool_choice: "auto"
    })    

    // Check if the generated response contains a tool call that is not in the list of existing tools    
    false_node = false;
    let node_for_operation = null;
    
    try {
      node_for_operation = await JSON.parse(response.choices[0].message.tool_calls[0].function.arguments)
      if (!nodes[node_for_operation].leaf()){
        false_node = true;
      }
    } catch (error) {
      console.log("Error: no node for operation");
    }
  } while (false_node);
  
  //console.log(response.usage.total_tokens);
  //console.log(response.choices[0].message)
  console.log(messages)

  return NextResponse.json(response)
}
