import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai"

export async function POST(request: NextRequest){

  const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
  })

  const params = await request.json();
  const messages = params.messages;
  const use_tools = params.use_tools;

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
  
  const standardMessages = [{
  role:"system", content:"You are a helpful assistant."
  }]

  const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo-1106", // TODO: change model to gpt-3.5-turbo-1106, (for low-cost dev: keep gpt-3.5-turbo)
  messages: [...standardMessages, ...messages],
  temperature: 1.0,
  max_tokens: 256,
  tools: tools, // TODO: think about wether to inform about tools in forward_reasoning
  tool_choice: use_tools? "auto" : "none",
  })
  return NextResponse.json(response)
}
