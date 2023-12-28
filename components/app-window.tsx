"use client"
import { useState } from "react";
import Window from "./window";
import History from "./history";
import { MessageType } from "@/app/utils/types";

interface AppWindowProps {
    showHistory: boolean;
    activeWindows: string[];
}

export default function AppWindow({ showHistory, activeWindows }: AppWindowProps) {
    
    const initMessages = () => {
        let newMessages: MessageType[] = [];
        for (let i = 0; i < 3; i++) {
            newMessages.push({sender: "User", content: "This is a User request."});
            newMessages.push({sender: "ChatGPT", content: "This is a Tool Call."});
            newMessages.push({sender: "Tool", content: "This is a Tool's answer."});
            newMessages.push({sender: "ChatGPT", content: "This is a final answer."});
          }
        return newMessages;
    }
    const [messages, SetMessages] = useState<MessageType[]>(initMessages());

    function appendMessage (message: MessageType) {
        let newMessages = [...messages];
        newMessages.push(message);
        newMessages.push({sender: "ChatGPT", content: "This is a Tool Call."});
        newMessages.push({sender: "Tool", content: "This is a Tool's answer."});
        newMessages.push({sender: "ChatGPT", content: "This is a final answer."});
        SetMessages(newMessages)
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
                    <Window content={activeWindows[0]} messages={messages} appendMessage={appendMessage}/>
                </div>
                {activeWindows[1] && (
                    <div className="flex-1 border-l-2 border-zinc-400">
                        <Window content={activeWindows[1]} messages={messages}/>
                    </div>
                )}
            </div>
        </main>
    );
}