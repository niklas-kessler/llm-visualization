import { useState } from "react";
import { ReasoningFunctionsType } from "@/app/utils/types";
import ReasoningButtons from "./reasoning-buttons";

interface ChatInputProps { 
    reasoning_functions: ReasoningFunctionsType,
    reasoning_auto: () => Promise<void>
}


export default function ChatInput({ reasoning_functions, reasoning_auto }: ChatInputProps) {

    const { user } = reasoning_functions

    const [textInput, setTextInput] = useState<string>('');
    const [showButtons, setShowButtons] = useState(false);

    


    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevents the default behavior of adding a new line
            if (textInput === "") {
                return;
            }
            user(textInput);
            setTextInput('');
        }
    };

    return (
        <div className="flex">
            <ReasoningButtons showButtons={showButtons} setShowButtons={setShowButtons} reasoning_functions={reasoning_functions} reasoning_auto={reasoning_auto} horizontal={true}/>
            <form className="flex-grow flex p-4" onSubmit={(e) => {
                e.preventDefault();
                // fire callback...
                if (textInput === "") {
                    return;
                }
                user(textInput);
                setTextInput('');
            }}>
            <textarea placeholder="Send a message..." value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={handleKeyDown} className="flex-1 px-4 py-2 border rounded-l-md border-zinc-700 focus:outline-none"></textarea>
            <input type="submit" className="px-4 py-2 bg-zinc-400 border-2 border-zinc-700 rounded-r-md" />
            </form>
        </div>
    );
}