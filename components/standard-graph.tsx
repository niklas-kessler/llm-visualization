import { ReasoningFunctionsType, Node } from "@/app/utils/types";
import GraphStandardGraph from "./graph-standard-graph";
import { node_text } from "@/app/utils/utils";

interface StandardGraphProps {
    nodes: { [id: number]: Node },
    selectedNode: number,
    setSelectedNode: (id: number) => void,
    reasoning_functions: ReasoningFunctionsType,
}

export default function StandardGraph( { nodes, selectedNode, setSelectedNode, reasoning_functions }: StandardGraphProps) {
    
    const { forward, tools, backward, refine, parallel_split, aggregate, attention } = reasoning_functions

    return(
        <div>
            <GraphStandardGraph nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode}/>
            <div className="justify-center flex pt-1">
                <button className="py-1 px-2 rounded-l-md w-14 h-14 border-2 border-black bg-gray-400" onClick={forward}>
                    {node_text("forward")}
                </button>
                <button className="py-1 px-2 w-14 h-14 border-2 border-black bg-gray-400" onClick={tools}>
                    {node_text("tools")}
                </button>
                <button className="py-1 px-2 w-14 h-14 border-2 border-black bg-gray-400" onClick={parallel_split}>
                    <text style={{ fontSizeAdjust: "smaller", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {node_text("split")}
                    </text>
                </button>
                <button className="py-1 px-2 w-14 h-14 border-2 border-black bg-gray-400" onClick={aggregate}>
                    <text style={{ fontSizeAdjust: "smaller", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {node_text("aggregate")}
                    </text>
                </button>
                <button className="py-1 px-2 w-14 h-14 border-2 border-black bg-gray-400" onClick={refine}>
                    {node_text("refine")}
                </button>
                <button className="py-1 px-2 w-14 h-14 border-2 border-black bg-gray-400" onClick={attention}>
                    {node_text("attention")}
                </button>
                <button className="py-1 px-2 w-14 h-14 rounded-r-md border-2 border-black bg-gray-400" onClick={backward}>
                    {node_text("backward")}
                </button>
                
            </div>
        </div>
    );
}