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
        name: "get_cpu_usage",
        description: "Get the current overall CPU usage in percentage.",
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
        name: "get_thread_cpu_usage",
        description: "Get the CPU usage of a specific thread in percentage.",
        parameters: {
          type: "object",
          properties: {
            thread_id: {
              type: "string",
              description: "The id of the thread to get the CPU usage for.",
            },
          },
          required: ["thread_id"],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "get_threads",
        description: "Get all currently running threads. Returns a list of the threads with their respective ids.",
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
        name: "get_disk_space",
        description: "Get the available disk space of the system. Returns the amount of free disk space.",
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
        name: "get_network_latency",
        description: "Get the current network latency in either seconds or milliseconds.",
        parameters: {
          type: "object",
          properties: {
            unit: {
              type: "string",
              description: "Either 'seconds' or 'milliseconds'.",
            },
          },
          required: ["unit"],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "get_service_status",
        description: "Get the status of a specific service. Returns either 'running' or 'stopped'.",
        parameters: {
          type: "object",
          properties: {
            service_id: {
              type: "string",
              description: "The id of the service to get the status for.",
            },
          },
          required: ["service_id"],
        },
      }
    },
    {
      type: "function",
      function: {
        name: "get_service_id",
        description: "Find a service by its name and return the id.",
        parameters: {
          type: "object",
          properties: {
            service: {
              type: "string",
              description: "The name of the service to get the id for.",
            },
          },
          required: ["service"],
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
        name: "parallelsplit",  //actually "parallel_split", but doesn't then it only generates the first word ("parallel" instead of "parallel_split")
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
