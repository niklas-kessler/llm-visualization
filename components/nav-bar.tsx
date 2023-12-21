interface NavbarProps {
    onSingleViewClick: () => void;
    onMultiViewClick: () => void;
    onHistoryClick: () => void;
    onWindowClick: (windowName: string) => void;
    onWindowSwapClick: () => void;
    showHistory: boolean;
    isMultiView: boolean;
    activeWindows: string[];
  }

export default function NavBar({ onSingleViewClick, onMultiViewClick, onWindowClick, onWindowSwapClick, onHistoryClick, showHistory, isMultiView, activeWindows}: NavbarProps) {
    return(
        <nav className="flex justify-between p-4 bg-stone-300">
            <button className="h-9 mt-[1.48rem] rounded-md px-2 border-2 border-black bg-gray-400">
                <span>Settings</span>
            </button>
            <div className="flex flex-col">
                <label className="text-center">WindowSelect</label>
                <div className="flex">
                    <button className={`py-1 px-2 rounded-l-md border-2 border-black ${showHistory? 'bg-gray-600' : 'bg-gray-400'}`} onClick={onHistoryClick}>
                        H
                    </button>
                    <div className='w-2 border-2 border-black bg-gray-400'></div>
                    <button className={`py-1 px-2 border-2  border-black ${activeWindows.includes("Chat")? 'bg-gray-600' : 'bg-gray-400'}`} onClick={() => onWindowClick("Chat")}>
                        W1
                    </button>
                    <button className={`py-1 px-2 border-2  border-black ${activeWindows.includes("StandardGraph")? 'bg-gray-600' : 'bg-gray-400'}`} onClick={() => onWindowClick("StandardGraph")}>
                        W2
                    </button>
                    <button className={`py-1 px-2 border-2  border-black ${activeWindows.includes("KeywordGraph")? 'bg-gray-600' : 'bg-gray-400'}`} onClick={() => onWindowClick("KeywordGraph")}>
                        W3
                    </button>
                    <button className={`py-1 px-2 border-2 rounded-r-md border-black ${activeWindows.includes("SimilarityGraph")? 'bg-gray-600' : 'bg-gray-400'} `} onClick={() => onWindowClick("SimilarityGraph")}>
                        W4
                    </button>
                    <span className="pl-2 self-center">({activeWindows.length.toString()}/{isMultiView? 2:1})</span>
                    {activeWindows.length > 1 && (
                        <button onClick={onWindowSwapClick} className={"pl-6"}><img src="swap_icon.png" alt="switch" className=" w-5 h-auto"/></button>
                    )}
                </div>
            </div>
            <div className="flex flex-col">
                <label>ViewSelect</label>
                <div className="flex self-center">
                    <button className={`py-1 px-2 rounded-l-md border-2 border-black ${!isMultiView? 'bg-gray-600' : 'bg-gray-400'}`} onClick={onSingleViewClick}>
                        SV
                    </button>
                    <button className={`py-1 px-2 border-2 rounded-r-md border-black ${isMultiView? 'bg-gray-600' : 'bg-gray-400'}`} onClick={onMultiViewClick}>
                        MV
                    </button>
                </div>
            </div>
            
        </nav>
    );
}