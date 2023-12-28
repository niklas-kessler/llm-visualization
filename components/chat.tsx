import Message from "./message";
import ChatInput from "./chat-input";
import { MessageType } from "@/app/utils/types";
import React,{ useEffect } from "react";

interface ChatProps {
    messages: MessageType [],
    appendMessage: (message: MessageType) => void;
}

export default function Chat({ messages, appendMessage }: ChatProps) {

    // Scroll to the bottom of the chat when messages change
    const chatRef = React.createRef<HTMLDivElement>();
    useEffect(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, [messages]);

    return(
        <div className="flex-1 overflow-hidden flex flex-col justify-between">
            <div ref={chatRef} className="flex-1 overflow-hidden space-y-10 overflow-y-auto px-4 py-4 max-h-full">
                {messages.map((element, index) => (
                    <div key={index}>
                        <Message sender={element.sender} content={element.content}/>
                    </div>
                ))}
            </div>
            <ChatInput appendMessage={appendMessage}/>
        </div>
    );
}