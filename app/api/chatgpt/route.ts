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
  const use_tools = params.use_tools;
  const auto_mode = params.auto_mode ?? false;

  const standardMessages = [{
  role:"system", content:"You are a helpful assistant."
  }]

  const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo-1106",
  messages: [...standardMessages, ...messages],
  temperature: 1.0,
  max_tokens: 256,
  tools: auto_mode? operations : (langchain_tools.concat(simulated_tools).concat(computed_tools)),
  tool_choice: (use_tools || auto_mode)? "auto" : "none",
  })
  return NextResponse.json(response)
}
