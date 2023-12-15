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
        <main className="flex-1 overflow-hidden">
            <div className="h-full flex">
                {showHistory && (<div className=" basis-1/6 border-r-2 bg-stone-200 border-zinc-400">
                    <History />
                </div>)}
                <div className="flex-1">
                    <Window content="Chat"/>
                </div>
                <div className="flex-1 border-l-2 border-zinc-400">
                    <Window content="SimilarityGraph"/>
                </div>
            </div>
        </main>
    );
}