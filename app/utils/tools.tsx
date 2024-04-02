const langchain_tools: any[] = [
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
    },
    {
        type: "function",
        function: {
          name: "brave_search",
          description: "Get search results from the BraveSearch search-engine. useful for when you need to answer questions about current events. Input should be a search query.",
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
      },
]
const simulated_tools: any[] = [
{
    type: "function",
    function: {
    name: "information_by_human",
    description: "Get some hints entered by the user.",
    parameters: {
        type: "object",
        properties: {
        question: {
            type: "string",
            description: "Any question that you might have.",
        },
        },
        required: ["question"],
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

export { langchain_tools, simulated_tools, operations}