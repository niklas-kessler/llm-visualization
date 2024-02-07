import { ReasoningFunctionsType, Node } from "@/app/utils/types";
import GraphStandardGraph from "./graph-standard-graph";
import ReasoningButtons from "./reasoning-buttons";
import { useState } from "react";

interface StandardGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node },
    selectedNode: number,
    setSelectedNode: (id: number) => void,
    reasoning_functions: ReasoningFunctionsType,
}

export default function StandardGraph( { fullScreen, nodes, selectedNode, setSelectedNode, reasoning_functions }: StandardGraphProps) {
    
    const [showButtons, setShowButtons] = useState<boolean>(true);

    return(
        <div className="relative w-full h-full">
            <GraphStandardGraph fullScreen={fullScreen} nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode}/>
            <div className="absolute top-4 left-4">
                <ReasoningButtons showButtons={showButtons} setShowButtons={setShowButtons} reasoning_functions={reasoning_functions} horizontal={false}/>
            </div>
        </div>
    );
}