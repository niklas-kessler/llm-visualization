import { useState } from "react";

interface ChatInputProps {    
    sendPrompt: (prompt: string) => void;
}

export default function ChatInput({ sendPrompt }: ChatInputProps) {

    const [textInput, setTextInput] = useState<string>('');

    return (
        <form className="flex p-4" onSubmit={(e) => {
            e.preventDefault();
            // fire callback...
            if (textInput === "") {
                return;
            }
            sendPrompt(textInput);
            setTextInput('');
        }}>
            <input type="text" placeholder="Send a message..." value={textInput} onChange={(e) => setTextInput(e.target.value)} className="flex-1 px-4 py-2 border rounded-l-md border-zinc-600 focus:outline-none"></input>
            <input type="submit" className="px-4 py-2 bg-zinc-400 border-2 border-zinc-600 rounded-r-md" />
        </form>
    );
}