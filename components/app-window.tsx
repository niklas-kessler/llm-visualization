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

    return(
        <div className="container flex items-center">
            <div className="flex-1 p-4 border">
                <p>History</p>
                <History />
            </div>
            <div className="flex-1 p-4 border">
                <p>Window1</p>
                <Window content="Chat"/>
            </div>
            <div className="flex-1 p-4 border">
                <p>Window2</p>
                <Window content="SimilarityGraph"/>
            </div>
        </div>
    );
}