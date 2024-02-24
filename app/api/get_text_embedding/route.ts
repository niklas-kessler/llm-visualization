import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"

export async function POST(request: NextRequest){
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })
    
    const params = await request.json();
    const str = params.str;    
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: str,
        encoding_format: "float",
        dimensions: 256
    });
    return NextResponse.json(embedding);
}