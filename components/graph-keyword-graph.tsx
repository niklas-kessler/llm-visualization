import { GraphNode, GraphLink, Node, KeywordSettings} from "@/app/utils/types";
import { Graph } from "@visx/network";
import Keywordcloud from "./keywordcloud";

interface GraphKeywordGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node },
    selectedKeywordNode: number,
    setSelectedKeywordNode: (nodeId: number) => void,
    keywordSettings: {[keyword: string]: KeywordSettings},
}

export const background = '#eee';

export default function GraphKeywordGraph({ fullScreen, nodes, selectedKeywordNode, setSelectedKeywordNode, keywordSettings }: GraphKeywordGraphProps) {
  const width = 500;
  const height = 350;

  const nodesArr: GraphNode[] = [];
  

  // reset selectedKeywordNode when selected node is deleted
  if (selectedKeywordNode !== -1 && !nodes[selectedKeywordNode]) {
    setSelectedKeywordNode(-1);
  }

  //group nodes by level
  const nodesByLevel = Object.values(nodes).reduce((groups, node) => {
    const key = node.level(nodes);
    if (!groups[key]) {
        groups[key] = [];
    }
    groups[key].push(node);
    return groups;
  }, {} as { [key: string]: Node[] });

  //map nodes-dict to array of nodes with x and y coordinates
  for (const key in nodesByLevel) {
    const n_nodes = nodesByLevel[key].length;
    for (let i = 0; i < n_nodes; i++) {
      const node = nodesByLevel[key][i];
      const x = (i - (n_nodes - 1) / 2) * width / (n_nodes + 1);
      const numLevels = Object.keys(nodesByLevel).length;
      const y = parseInt(key) * height / numLevels;
      const graphNode = { ...node, x, y } as GraphNode;
      nodesArr.push(graphNode);
    }
  }

  for (const value of nodesArr) {
    //map parents ids to their id in the new nodes array
    if (value.parents !== undefined) {
      value.parents = value.parents.map((parent) => nodes[parent].id);
    }
    //map children ids to their id in the new nodes array
    if (value.children !== undefined) {
      value.children = value.children.map((child) => nodes[child]?.id ?? value.id); //does the ?? value.id make sense?
    }
  }
  

  //map nodes dict to array of links
  const linksArr: GraphLink[] = []
  for (const value of nodesArr) {
    for (const child of value.children ?? []) {
      if(nodesArr.find(node => node.id === child) !== undefined) {
        const targetNode = nodesArr.find(node => node.id === child);
        if (targetNode) {
          linksArr.push({ 
            source: value, 
            target: targetNode
          });
        }
      }
    };
  }

  const graph = {
    nodes: nodesArr,
    links: linksArr,
  };

  // Node
  function GraphNode({ node }: { node: GraphNode }) {
    return (
      <g 
        onClick={() => {
          if (selectedKeywordNode === node.id) {
            setSelectedKeywordNode(-1);
            return;
          }
          calculateKeywords(node.id, node.keywords)
        }} // Add onClick event handler
        style={{ cursor: "pointer" }} // Add cursor style
      >
        <circle
          r={20}
          fill="#ccc"
          opacity={0.5}
        />
        <Keywordcloud 
          width={300} 
          height={150} 
          keywords={(selectedKeywordNode === -1) ? (node.keywords ?? []) : (node.selectedKeywordsContained ?? ["error: calculation of selectedKeywordsContained is called too late"])}
          keywordSettings={keywordSettings}
        />
      </g>
    );
  }

  // Calculate keywords when a node is clicked, set nodes from AppWindow
  function calculateKeywords(nodeId: number, keywords?: string[]) {
    if (!keywords) return;
    setSelectedKeywordNode(nodeId);
  }

    return(
      <div className='flex justify-center pt-2 p-4 w-full h-full'>
        <svg width="100%" height="100%">
          <rect className='rounded-sm' width="100%" height="100%" rx={14} fill={background} />
          <Graph<GraphLink, GraphNode>
            graph={graph}
            top={30}
            left={fullScreen? 600 : 300}
            linkComponent={({ link: { source, target, dashed } }) => (
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                strokeWidth={2}
                stroke="#999"
                strokeOpacity={0.6}
                strokeDasharray={dashed ? '8,4' : undefined}
              />
            )}
            nodeComponent={GraphNode}
          />
        </svg>
      </div>
    );
}