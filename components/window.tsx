import Chat from './chat';
import StandardGraph from './standard-graph';
import KeywordGraph from './keyword-graph';
import SimilarityGraph from './similarity-graph';
import { MessageType } from '@/app/utils/types';

interface WindowProps {
    content: string,
    messages: MessageType[],
    appendMessage: (message: MessageType[]) => void;
}

export default function Window({content, messages, appendMessage}: WindowProps) {
    let componentToRender;
    
    switch(content){
        case "Chat":
            componentToRender = <Chat messages={messages} appendMessage={appendMessage}/>;
            break;
        case "StandardGraph":
            componentToRender = <StandardGraph />;
            break
        case 'KeywordGraph':
            componentToRender = <KeywordGraph />;
            break;
        case 'SimilarityGraph':
            componentToRender = <SimilarityGraph />;
            break;
    }

    return(
        <div className="flex flex-col bg-stone-200 h-full p-1">
            <div className="justify-start w-min p-2 border-b-2 border-r-2 border-zinc-600 bg-zinc-400 rounded-br">
                <label className="py-1 px-2">{content}</label>    
            </div>
            { componentToRender }
        </div>
    );
}