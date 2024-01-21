import { ReasoningFunctionsType, Node } from "@/app/utils/types";

interface StandardGraphProps {
    nodes: { [id: number]: Node },
    selectedNode: number,
    setSelectedNode: (id: number) => void,
    reasoning_functions: ReasoningFunctionsType,
}

export default function StandardGraph( { nodes, selectedNode, setSelectedNode, reasoning_functions }: StandardGraphProps) {
    
    const { forward, backward, refine, parallel_split } = reasoning_functions

    return(
        <div>
            <div className=" pt-7 flex justify-evenly">
                <button className="border-zinc-600 border-2 rounded-md" onClick={forward}>
                    Forward
                </button>
                <button className="border-zinc-600 border-2 rounded-md" onClick={refine}>
                    Refine
                </button>
                <button className="border-zinc-600 border-2 rounded-md" onClick={backward}>
                    Backward
                </button>
            </div>
            <div className=" pt-7 flex justify-evenly">
                <button className="border-zinc-600 border-2 rounded-md" onClick={parallel_split}>
                    Parallel Split
                </button>
                <button className="border-zinc-600 border-2 rounded-md" onClick={() => console.log("aggregate button")}>
                    Aggregate
                </button>
                <button className="border-zinc-600 border-2 rounded-md" onClick={() => console.log("attention button")}>
                    Attention
                </button>
            </div>
        </div>
    );
}