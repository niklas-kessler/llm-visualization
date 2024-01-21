import { ReasoningFunctionsType } from "@/app/utils/types";

interface StandardGraphProps {
    selectedNode: number,
    setSelectedNode: (id: number) => void,
    reasoning_functions: ReasoningFunctionsType
}

export default function StandardGraph( { reasoning_functions, selectedNode, setSelectedNode }: StandardGraphProps) {
    
    const { user, forward, backward, refine } = reasoning_functions

    return(
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
    );
}