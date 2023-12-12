import Chat from './chat';
import KeywordGraph from './keyword-graph';
import SimilarityGraph from './similarity-graph';
import clsx from 'clsx';

export default function Window({content}: {content:string}) {
    let componentToRender;
    
    switch(content){
        case "Chat":
            componentToRender = <Chat />;
            break;
        case 'KeywordGraph':
            componentToRender = <KeywordGraph />;
            break;
        case 'SimilarityGraph':
            componentToRender = <SimilarityGraph />;
            break;
    }

    return(
        <div>
            { componentToRender }
        </div>       
    );
}