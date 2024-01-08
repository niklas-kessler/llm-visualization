import json
import os
import openai
import requests
from tenacity import retry, wait_random_exponential, stop_after_attempt
from termcolor import colored

GPT_MODEL = "gpt-3.5-turbo-1106"
openai.api_key = os.environ['OPENAI_API_KEY']

@retry(wait=wait_random_exponential(multiplier=1, max=40), stop=stop_after_attempt(3))
def chat_completion_request(messages, tools=None, tool_choice=None, model=GPT_MODEL):
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + openai.api_key,
    }
    json_data = {"model": model, "messages": messages}
    if tools is not None:
        json_data.update({"tools": tools})
    if tool_choice is not None:
        json_data.update({"tool_choice": tool_choice})
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=json_data,
        )
        return response
    except Exception as e:
        print("Unable to generate ChatCompletion response")
        print(f"Exception: {e}")
        return e

def pretty_print_conversation(messages):
    role_to_color = {
        "system": "red",
        "user": "green",
        "assistant": "blue",
        "tool": "magenta",
    }
    
    for message in messages:
        if message["role"] == "system":
            print(colored(f"system: {message['content']}\n", role_to_color[message["role"]]))
        elif message["role"] == "user":
            print(colored(f"user: {message['content']}\n", role_to_color[message["role"]]))
        elif message["role"] == "assistant" and message.get("function_call"):
            print(colored(f"assistant: {message['function_call']}\n", role_to_color[message["role"]]))
        elif message["role"] == "assistant" and not message.get("function_call"):
            print(colored(f"assistant: {message['content']}\n", role_to_color[message["role"]]))
        elif message["role"] == "tool":
            print(colored(f"function ({message['name']}): {message['content']}\n", role_to_color[message["role"]]))

class Backend:
    def __init__(self):
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_item_price",
                    "description": "Get the price to a purchasable item, e.g. merchandise.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "item_id": {
                                "type": "string",
                                "description": "The id of the purchasable item",
                            },
                        },
                        "required": ["item_id"],
                    },
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_available_merch_products",
                    "description": "Get availabilty and item_ids about merch products of a certain person.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "The name of the person, e.g. Bruno Mars",
                            },
                        },
                        "required": ["name"],
                    },
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_info_about_person",
                    "description": "Get information to a certain person, about what their job, private life and what they are famous for.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "The name of the person, e.g. Bruno Mars",
                            },
                        },
                        "required": ["name"]
                    },
                }
            },
        ]

    def request(self, user_input: str, messages=[]):
        user_message = user_input
        messages.append({"role": "user", "content": user_message})

        # Initial answer
        chat_response = chat_completion_request(messages, tools=self.tools, tool_choice="none")
        assistant_message = chat_response.json()["choices"][0]["message"]
        if assistant_message['content']:
            messages.append(assistant_message)
        print(assistant_message)

        # First self-reflection, tool-calls
        messages.append({"role": "system", "content": "Reflect about your initial answer. Try to call tools that could give more accurate information and could possibly be helpful later on for improving your answer (reasoning chain, creativity, ...)."})
        chat_response = chat_completion_request(messages, tools=self.tools)
        assistant_message = chat_response.json()["choices"][0]["message"]

        # Reflection-loop
        while 'tool_calls' in assistant_message:
            if assistant_message['content']:
                messages.append(assistant_message)
            messages.append({"role": "assistant", "content": "Tool-call: " + ", ".join([(call['function']['name'] + "(" + call['function']['arguments'] + ")") for call in assistant_message['tool_calls']])})
            print(assistant_message)
            
            # Simulate tool-results
            tool_results = input()
            messages.append({"role": "system", "content": "The following are the results of your tool-calls, if there have been any."})
            messages.append({"role": "system", "content": tool_results})

            # Reflect
            messages.append({"role": "system", "content": "Reflect about your answer, using the results of the tools that you called. Can you improve anything by comparing your initial answer with the tool-results? Reformulate your answer if so."})
            chat_response = chat_completion_request(messages, tools=self.tools, tool_choice="none")
            assistant_message = chat_response.json()["choices"][0]["message"]
            if assistant_message['content']:
                messages.append(assistant_message)
            print(assistant_message)

            # Use further tools or formulate final answer
            messages.append({"role": "system", "content": "Reflect the reformulated answer. Is there still something, that is uncomplete, inaccurate, incorrect or something you're not completely sure about? If so, try to use further tools to get accurate information. If you are sure, that further tool-calls will not improve your answer, state that you are done and give your final answer announced by the title 'FINAL ANSWER:\n'. Else try using further tools."})
            chat_response = chat_completion_request(messages, tools=self.tools)
            assistant_message = chat_response.json()["choices"][0]["message"]

        # Final answer
        messages.append(assistant_message)
        pretty_print_conversation(messages=messages)
        
        return(messages)


back = Backend()
back.request("I want to buy a gift for a friend. He likes Thomas Gottschalk.")


# User request

# Initial answer (no tool)

# Could you improve using tools?
#   This are the tool-results
#   Compare with answer and update

# Final answer



# mmlu - benchmark
# graph selber benutzen zu finetunen, ranking rlhf
# graph patterns: model, aufgabentyp
# step by step mit operanden input forward parallel-split aggregate refine backtrack(failed, take step back) attention(?)