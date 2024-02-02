import { GraphNode, GraphLink, Node, Keyword } from "@/app/utils/types";
import { Graph } from "@visx/network";
import { node_color } from "@/app/utils/utils";
import Wordcloud from "@visx/wordcloud/lib/Wordcloud";
import { scaleLog } from "@visx/scale";

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
    value.keywords= [
        {text: "Keyword1", value: 1},
        {text: "Keyword2", value: 3},
        {text: "Keyword3", value: 2},
    ]
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
    const colors = ['#143059', '#2F6B9A', '#82a6c2'];
    const fontScale = scaleLog({
        domain: [
            Math.min(...(node.keywords ?? []).map((w) => w.value)),
            Math.max(...(node.keywords ?? []).map((w) => w.value))
        ],
        range: [2,8],
      });
    const fontSizeSetter = (keyword: Keyword) => fontScale(keyword.value);
    return (
      <g transform="translate(-100,-20)">
        <Wordcloud 
          words={node.keywords ?? []}
          width={100}
          height={50} 
          fontSize={fontSizeSetter}
          font={'Impact'}
          padding={2}
          spiral={'rectangular'}
          rotate={0}
          random={() => 0.5}
        >
          {(cloudwords) => 
            cloudwords.map((w,i) => (
              <text
                key={w.text}
                fill={colors[i % colors.length]}
                textAnchor={'middle'}
                transform={`translate(${2*(w.x??0)}, ${2*(w.y??0)})`}
                fontFamily={w.font}
              >
                {w.text}
              </text>
          ))}
        </Wordcloud>
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