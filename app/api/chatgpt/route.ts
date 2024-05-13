import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"
import { langchain_tools, computed_tools, simulated_tools, operations } from "@/app/utils/tools";

export async function POST(request: NextRequest){
  /** This function can be used to send requests to the LLM and let it generate an answer, either with or without tool-use. */
  const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
  })

  const params = await request.json();
  const messages = params.messages;
  const use_tools = params.use_tools ?? false;

  const standardMessages = [{
  role:"system", content:"You are a helpful assistant."
  }]
  const errorMessage = [{role:"system", content:"You just generated a hallucinated tool call. Only existing tools can be used. Try again."}]
  const all_tools = langchain_tools.concat(simulated_tools).concat(computed_tools)

  let response: any = {};
  let hallucinated_error = false;
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
      model: "gpt-3.5-turbo-1106",
      messages: [...standardMessages, ...messages, ...(hallucinated_error? errorMessage : [])],
      temperature: 0.8,
      max_tokens: 512,
      tools: all_tools,
      tool_choice: (use_tools)? "auto" : "none",
    })    

    // Check if the generated response contains a tool call that is not in the list of existing tools    
    hallucinated_error = false;

    for (const tool_call of response.choices[0].message.tool_calls ?? []){

      if (use_tools && !all_tools.map(obj => obj.function.name).includes(tool_call.function.name)){
      
            hallucinated_error = true;
            console.log("Error: hallucinated the tool", tool_call.function.name);  
      
          } 
    }
  } while (hallucinated_error);
  
  //console.log(response.usage.total_tokens);
  //console.log(response.choices[0].message)
  //try{console.log(response.choices[0].message.tool_calls[0]?.function ?? "");}catch{}

  console.log(messages)
  return NextResponse.json(response)
}
