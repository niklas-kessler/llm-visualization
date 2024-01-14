"use client"

import Message from "./message";
import ChatInput from "./chat-input";
import { MessageType } from "@/app/utils/types";
import React, { useEffect } from "react";

interface ChatProps {
    messages: MessageType [],
    appendMessage: (message: MessageType[]) => void;
}

export default function Chat({ messages, appendMessage }: ChatProps) {

    // Scroll to the bottom of the chat when messages change
    const chatRef = React.createRef<HTMLDivElement>();
    useEffect(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, [messages]);

    async function sendPrompt(prompt: string) {        
        const userMessage: MessageType = {role: "user", content: prompt};    
        appendMessage([userMessage]) // only, in order to already show
        
        // get response
        const response = await fetch("/api/chatgpt", {
            method:"POST",
            headers:{
            "Content-Type": "application/json",
            },
            body:JSON.stringify({
            messages: [...messages, userMessage]
            })
        });
        const result = await response.json();

        // append user again, since message-state not updated yet
        const assistantMessage: MessageType = {role: result.choices[0].message.role, content: result.choices[0].message.content}
        appendMessage([userMessage, assistantMessage]);
    }

    return(
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
            <div ref={chatRef} className="flex-1 overflow-hidden space-y-10 overflow-y-auto px-4 py-4 max-h-full">
                {messages.map((element, index) => (
                    <div key={index}>
                        <Message role={element.role} content={element.content}/>
                    </div>
                ))}
            </div>
            <ChatInput sendPrompt={sendPrompt}/>
        </div>
    );
}