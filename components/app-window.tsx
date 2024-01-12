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
        newMessages.push({ role: "system", content: "You are a helpful assistant. Keep yourself as short as possible."})
        return newMessages;
    }
    const [messages, SetMessages] = useState<MessageType[]>(initMessages());

    // TODO: If called multiple times in an async method, last call will overwrite previous ones -> only appends last message. 
    // Temporary solution: Collect all messages and pass them as array in single call at the end of async function.
    function appendMessage (newMessages: MessageType[]) {
        let updatedMessages = [...messages];
        for (let m of newMessages){
            updatedMessages.push(m);
        }
        SetMessages(updatedMessages)
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
                        <Window content={activeWindows[1]} messages={messages} appendMessage={appendMessage}/>
                    </div>
                )}
            </div>
        </main>
    );
}