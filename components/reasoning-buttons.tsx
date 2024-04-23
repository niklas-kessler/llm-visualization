import { ReasoningFunctionsType } from "@/app/utils/types"
import { node_text } from "@/app/utils/utils"

interface ReasoningButtonsProps {
    showButtons: boolean,
    setShowButtons: (showButtons: boolean) => void,
    reasoning_functions: ReasoningFunctionsType,
    reasoning_auto: () => Promise<void>,
    horizontal: boolean
}

export default function ReasoningButtons({ showButtons, setShowButtons, reasoning_functions, reasoning_auto, horizontal }: ReasoningButtonsProps) {
    const { forward, tools, backward, refine, parallelsplit, aggregate, attention, final } = reasoning_functions
    return (
        <div className={horizontal ? "flex" : "flex-col"}>
            <button className={`w-11 h-11 self-center ml-2 ${horizontal?"" : "mb-2"} bg-zinc-400 border-2 border-zinc-700 rounded-full`} onClick={() => setShowButtons(!showButtons)}>
                {showButtons ? "-" : "+"}
            </button>
            {showButtons &&
            <div className={`flex flex${horizontal?"":"-col"} ml-2 self-center`}>
                <button className={`w-11 h-11 rounded-${horizontal?"l":"t"}-md border-2 border-zinc-700 bg-zinc-400 text-sm`} onClick={() => forward()}>
                    {node_text("forward")}
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => tools()}>
                    {node_text("tools")}
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => parallelsplit()}>
                    <text style={{ fontSize: "smaller", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {node_text("split")}
                    </text>
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => aggregate()}>
                    <text style={{ fontSize: "smaller", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {node_text("aggregate")}
                    </text>
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => refine()}>
                    {node_text("refine")}
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => attention()}>
                    {node_text("attention")}
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => backward()}>
                    {node_text("backward")}
                </button>
                <button className="w-11 h-11 border-2 border-zinc-700 bg-zinc-400" onClick={() => final()}>
                    {node_text("final")}
                </button>
                <button className={`w-11 h-11 rounded-${horizontal?"r":"b"}-md border-2 border-zinc-700 bg-zinc-400`} onClick={reasoning_auto}>
                    {node_text("auto")}
                </button>               
            </div>
            }
        </div>
    );
}