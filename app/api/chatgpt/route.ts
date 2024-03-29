import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"

export async function POST(request: NextRequest){
  /** This function can be used to send requests to the LLM and let it generate an answer, either with or without tool-use. */
  const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
  })

  const params = await request.json();
  const messages = params.messages;
  const use_tools = params.use_tools;
  const auto_mode = params.auto_mode ?? false;

  const tools = [
    {
      type: "function",
      function: {
        name: "wikipedia_query_run",
        description: "Look things up in wikipedia.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The topic to search for and read about.",
            },
          },
          required: ["query"],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "wolfram_alpha",
        description: "A wrapper around Wolfram Alpha. Useful for when you need to answer questions about Math, Science, Technology, Culture, Society and Everyday Life. Input should be a search query.",
        parameters: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "The question you need to have answered.",
            },
          },
          required: ["input"],
        },
      }
    }
  ]
  const operations = [
    {
      type: "function",
      function: {
        name: "forward",
        description: "This operation lets the LLM generate an answer without using any tools.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "tools",
        description: "This operation lets the LLM generate function calls to a set of related tools.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "split",  //actually "parallel_split", but doesn't then it only generates the first word ("parallel" instead of "parallel_split")
        description: "This operation lets the LLM generate 3 distinct answers. It is useful for concurrently trying different strategies.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "aggregate",
        description: "This operation lets the LLM summarize the results of the different reasoning branches created by the reasoning_split operation.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "refine",
        description: "This operation prompts the LLM to reflect about its previous answer and correct it, if it contains mistakes.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "attention",
        description: "This operation asks the LLM to reflect, which messages and facts were important so far. It helps to not loose focus in the reasoning process.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "backward",
        description: "This operation deletes the previous operation.",
        parameters: {
          type: "object",
          properties: {
          },
          required: [],
        },
      }
    },
  ]

  const standardMessages = [{
  role:"system", content:"You are a helpful assistant."
  }]

  const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo-1106",
  messages: [...standardMessages, ...messages],
  temperature: 1.0,
  max_tokens: 256,
  tools: auto_mode? operations : tools,
  tool_choice: (use_tools || auto_mode)? "auto" : "none",
  })
  return NextResponse.json(response)
}
