import Settings from "./settings";
import Window from "./window";
import History from "./history";
import clsx from "clsx";

export default function AppWindow() {
    
    /**const showHistory = true;
    let historyComp = showHistory? (
        <article className="bg-blue-100">
            <p>History</p>
            <History />
        </article>
    ): null;*/

    const showHistory = true;

    return(
        <div className="flex-grow flex">
            {showHistory && (<div className="p-4 border">
                <History />
            </div>)}
            <div className="flex-1 p-4 border">
                <Window content="Chat"/>
            </div>
            <div className="flex-1 p-4 border">
                <Window content="SimilarityGraph"/>
            </div>
        </div>
    );
}