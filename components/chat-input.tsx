import { useState } from "react";
import { node_text } from "@/app/utils/utils";
import { ReasoningFunctionsType } from "@/app/utils/types";

interface ChatInputProps { 
    reasoning_functions: ReasoningFunctionsType,
}

export default function ChatInput({ reasoning_functions }: ChatInputProps) {

    const { user, forward, tools, backward, refine, parallel_split, aggregate, attention } = reasoning_functions

    const [textInput, setTextInput] = useState<string>('');
    const [showButtons, setShowButtons] = useState(false);

    const handlePlusButtonClick = () => {
        setShowButtons(false);
    };

    return (
        <div className="flex">
            <button className="w-11 h-11 self-center ml-2 bg-zinc-400 border-2 border-zinc-700 rounded-full" onClick={() => setShowButtons(!showButtons)}>
                {showButtons ? "-" : "+"}
            </button>
            {showButtons &&
            <div className="ml-2 flex self-center h-11">
                <button className="w-11 rounded-l-md border-2 border-zinc-700 bg-zinc-400 text-sm" onClick={forward}>
                    {node_text("forward")}
                </button>
                <button className="w-11 border-2 border-zinc-700 bg-zinc-400" onClick={tools}>
                    {node_text("tools")}
                </button>
                <button className="w-11 border-2 border-zinc-700 bg-zinc-400" onClick={parallel_split}>
                    <text style={{ fontSize: "smaller", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {node_text("split")}
                    </text>
                </button>
                <button className="w-11 border-2 border-zinc-700 bg-zinc-400" onClick={aggregate}>
                    <text style={{ fontSize: "smaller", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {node_text("aggregate")}
                    </text>
                </button>
                <button className="w-11 border-2 border-zinc-700 bg-zinc-400" onClick={refine}>
                    {node_text("refine")}
                </button>
                <button className="w-11 border-2 border-zinc-700 bg-zinc-400" onClick={attention}>
                    {node_text("attention")}
                </button>
                <button className="w-11 rounded-r-md border-2 border-zinc-700 bg-zinc-400" onClick={backward}>
                    {node_text("backward")}
                </button>               
            </div>
        }
            

            <form className="flex-grow flex p-4" onSubmit={(e) => {
                e.preventDefault();
                // fire callback...
                if (textInput === "") {
                    return;
                }
                user(textInput);
                setTextInput('');
            }}>
                <input type="text" placeholder="Send a message..." value={textInput} onChange={(e) => setTextInput(e.target.value)} className="flex-1 px-4 py-2 border rounded-l-md border-zinc-700 focus:outline-none"></input>
                <input type="submit" className="px-4 py-2 bg-zinc-400 border-2 border-zinc-700 rounded-r-md" />
            </form>
        </div>
    );
}