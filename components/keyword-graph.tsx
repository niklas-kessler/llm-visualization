import GraphKeywordGraph from "./graph-keyword-graph";
import { Node } from "@/app/utils/types";
import { useState, useEffect } from "react";
import { KeywordSettings } from "@/app/utils/types";

interface KeywordGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node },
    setNodes: (nodes: { [id: number]: Node }) => void,
}

export default function KeywordGraph({ fullScreen, nodes, setNodes }: KeywordGraphProps) {

    const defaultColors = ["#06d6a0", "#1b9aaa", "#ef476f", "#ffc43d", "#073b4c", "#118ab2", "#f4a261", "#2a9d8f", "#f8ffe5"];

    const [selectedKeywordNode, setSelectedKeywordNode] = useState<number>(-1); // initialize with -1
    const [keywordSettings, setKeywordSettings] = useState<{[keyword: string]: KeywordSettings}>({}); // initialize with []

    useEffect(recalculateShownKeywords, [keywordSettings])

    function onSetSelectedKeywordNode(nodeId: number) {

        console.log("setting selectedKeywordNode to", nodes[nodeId])

        setSelectedKeywordNode(nodeId);

        // init settings
        let updatedKeywordSettings: {[keyword: string]: KeywordSettings} = {};
        const keywords = nodes[nodeId]?.keywords ?? [];
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            // avoid duplicates
            if (!updatedKeywordSettings[keyword]) {
                // reuse old settings if available
                if (keywordSettings[keyword]) {
                    updatedKeywordSettings[keyword] = keywordSettings[keyword];
                } else {
                    updatedKeywordSettings[keyword] = { color: defaultColors[i%defaultColors.length], show: true };
                }
            }
        }
    
        setKeywordSettings(updatedKeywordSettings);
        console.log(updatedKeywordSettings)
    }

    function recalculateShownKeywords() {
        // For each node...
        let updatedNodes = {...nodes};
        for (const nodeId in updatedNodes) {
            const node = updatedNodes[nodeId];
            node.selectedKeywordsContained = [];
            const messages = node.messages.map(m => m.content);

            const keywords = node.keywords ?? [];
            for (let keyword of keywords) {
                // ...and each keyword that should be shown...
                if(keywordSettings[keyword]?.show === true){
                    // ...check wether the node contains it.
                    if (messages.some((message: string) => message.toLowerCase().includes(keyword))){          
                        node.selectedKeywordsContained?.push(keyword);
                    }
                }
            }
        }

        // update state
        setNodes(updatedNodes);
    }

    function KeywordSettingsComponent(keyword: string) {
        return (
            <div className="flex justify-between px-1 pb-4">
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

    /* show defaultColors
                    <div className="flex">
                        {defaultColors.map((color) => (
                            <div
                                key={color}
                                style={{
                                    width: "10px",
                                    height: "10px",
                                    backgroundColor: color,
                                    marginRight: "0px",
                                }}
                            ></div>
                        ))}
                    </div>
                */

    return(
        <div className="relative w-full h-full">
            <GraphKeywordGraph fullScreen={fullScreen} nodes={nodes} selectedKeywordNode={selectedKeywordNode} setSelectedKeywordNode={onSetSelectedKeywordNode} keywordSettings={keywordSettings}/>
            <div className="absolute top-4 left-4 w-32 min-h-6 h-fit max-h-52 bg-gray-300 border-black border-4">                
                {/*show a KeywordSettingsComponent for each keywordSetting here*/}
                {Object.keys(keywordSettings).map((keyword) => {
                    return KeywordSettingsComponent(keyword);
                })}
                    
                <p className="absolute bottom-0 left-1/2 transform -translate-x-1/2 whitespace-nowrap" style={{ fontSize: "0.6rem" }}>
                    {(selectedKeywordNode === -1) ? "show all keywords" : `keywords from node ${selectedKeywordNode}`}
                </p>
                
            </div>
        </div>
    );
}