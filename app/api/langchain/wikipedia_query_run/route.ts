import { NextRequest, NextResponse } from "next/server";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";

export async function POST(request: NextRequest){
    
    const params = await request.json();
    const query: string = JSON.parse(params.args).query;

    const tool = new WikipediaQueryRun({
        topKResults: 3,
        maxDocContentLength: 2000,
      });
      
    const result = await tool.call(query);
    
    return NextResponse.json({result: result});
}

