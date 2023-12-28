import { useState } from "react";
import { MessageType } from "@/app/utils/types";

interface ChatInputProps {    
    appendMessage: (message: MessageType) => void;
}

export default function ChatInput({ appendMessage }: ChatInputProps) {

    const [textInput, setTextInput] = useState<string>('');

    const sendText = () => {
        appendMessage({sender: "User", content: textInput});
        setTextInput('');
    }

    return (
        <div className="flex p-4">
            <input type="text" placeholder="Send a message..." value={textInput} onChange={(e) => setTextInput(e.target.value)} className="flex-1 px-4 py-2 border rounded-l-md border-zinc-600 focus:outline-none"></input>
            <button className="px-4 py-2 bg-zinc-400 border-2 border-zinc-600 rounded-r-md" onClick={() => sendText()}>Send</button>
        </div>
    );
}