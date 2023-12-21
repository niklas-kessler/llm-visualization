import Window from "./window";
import History from "./history";

interface AppWindowProps {
    showHistory: boolean;
    activeWindows: string[];
}

export default function AppWindow({ showHistory, activeWindows }: AppWindowProps) {
    return(
        <main className="flex-1 overflow-hidden">
            <div className="h-full flex">
                {showHistory && (
                    <div className=" basis-1/6 border-r-2 bg-stone-200 border-zinc-400">
                        <History />
                    </div>
                )}
                <div className="flex-1">
                    <Window content={activeWindows[0]}/>
                </div>
                {activeWindows[1] && (
                    <div className="flex-1 border-l-2 border-zinc-400">
                        <Window content={activeWindows[1]}/>
                    </div>
                )}
            </div>
        </main>
    );
}