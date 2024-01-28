 /* eslint-disable react/no-unstable-nested-components */
import { GraphNode, GraphLink, Node } from '@/app/utils/types';
import { Graph } from '@visx/network';
import { node_color, node_text } from '@/app/utils/utils';

export type GraphSGProps = {  
  selectedNode: number,
  setSelectedNode: (id: number) => void,
  nodes: { [id: number]: Node },
};


export const background = '#272b4d';

export default function GraphSG({ nodes, selectedNode, setSelectedNode }: GraphSGProps) {
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

  //map parents and children ids to their id in the new nodes array
  for (const value of nodesArr) {
    if (value.parents !== undefined) {
      value.parents = value.parents.map((parent) => nodes[parent].id);
    }
    if (value.children !== undefined) {
      value.children = value.children.map((child) => nodes[child].id);
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
        onClick={() => setSelectedNode(node.id)} // Add onClick event handler
        style={{ cursor: "pointer" }} // Add cursor style
      >
        <circle
          r={20}
          fill={selectedNode === node.id ? "#fff" : "#ccb"}
          stroke={node_color(node.type, selectedNode === node.id)}
          strokeWidth={6}
        />
        <text fontSize="10px" textAnchor="middle">
          {node_text(node.type)}
        </text>
      </g>
    );
  }
  
  // Graph Standard Graph
  return (
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

