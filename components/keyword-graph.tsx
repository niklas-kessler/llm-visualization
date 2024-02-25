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
    const [keywordSettings, setKeywordSettings] = useState<{[keyword: string]: KeywordSettings}>({}); // whether and in which color to show each of the current keywords, initialize with {}

    useEffect(recalculateShownKeywords, [keywordSettings])

    // Set the keyword settings respectively, when a node is selected for keyword caclulation
    function onSetSelectedKeywordNode(nodeId: number) {
        setSelectedKeywordNode(nodeId);

        // init settings
        let updatedKeywordSettings: {[keyword: string]: KeywordSettings} = {};
        const keywords = nodes[nodeId]?.keywords ?? [];
        for (let i = 0; i < keywords.length; i++) {
            const keyword = keywords[i];
            // avoid duplicates
            if (!updatedKeywordSettings[keyword]) {
                // reuse old settings if available, so that color and show state change as little as possible when selecting a different node
                if (keywordSettings[keyword]) {
                    updatedKeywordSettings[keyword] = keywordSettings[keyword];
                } else {
                    updatedKeywordSettings[keyword] = { color: defaultColors[i%defaultColors.length], show: true };
                }
            }
        }
    
        setKeywordSettings(updatedKeywordSettings);
    }

    // Recalculate which keywords should be shown for each node
    function recalculateShownKeywords() {
        // For each node...
        let updatedNodes = {...nodes};
        for (const nodeId in updatedNodes) {
            const node = updatedNodes[nodeId];
            node.selectedKeywordsContained = [];
            const messages = node.messages.map(m => m.content);

            const keywords = node.keywords ?? [];
            // ...and each keyword that should be shown...
            for (let keyword of keywords) {
                if(keywordSettings[keyword]?.show === true){
                    // ...check wether the node contains it.
                    if (messages.some((message: string) => message.toLowerCase().includes(keyword))){          
                        node.selectedKeywordsContained?.push(keyword);
                    }
                }
            }
        }
        setNodes(updatedNodes); // update state
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