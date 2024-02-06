import GraphKeywordGraph from "./graph-keyword-graph";
import { Node } from "@/app/utils/types";
import { Key, useState } from "react";
import { KeywordSettings } from "@/app/utils/types";

interface KeywordGraphProps {
    nodes: { [id: number]: Node },
    setNodes: (nodes: { [id: number]: Node }) => void,
}

export default function KeywordGraph({ nodes, setNodes }: KeywordGraphProps) {

    const [selectedKeywordNode, setSelectedKeywordNode] = useState<number>(-1); // initialize with -1
    const [keywordSettings, setKeywordSettings] = useState<KeywordSettings[]>([]); // initialize with []

    function onSetSelectedKeywordNode(nodeId: number) {
        setSelectedKeywordNode(nodeId);
        const keywordSettingsUpdated = nodes[nodeId]?.keywords?.map((keyword) => {
            return { keyword: keyword, color: "#000000", show: true }
        }) ?? [];
        console.log(keywordSettingsUpdated)
        setKeywordSettings(keywordSettingsUpdated);
    }

    function KeywordSettingsComponent(keyword: KeywordSettings) {
        return (
            <div className="flex justify-between p-1">
                <input 
                    type="checkbox" 
                    checked={keyword.show}
                    onChange={(e) => {
                        let keywordSettingsUpdated = [...keywordSettings];
                        const index = keywordSettings.findIndex((kw) => kw.keyword === keyword.keyword);
                        keywordSettingsUpdated[index].show = e.target.checked;
                        setKeywordSettings(keywordSettingsUpdated);
                    }}
                />
                <input 
                    type="color" 
                    className="h-6 w-6 ml-1" 
                    value={keyword.color}
                    onChange={(e) => {
                        let keywordSettingsUpdated = [...keywordSettings];
                        const index = keywordSettings.findIndex((kw) => kw.keyword === keyword.keyword);
                        keywordSettingsUpdated[index].color = (e.target as HTMLInputElement).value;
                        setKeywordSettings(keywordSettingsUpdated);
                    }}
                />
                <p className={`ml-auto`} style={{ color: keyword.color }}>{keyword.keyword}</p>
            </div>
        )
    }

    return(
        <div className="relative">
            <div className="absolute top-0 right-4 w-32 h-52 bg-gray-300 border-black border-4">
                {/* Add your setting buttons here */}
                {keywordSettings.map((keyword) => ( KeywordSettingsComponent(keyword) ))}
                <p className="absolute bottom-0 left-1" style={{ fontSize: "0.6rem" }}>
                    {(selectedKeywordNode === -1) ? "show all keywords" : `keywords from node ${selectedKeywordNode}`}
                </p>
            </div>
            <GraphKeywordGraph nodes={nodes} setNodes={setNodes} selectedKeywordNode={selectedKeywordNode} setSelectedKeywordNode={onSetSelectedKeywordNode}/>
        </div>
    );
}