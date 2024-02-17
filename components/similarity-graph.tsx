import { Node, SimilaritySettings } from "@/app/utils/types";
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
    
    const [settings, setSettings] = useState<SimilaritySettings>({
        measurement: "keywordoverlap",
        reduction_method: "PCA",
        color1: '#e9a039',
        color2: "#118ab2"
        
    });

    const measurementFunctions: any = {
        seqmatch: node_similarity_seqmatch,
        keywordoverlap: node_similarity_keyword_overlap,
        textembedding: node_similarity_text_embedding
    };
    
    const sim_nodes = measurementFunctions[settings.measurement](nodes, settings.reduction_method);

    return (
        <div className="relative w-full h-full">
            <GraphSimGraph fullScreen={fullScreen} nodes={sim_nodes} color1={settings.color1} color2={settings.color2}/>
            <div className="absolute top-4 left-4 w-32 min-h-6 h-fit max-h-52 bg-gray-300 border-black border-4">
                <select className="w-24 m-3 bg-gray-100" value={settings.measurement} onChange={(e) => setSettings({ ...settings, measurement: e.target.value as "seqmatch" | "keywordoverlap" | "textembedding" })}>
                    {Object.keys(measurementFunctions).map((measurement) => (
                        <option key={measurement} value={measurement}>{measurement}</option>
                    ))}
                </select>
                <select className="w-24 m-3 bg-gray-100" value={settings.reduction_method as "PCA" | "UMAP"} onChange={(e) => setSettings({ ...settings, reduction_method: e.target.value as "PCA" | "UMAP" })}>
                    <option key={"PCA"} value={"PCA"}>PCA</option>
                    <option key={"UMAP"} value={"UMAP"}>UMAP</option>
                </select>
                <div className="flex justify-center">
                    <input 
                        type="color" 
                        className="h-6 w-6 m-3" 
                        value={settings.color1}
                        onChange={(e) => {
                            setSettings({ ...settings, color1: e.target.value})
                        }}
                    />
                    <input 
                        type="color" 
                        className="h-6 w-6 m-3" 
                        value={settings.color2}
                        onChange={(e) => {
                            setSettings({ ...settings, color2: e.target.value})
                        }}
                    />
                </div>
            </div>
        </div>
    );
}