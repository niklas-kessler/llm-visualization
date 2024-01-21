import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"

export async function POST(request: NextRequest){

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const params = await request.json();
  const messages = params.messages;
  const standardMessages = [{
    role:"system", content:"You are a helpful assistant."
  }]

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // TODO: change model to gpt-3.5-turbo-1106, (for low-cost dev: keep gpt-3.5-turbo)
    messages: [...standardMessages, ...messages],
    temperature: 0,
    max_tokens: 128,
    //tools: tools,
    //tool_choice: "auto",
  })
  return NextResponse.json(response)
}

/**try-catch-block:
 * ================
  messages: any = [],
  tools?: any,
  tool_choice?: string,
  model: string = 'gpt-3.5-turbo-1106' 
export async function POST(
  req: Request, res: Response
): Promise<any> {
  const { messages } = await req.json()
  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages, 
      tools: tools,
      tool_choice: "auto",
    });

    return Response.json({ res: messages });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}*/