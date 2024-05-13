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
          description: "Get search results from the BraveSearch search-engine. Only returns headers and snippets. Useful for finding relevant websites that contain helpful information.",
          parameters: {
            type: "object",
            properties: {
              input: {
                type: "string",
                description: "The search query you want to use.",
              },
            },
            required: ["input"],
          },
        }
      },
]
const computed_tools: any[] = [
  {
      type: "function",
      function: {
      name: "website_crawler",
      description: "Get the content of a website in text form. Useful for extracting further information from websites, when e.g. the snippet from a search engine is not enough.",
      parameters: {
          type: "object",
          properties: {
          url: {
              type: "string",
              description: "The url of the website you want to get the content of.",
          },
          },
          required: ["url"],
      },
      }
  } 
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
          node: {
            type: "integer",
            description: "The node to perform the forward operation on.",
          },
        },
        required: ["node"],
    },
    }
},
{
    type: "function",
    function: {
    name: "tools",
    description: "Use this operation, when the LLM wants to or should use an external tool, i.e. generate function calls to a set of related tools.",
    parameters: {
        type: "object",
        properties: {
          node: {
            type: "integer",
            description: "The node to perform the tools operation on.",
          },
        },
        required: ["node"],
    },
    }
},
{
    type: "function",
    function: {
    name: "parallelsplit",  //"parallel_split" doesn't work, since then it only generates the first word ("parallel" instead of "parallel_split")
    description: "This operation lets the LLM generate multiple seperate answers, each following a different approach. It is useful for concurrently trying different strategies, and later aggregating their results.",
    parameters: {
        type: "object",
        properties: {
          node: {
            type: "integer",
            description: "The node to perform the aggregate operation on.",
          },
          approaches: {
            type: "array",
            items: {
              type: "string"
            },
            description: "The different approaches to follow. Each approach should be a string.",
          },
        },
        required: ["node","approaches"],
    },
    }
},
{
    type: "function",
    function: {
    name: "aggregate",
    description: "After you created multiple reasoning paths with the split node, you can use this operation to aggregate the results of the individual branches. Call this operation only on the leaf nodes of the branches, not the split node itself. Only call this, when each of the paths itself is fully examined and has noticable results.",
    parameters: {
        type: "object",
        properties: {
          node: {
            type: "integer",
            description: "The node to perform the aggregate operation on. This is not the split node itself. Instead only call this on one of the leaf nodes of the different reasoning paths.",
          },
        },
        required: ["node"],
    },
    }
},
{
    type: "function",
    function: {
    name: "refine",
    description: "If you are doubtful about any reasoning step and suspect errors to have happened, call this operation to let the LLM reflect about its previous answer and correct it, if it contains mistakes.",
    parameters: {
        type: "object",
        properties: {
          node: {
            type: "integer",
            description: "The node to perform the refine operation on.",
          },
        },
        required: ["node"],
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
          node: {
            type: "integer",
            description: "The node to perform the attention operation on.",
          },
        },
        required: ["node"],
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
          node: {
            type: "integer",
            description: "The node to perform the delete operation on.",
          },
        },
        required: ["node"],
    },
    }
},
{
  type: "function",
  function: {
  name: "final",
  description: "Do you think the LLM is done and don't you have any doubts or does it have no chance of solving the task? Call this operation only then, to finalize the reasoning process and let it generate a final answer.",
  parameters: {
      type: "object",
      properties: {
        node: {
          type: "integer",
          description: "The node to perform the final operation on.",
        },
      },
      required: ["node"],
  },
  }
},
]

export {langchain_tools, computed_tools, simulated_tools, operations}