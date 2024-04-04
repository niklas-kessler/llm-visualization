import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import cheerio from "cheerio";

async function getTextFromWebsite(url: string): Promise<string> {
    try {
        // Fetch HTML content from the website
        const response = await axios.get(url);
        const html = response.data;

        // Load HTML content into Cheerio
        const $ = cheerio.load(html);

        // Extract text
        const text = $('body').text(); // Change 'body' to target specific elements

        return text;
    } catch (error) {
        console.error('Error fetching data:', error);
        return '';
    }
}

export async function POST(request: NextRequest){
    // get website source with requests library and then get the main content with free language model from hugging face
    const params = await request.json();
    const url = JSON.parse(params.args).url;
    
    try {
        const text = await getTextFromWebsite(url);
        return NextResponse.json({result: text});
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({result: ''});
    }
}

/*
    // Different approach using fetch and a LLM

    const html_response = await fetch(url);
    const html = await html_response.text();
    
    const result = html.replace(/<[^>]+>/g, '');
    
    const summarize_prompt = "Get the content of the following website: "
    const llm_response = await fetch(
		"https://api-inference.huggingface.co/models/microsoft/phi-1_5",
		{
			headers: { Authorization: ("Bearer " + process.env.HUGGINGFACE_API_KEY) },
			method: "POST",
			body: JSON.stringify("Hello please give me recipies for a nice chicken curry."),
		}
	);
	const result = await llm_response.json();*/