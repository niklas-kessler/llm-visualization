import { GraphNode, GraphLink, Node} from "@/app/utils/types";
import { Graph } from "@visx/network";
import Keywordcloud from "./keywordcloud";
import { useState, useEffect } from "react";

interface GraphKeywordGraphProps {
    nodes: { [id: number]: Node },
}

export const background = '#eee';

export default function GraphKeywordGraph({ nodes }: GraphKeywordGraphProps) {
  const width = 500;
  const height = 350;

  const [nodesArr, setNodesArr] = useState<GraphNode[]>(initNodesArr()); // initialize with empty array
  const [selectedKeywordNode, setSelectedKeywordNode] = useState<number>(-1); // initialize with -1
  useEffect(() => {GraphNode}, [selectedKeywordNode]);    
  
  function initNodesArr(): GraphNode[]{

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
    let updatedNodesArr: GraphNode[] = [];
    for (const key in nodesByLevel) {
      const n_nodes = nodesByLevel[key].length;
      for (let i = 0; i < n_nodes; i++) {
        const node = nodesByLevel[key][i];
        const x = (i - (n_nodes - 1) / 2) * width / (n_nodes + 1);
        const numLevels = Object.keys(nodesByLevel).length;
        const y = parseInt(key) * height / numLevels;
        const graphNode = { ...node, x, y } as GraphNode;
        updatedNodesArr.push(graphNode);
      }
    }

    for (const value of updatedNodesArr) {
      //map parents ids to their id in the new nodes array
      if (value.parents !== undefined) {
        value.parents = value.parents.map((parent) => nodes[parent].id);
      }
      //map children ids to their id in the new nodes array
      if (value.children !== undefined) {
        value.children = value.children.map((child) => nodes[child]?.id ?? value.id); //does the ?? value.id make sense?
      }
    }
    return updatedNodesArr;
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
        onClick={() => calculateKeywords(node.id, node.keywords)} // Add onClick event handler
        style={{ cursor: "pointer" }} // Add cursor style
      >
        <Keywordcloud 
          width={300} 
          height={150} 
          keywords={(selectedKeywordNode === -1) ? (node.keywords ?? []) : (node.selectedKeywordsContained ?? ["outdated"])}/>
      </g>
    );
  }

  // Calculate keywords when a node is clicked
  function calculateKeywords(nodeId: number, keywords?: string[]) {
    if (!keywords) return;
    if (selectedKeywordNode === nodeId) {
      setSelectedKeywordNode(-1);
      return;
    }

    let updatedNodesArr = [...nodesArr];

    // For each node...
    for (let node of updatedNodesArr) {
      node.selectedKeywordsContained = [];
      const messages = node.messages.map(m => m.content);

      // ...check if it contains any of the current keywords
      for (const keyword of keywords) {
        if (messages.some((message: string) => message.includes(keyword))){          
          node.selectedKeywordsContained?.push(keyword);
        }
      }
    }
    setNodesArr(updatedNodesArr);
    setSelectedKeywordNode(nodeId);
  }


    return(
      <div>
        <div className='flex justify-center pt-2'>
          <svg width={width} height={height}>
            <rect className='w-full h-full rounded-sm' rx={14} fill={background} />
            <Graph<GraphLink, GraphNode>
              graph={graph}
              top={30}
              left={width / 2}
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
        <p>{(selectedKeywordNode === -1)? "show all keywords" : `show keywords from node ${selectedKeywordNode}`}</p>
      </div>
    );
}