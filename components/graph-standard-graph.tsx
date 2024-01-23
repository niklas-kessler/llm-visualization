 /* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { MessageType, Node } from '@/app/utils/types';

import { DefaultNode, Graph } from '@visx/network';

interface CustomLink {
  source: Node;
  target: Node;
  dashed?: boolean;
}

export type GraphSGProps = {  
  nodes: { [id: number]: Node },
};


export const background = '#272b4d';

export default function GraphSG({ nodes }: GraphSGProps) {
    
  const width = 500;
  const height = 500;

  // map nodes dict to array
  const nodesArr = Object.values(nodes)

  // map nodes dict to array of links
  const linksArr = []
  for (const [_, value] of Object.entries(nodes)) {
    for (const child of value.children ?? []) {
      linksArr.push({ source: value, target: nodes[child] });
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
        <Graph<CustomLink, Node>
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
          nodeComponent={() => <DefaultNode />}
        />
      </svg>
      </div>
    );
  }
