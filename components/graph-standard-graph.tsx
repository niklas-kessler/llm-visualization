 /* eslint-disable react/no-unstable-nested-components */
import { GraphNode, GraphLink, Node } from '@/app/utils/types';
import { Graph } from '@visx/network';

export type GraphSGProps = {  
  nodes: { [id: number]: Node },
};


export const background = '#272b4d';

export default function GraphSG({ nodes }: GraphSGProps) {
  const width = 500;
  const height = 500;

  //function, to map the types of nodes to strings
  const node_text = (type: string) => {
    switch (type) {
      case "user":
        return "U";
      case "forward":
        return "\u2193";
      case "tools":
        return "T";
      case "split":
        return "\u2199 \u2193 \u2198"; // Unicode character for a two-way arrow pointing down
      case "aggregate":
        return "\u2198 \u2193 \u2199";
      case "refine":
        return "\u21BB";
      case "attention":
        return "?";
      case "final":
        return "Final";
      default:
        return "Default";
    }
  }

  //function, to map the types of nodes to colors
  const node_color = (type: string) => {
    switch (type) {
      case "user":
        return "#4169E1"; // Royal Blue
      case "forward":
        return "#108c4f"; // Dark Sea Green
      case "tools":
        return "#02d002"; // Lime Green
      case "split":
        return "#ffa500"; // Orange
      case "aggregate":
        return "#ffa500"; // Orange
      case "refine":
        return "#9932cc"; // Dark Orchid
      case "attention":
        return "#ff7f50"; // Coral
      case "final":
        return "#8b4513"; // Saddle Brown
      default:
         return "#ff0000"; // Default: Alert Red
    }
  }

  const nodesByLevel = Object.values(nodes).reduce((groups, node) => {
    const key = node.level(nodes);
    if (!groups[key]) {
        groups[key] = [];
    }
    groups[key].push(node);
    return groups;
  }, {} as { [key: string]: Node[] });

  let nodesArr: GraphNode[] = [];
  for (const key in nodesByLevel) {
    const n_nodes = nodesByLevel[key].length;
    //set x and y coordinates for each node 
    for (let i = 0; i < n_nodes; i++) {
      const node = nodesByLevel[key][i];
      const x = (i - (n_nodes - 1) / 2) * width / (n_nodes + 1);
      const numLevels = Object.keys(nodesByLevel).length;
      const y = parseInt(key) * height / numLevels;
      const graphNode = { ...node, x, y } as GraphNode;
      nodesArr.push(graphNode);
    }
  }

   Object.values(nodes).map((node) => {
    return {
      ...node,
      x: Math.random() * width / 2,
      y: Math.random() * height,
    } as GraphNode;
  });

  //mapping parents and children to ids
  for (const value of nodesArr) {
    if (value.parents !== undefined) {
      value.parents = value.parents.map((parent) => nodes[parent].id);
    }
    if (value.children !== undefined) {
      value.children = value.children.map((child) => nodes[child].id);
    }
  }

  // map nodes dict to array of links
  const linksArr = []
  for (const value of nodesArr) {
    for (const child of value.children ?? []) {
      if(nodesArr.find(node => node.id === child) !== undefined) {
        linksArr.push({ 
          source: value, 
          target: nodesArr.find(node => node.id === child)
        });
      }
    };
  }

  const graph = {
    nodes: nodesArr,
    links: linksArr,
  };
  
  return (
      <div className='flex justify-center pt-2'>
        <svg width={width} height={height}>
        <rect className='w-full h-full rounded-sm' rx={14} fill={background} />
        <Graph<GraphLink, GraphNode>
          graph={graph}
          top={20}
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
          nodeComponent={({ node }) => 
            <g>
              <circle
                r={20}
                fill="lightgrey"
                stroke={node_color(node.type)}
                strokeWidth={6}
              />
              <text fontSize="10px" textAnchor="middle">
                {node_text(node.type)}
              </text>
            </g>
        }
        />
      </svg>
      </div>
    );
  }
