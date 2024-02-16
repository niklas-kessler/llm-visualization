import { Node } from "@/app/utils/types";
import { node_similarity_seqmatch, node_similarity_text_embedding } from "@/app/utils/utils";
import { useState } from "react";

interface SimilarityGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node },
    selectedNode: number,
    setSelectedNode: (id: number) => void
}

export default function SimilarityGraph( { fullScreen, nodes, selectedNode, setSelectedNode }: SimilarityGraphProps) {
    
    const [measurement, setMeasurement] = useState<string>("textembedding"); //seqmatch or textembedding

    //calculate similarity values in range [0,1]
    let sim_nodes;
    if(measurement === "seqmatch"){
        sim_nodes = node_similarity_seqmatch(nodes);
    } else if(measurement === "textembedding"){
        sim_nodes =  node_similarity_text_embedding(nodes);
    }

    //convert sim_nodes-dict to array of nodes ordered by similarityValue
    let orderedNodes: Node[] = [];
    for (const key in sim_nodes) {
        orderedNodes.push(sim_nodes[key]);
    }
    orderedNodes.sort((a, b) => b.similarityValue - a.similarityValue);
    console.log("orderedNodes", orderedNodes);

    return (
        <div className="relative w-full h-full">
            {orderedNodes.map((node) => (
                <div key={node.id}>
                    <p>
                    {node.id} {node.messages[0].content} {node.similarityValue.toFixed(2)}
                    </p>
                </div>
            ))}
        </div>
    );
}