import { NextRequest, NextResponse } from "next/server";
import { BraveSearch } from "@langchain/community/tools/brave_search";

export async function POST(request: NextRequest){
    
    const params = await request.json();
    const query: string = JSON.parse(params.args).input;

    const tool = new BraveSearch({
      apiKey: process.env.BRAVE_SEARCH_API_KEY || ""
    });

    const result = await tool.call(query);
  
    console.log(tool.name, tool.description);
    return NextResponse.json({result: result});
}

