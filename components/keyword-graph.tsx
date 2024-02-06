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
    const [keywordSettings, setKeywordSettings] = useState<{[keyword: string]: KeywordSettings}>({}); // initialize with []

    function onSetSelectedKeywordNode(nodeId: number) {
        setSelectedKeywordNode(nodeId);
        
        let updatedKeywordSettings: {[keyword: string]: KeywordSettings} = {};
        for (const keyword of nodes[nodeId]?.keywords ?? []) {  
            if (!updatedKeywordSettings[keyword]) {
                updatedKeywordSettings[keyword] = {color: "#000000", show: true};
            }
        }
        setKeywordSettings(updatedKeywordSettings);
    }

    function KeywordSettingsComponent(keyword: string) {
        return (
            <div className="flex justify-between p-1">
                <input 
                    type="checkbox" 
                    checked={keywordSettings[keyword].show}
                    onChange={(e) => {
                        let keywordSettingsUpdated = {...keywordSettings};
                        keywordSettingsUpdated[keyword].show = e.target.checked;
                        setKeywordSettings(keywordSettingsUpdated);
                    }}
                />
                <input 
                    type="color" 
                    className="h-6 w-6 ml-1" 
                    value={keywordSettings[keyword].color}
                    onChange={(e) => {
                        let keywordSettingsUpdated = {...keywordSettings};
                        keywordSettingsUpdated[keyword].color = (e.target as HTMLInputElement).value;
                        setKeywordSettings(keywordSettingsUpdated);
                    }}
                />
                <p className={`ml-auto`} style={{ color: keywordSettings[keyword].color }}>{keyword}</p>
            </div>
        )
    }

    return(
        <div className="relative">
            <div className="absolute top-0 right-4 w-32 h-52 bg-gray-300 border-black border-4">
                
                {/*show a KeywordSettingsComponent for each keywordSetting here*/}
                {Object.keys(keywordSettings).map((keyword) => {
                    return KeywordSettingsComponent(keyword);
                })}
                    
                <p className="absolute bottom-0 left-1" style={{ fontSize: "0.6rem" }}>
                    {(selectedKeywordNode === -1) ? "show all keywords" : `keywords from node ${selectedKeywordNode}`}
                </p>
                
            </div>
            <GraphKeywordGraph nodes={nodes} setNodes={setNodes} selectedKeywordNode={selectedKeywordNode} setSelectedKeywordNode={onSetSelectedKeywordNode}/>
        </div>
    );
}