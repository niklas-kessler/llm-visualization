import GraphKeywordGraph from "./graph-keyword-graph";
import { Node } from "@/app/utils/types";

interface KeywordGraphProps {
    nodes: { [id: number]: Node },
    setNodes: (nodes: { [id: number]: Node }) => void,
}

export default function KeywordGraph({ nodes, setNodes }: KeywordGraphProps) {
    return(
        <GraphKeywordGraph nodes={nodes} setNodes={setNodes} />
    );
}