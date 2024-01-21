"use client"

import Message from "./message";
import ChatInput from "./chat-input";
import { MessageType, ReasoningFunctionsType } from "@/app/utils/types";
import React, { useEffect } from "react";

interface ChatProps {    
    chatMessages: MessageType[],
    reasoning_functions: ReasoningFunctionsType
}

export default function Chat({ chatMessages, reasoning_functions }: ChatProps) {

    // Scroll to the bottom of the chat when messages change
    const chatRef = React.createRef<HTMLDivElement>();
    useEffect(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, [chatMessages]);


    return(
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
            <div ref={chatRef} className="flex-1 overflow-hidden space-y-10 overflow-y-auto px-4 py-4 max-h-full">
                {chatMessages.map((element, index) => (
                    <div key={index}>
                        <Message role={element.role} content={element.content}/>
                    </div>
                ))}
            </div>
            <ChatInput sendPrompt={reasoning_functions.user}/>
        </div>
    );
}