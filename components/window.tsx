import Chat from './chat';
import StandardGraph from './standard-graph';
import KeywordGraph from './keyword-graph';
import SimilarityGraph from './similarity-graph';
import clsx from 'clsx';

export default function Window({content}: {content:string}) {
    let componentToRender;
    
    switch(content){
        case "Chat":
            componentToRender = <Chat />;
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
        <div className="flex flex-col bg-green-100 h-full">
            <div className="justify-start p-2">
                <label className="border-b border-r py-1 px-2">{content}</label>    
            </div>
            { componentToRender }
        </div>
    );
}