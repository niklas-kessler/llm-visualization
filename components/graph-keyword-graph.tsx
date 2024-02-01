import { GraphNode, GraphLink, Node } from "@/app/utils/types";
import { Graph } from "@visx/network";
import { node_color, node_text } from "@/app/utils/utils";

interface GraphKeywordGraphProps {
    nodes: { [id: number]: Node },
}


export const background = '#eee';

export default function GraphKeywordGraph({ nodes }: GraphKeywordGraphProps) {
    const width = 500;
    const height = 350;
    
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
  let nodesArr: GraphNode[] = [];
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
      value.children = value.children.map((child) => nodes[child].id);
    }
    //extract keywords from messages
    value.keywords = ["Keyword1", "Keyword2", "Keyword3"];
  }
  console.log("after keyword extraction", nodesArr)

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
      <g>
        <rect 
            height={40}
            width={80}
            fill="#eee"
            stroke={node_color(node.type, true)}
            strokeWidth={3}
            x={-40}
            y={-20}
        />
        <text 
            fontSize="10px" 
            textAnchor="middle"
            height={40}
            width={80}
        >
          {node.keywords?.join(", ")}
        </text>
      </g>
    );
  }

    return(
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
    );
}