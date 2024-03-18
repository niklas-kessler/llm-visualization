import { Node, SimilaritySettings } from "@/app/utils/types";
import { node_similarity_seqmatch, node_similarity_keyword_overlap, node_similarity_text_embedding } from "@/app/utils/utils";
import { useState } from "react";
import GraphSimGraph from "./graph-similarity-graph";

interface SimilarityGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node }
}

export default function SimilarityGraph( { fullScreen, nodes }: SimilarityGraphProps) {
    
    // settings for similarity graph
    const [settings, setSettings] = useState<SimilaritySettings>({
        measurement: "keywordoverlap",
        reduction_method: "PCA",
        colorMap: "viridis",    
    });

    const measurementFunctions: any = {
        seqmatch: node_similarity_seqmatch,
        keywordoverlap: node_similarity_keyword_overlap,
        textembedding: node_similarity_text_embedding
    };
    
    const sim_nodes = measurementFunctions[settings.measurement](nodes, settings.reduction_method);

    return (
        <div className="relative w-full h-full">
            <GraphSimGraph fullScreen={fullScreen} nodes={sim_nodes} colorMap={settings.colorMap}/>
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
                <select className="w-24 m-3 bg-gray-100" value={settings.colorMap} onChange={(e) => setSettings({ ...settings, colorMap: e.target.value as SimilaritySettings["colorMap"]})}>
                    <option key={"viridis"} value={"viridis"}>viridis</option>
                    <option key={"cividis"} value={"cividis"}>cividis</option>
                    <option key={"plasma"} value={"plasma"}>plasma</option>
                    <option key={"inferno"} value={"inferno"}>inferno</option>
                    <option key={"magma"} value={"magma"}>magma</option>
                    <option key={"blackWhite"} value={"blackWhite"}>blackWhite</option>
                </select>
                <img className="m-3 mt-0 w-24 h-4" src={settings.colorMap + ".png"} alt="Viridis.png"/>
            </div>
        </div>
    );
}