import { Node } from "@/app/utils/types";
import { node_similarity_seqmatch, node_similarity_keyword_overlap, node_similarity_text_embedding } from "@/app/utils/utils";
import { useState } from "react";
import GraphSimGraph from "./graph-similarity-graph";

interface SimilarityGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node },
    selectedNode: number,
    setSelectedNode: (id: number) => void
}

export default function SimilarityGraph( { fullScreen, nodes, selectedNode, setSelectedNode }: SimilarityGraphProps) {
    
    const [measurement, setMeasurement] = useState<string>("keywordoverlap"); //seqmatch or textembedding

    //calculate similarity values in range [0,1]
    let sim_nodes = {};
    if(measurement === "seqmatch"){
        sim_nodes = node_similarity_seqmatch(nodes);
    } else if(measurement === "keywordoverlap"){
        sim_nodes = node_similarity_keyword_overlap(nodes);
    } else if(measurement === "textembedding"){
        sim_nodes = node_similarity_text_embedding(nodes);
    }

    return (
        <div className="relative w-full h-full">
            <GraphSimGraph fullScreen={fullScreen} nodes={sim_nodes}/>
        </div>
    );
}