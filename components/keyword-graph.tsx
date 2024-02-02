import GraphKeywordGraph from "./graph-keyword-graph";
import { Node } from "@/app/utils/types";

interface KeywordGraphProps {
    nodes: { [id: number]: Node },
}

export default function KeywordGraph({ nodes }: KeywordGraphProps) {
    return(
        <GraphKeywordGraph nodes={nodes}/>
    );
}