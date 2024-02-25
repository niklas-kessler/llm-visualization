import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest){
    /** This function can be used to simulate a tool. */
    const params = await request.json();
    const tool = params.tool;
    const tool_args = params.tool_args;

    const input = require("prompt-sync")({ sigint: true });
    const tool_answer = input(`${tool}(${tool_args})`);

    return NextResponse.json({result: tool_answer});
}