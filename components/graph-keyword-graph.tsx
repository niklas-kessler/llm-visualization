import { GraphNode, GraphLink, Node, KeywordSettings} from "@/app/utils/types";
import { Graph } from "@visx/network";
import Keywordcloud from "./keywordcloud";
import { useState } from 'react';
import { Zoom } from '@visx/zoom';
import { RectClipPath } from '@visx/clip-path';
import { localPoint } from '@visx/event';

interface GraphKeywordGraphProps {
    fullScreen: boolean,
    nodes: { [id: number]: Node },
    selectedKeywordNode: number,
    setSelectedKeywordNode: (nodeId: number) => void,
    keywordSettings: {[keyword: string]: KeywordSettings},
}

export const background = '#ccc';

export default function GraphKeywordGraph({ fullScreen, nodes, selectedKeywordNode, setSelectedKeywordNode, keywordSettings }: GraphKeywordGraphProps) {
  
  const width = fullScreen? 1260 : 620;
  const height = 420;
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true);
  const initialTransform = {
    scaleX: 1.0,
    scaleY: 1.0,
    translateX: 0,
    translateY: 0,
    skewX: 0,
    skewY: 0,
  };

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
      <g className='flex justify-center pt-2'>
      <Zoom <SVGSVGElement>
          width={width}
          height={height}
          scaleXMin={1 / 2}
          scaleXMax={4}
          scaleYMin={1 / 2}
          scaleYMax={4}
          initialTransformMatrix={initialTransform}
        >
          {(zoom) => (
            <div className="relative">
              <svg
                width={width}
                height={height}
                style={{ cursor: zoom.isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
                ref={zoom.containerRef}
              >
                <RectClipPath id="zoom-clip" width={width} height={height} />
                <rect width={width} height={height} rx={14} fill={background} />
                <rect
                  width={width}
                  height={height}
                  rx={14}
                  fill="transparent"
                  onTouchStart={zoom.dragStart}
                  onTouchMove={zoom.dragMove}
                  onTouchEnd={zoom.dragEnd}
                  onMouseDown={zoom.dragStart}
                  onMouseMove={zoom.dragMove}
                  onMouseUp={zoom.dragEnd}
                  onMouseLeave={() => {
                    if (zoom.isDragging) zoom.dragEnd();
                  }}
                  onDoubleClick={(event) => {
                    const point = localPoint(event) || { x: 0, y: 0 };
                    zoom.scale({ scaleX: 1.1, scaleY: 1.1, point });
                  }}
                />
                <g transform={zoom.toString()}>
                  <Graph<GraphLink, GraphNode>
                    graph={graph}
                    top={30}
                    left={fullScreen? 600 : 300}
                    linkComponent={({ link: { source, target } }) => (
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        strokeWidth={2}
                        stroke="#999"
                        strokeOpacity={0.6}
                      />
                    )}
                    nodeComponent={GraphNode}
                  />
                </g>
                {showMiniMap && (
                  <g
                    clipPath="url(#zoom-clip)"
                    transform={`
                      scale(0.25)
                      translate(${width * 4 - width - 60}, ${height * 4 - height - 60})
                    `}
                  >
                    <rect width={width} height={height} fill="#1a1a1a" />
                    <div className='flex justify-center pt-2 p-4 w-full h-full'>
                      <svg width="100%" height="100%">
                        <rect className='rounded-sm' width="100%" height="100%" rx={14} fill={background} />
                        <Graph<GraphLink, GraphNode>
                          graph={graph}
                          top={30}
                          left={fullScreen? 600 : 300}
                          linkComponent={({ link: { source, target } }) => (
                            <line
                              x1={source.x}
                              y1={source.y}
                              x2={target.x}
                              y2={target.y}
                              strokeWidth={2}
                              stroke="#999"
                              strokeOpacity={0.6}
                            />
                          )}
                          nodeComponent={GraphNode}
                        />
                      </svg>
                    </div>
                    <Graph<GraphLink, GraphNode>
                      graph={graph}
                      top={30}
                      left={fullScreen? 600 : 300}
                      linkComponent={({ link: { source, target } }) => (
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          strokeWidth={2}
                          stroke="#999"
                          strokeOpacity={0.6}
                        />
                      )}
                      nodeComponent={GraphNode}
                    />
                    <rect
                      width={width}
                      height={height}
                      fill="white"
                      fillOpacity={0.2}
                      stroke="white"
                      strokeWidth={4}
                      transform={zoom.toStringInvert()}
                    />
                  </g>
                )}
              </svg>
              <div className="absolute top-2 right-2">
                <button
                  className="w-8 h-8 rounded-l-lg border-2 border-r-0 border-black bg-zinc-700  text-xs text-zinc-400"
                  onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })}
                >
                  +
                </button>
                <button
                  className="w-8 h-8 rounded-r-lg border-2 border-black bg-zinc-700 text-xs text-zinc-400"
                  onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })}
                >
                  -
                </button>
                <button className="h-8 ml-2 p-1 rounded-l-lg border-2 border-r-0 border-black bg-zinc-700 text-xs text-zinc-400" onClick={zoom.center}>
                  Center
                </button>
                <button className="h-8 p-1 border-2 border-r-0 border-black bg-zinc-700 text-xs text-zinc-400" onClick={zoom.reset}>
                  Reset
                </button>
                <button className="h-8 p-1 rounded-r-lg border-2 border-black bg-zinc-700 text-xs text-zinc-400" onClick={zoom.clear}>
                  Clear
                </button>
              </div>
              <div className="absolute bottom-2 right-2">
                <button
                  className="h-4 p-1 rounded-md border-2 border-black bg-zinc-700 text-xs text-zinc-400"
                    style={{ fontSize: 0.6 + 'em', lineHeight: 0.6 + 'em'}}
                  onClick={() => setShowMiniMap(!showMiniMap)}
                >
                  {showMiniMap ? 'Hide' : 'Show'} Mini Map
                </button>
              </div>
            </div>
          )}
        </Zoom>
      </g>
    );
}