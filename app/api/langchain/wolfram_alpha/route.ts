import { NextRequest, NextResponse } from "next/server";
import { WolframAlphaTool } from "@langchain/community/tools/wolframalpha";

export async function POST(request: NextRequest){
    
    const params = await request.json();
    const query: string = JSON.parse(params.args).input;

    const tool = new WolframAlphaTool({
      appid: process.env.WOLFRAM_ALPHA_APPID || ""
    });
      
    const result = await tool.call(query);
    return NextResponse.json({result: result});
}

