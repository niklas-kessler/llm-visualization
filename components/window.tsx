import Chat from './chat';
import StandardGraph from './standard-graph';
import KeywordGraph from './keyword-graph';
import SimilarityGraph from './similarity-graph';
import { MessageType, ReasoningFunctionsType, Node } from '@/app/utils/types';

interface WindowProps {
    content: string,
    chatMessages: MessageType[],
    nodes: { [id: number]: Node },
    setNodes: (nodes: { [id: number]: Node }) => void,
    selectedNode: number,
    setSelectedNode: (id: number) => void,
    reasoning_functions: ReasoningFunctionsType
}

export default function Window({content, chatMessages, nodes, setNodes, selectedNode, setSelectedNode, reasoning_functions }: WindowProps) {
    let componentToRender;
    
    switch(content){
        case "Chat":
            componentToRender = <Chat chatMessages={chatMessages} reasoning_functions={reasoning_functions}/>;
            break;
        case "StandardGraph":
            componentToRender = <StandardGraph nodes={nodes} selectedNode={selectedNode} setSelectedNode={setSelectedNode} reasoning_functions={reasoning_functions}/>;
            break
        case 'KeywordGraph':
            componentToRender = <KeywordGraph nodes={nodes} setNodes={setNodes}/>;
            break;
        case 'SimilarityGraph':
            componentToRender = <SimilarityGraph />;
            break;
    }

    return(
        <div className="flex flex-col bg-stone-200 h-full">
            <div className="justify-start w-min border-b-2 border-r-2 border-zinc-600 bg-zinc-400 rounded-br">
                <label className="text-xs px-2">{content}</label>    
            </div>
            { componentToRender }
        </div>
    );
}