"use client"
import { useState } from "react";
import Window from "./window";
import History from "./history";
import { MessageType, ReasoningFunctionsType } from "@/app/utils/types";

interface AppWindowProps {
    showHistory: boolean;
    activeWindows: string[];
}

export default function AppWindow({ showHistory, activeWindows }: AppWindowProps) {
    
    const initMessages = () => {
        let newMessages: MessageType[] = [];
        newMessages.push({ role: "system", content: "You are a helpful assistant. Keep yourself as short as possible."})
        return newMessages;
    }
    const [messages, setMessages] = useState<MessageType[]>(initMessages());

    // TODO: If called multiple times in an async method, last call will overwrite previous ones -> only appends last message. 
    // Temporary solution: Collect all messages and pass them as array in single call at the end of async function.
    function appendMessage (newMessages: MessageType[]) {
        let updated_messages = [...messages];
        for (let m of newMessages){
            updated_messages.push(m);
        }
        setMessages(updated_messages)
    }

    function reasoning_user(prompt: string) {
        const userMessage: MessageType = {role: "user", content: prompt};    
        appendMessage([userMessage]) // only, in order to already show
    }

    async function reasoning_forward() {        
        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages]
            })
        });
        const result = await response.json();

        // append user again, since message-state not updated yet
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        appendMessage([assistant_message]);
    }

    function reasoning_backward() {
        let updated_messages = [...messages];
        updated_messages.pop();
        setMessages(updated_messages);
    }

    async function reasoning_refine() {
        
        // system prompt
        const refine_prompt="Please overthink your previous answer. Is there anything incorrect"
        const system_message: MessageType = {role: "system", content: refine_prompt}
        appendMessage([system_message])

        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages]
            })
        });
        const result = await response.json();

        // append system again, since message-state not updated yet
        const assistant_message: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        appendMessage([system_message, assistant_message]);
    }

    const reasoning_functions: ReasoningFunctionsType = {
        user: reasoning_user,
        forward: reasoning_forward,
        backward: reasoning_backward,
        refine: reasoning_refine
    }

    return(
        <main className="flex-1 overflow-hidden">
            <div className="h-full flex">
                {showHistory && (
                    <div className=" basis-1/6 border-r-2 bg-stone-200 border-zinc-400">
                        <History />
                    </div>
                )}
                <div className="flex-1">
                    <Window content={activeWindows[0]} messages={messages} reasoning_functions={reasoning_functions}/>
                </div>
                {activeWindows[1] && (
                    <div className="flex-1 border-l-2 border-zinc-400">
                        <Window content={activeWindows[1]} messages={messages} reasoning_functions={reasoning_functions}/>
                    </div>
                )}
            </div>
        </main>
    );
}