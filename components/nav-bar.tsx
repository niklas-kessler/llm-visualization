"use client"

import { useState } from "react";

export default function NavBar() {
    
    const showHistory = false;
    const selectedWindow = {
        "Chat": true,
        "StandardGraph": false,
        "KeywordGraph": false,
        "SimilarityGraph": false,
    };
    const multiView = false;
    const maxNWindow = () => multiView? 2:1;

    return(
    <nav className="flex justify-between p-4 bg-gray-200">
        <div className="flex flex-col justify-between">
            <div className="flex"></div>
            <button className="flex self-center h-9 py-1 px-2 rounded-md border-2 border-black bg-gray-400">
                <span className="self-center">Settings</span>
            </button>
        </div>
        <div className="flex flex-col justify-between">
            <label className="text-center">WindowSelect</label>
            <div className="flex">
                <button className={`py-1 px-2 rounded-l-md border-2 border-black ${showHistory? 'bg-gray-600' : 'bg-gray-400'}`}>
                    H
                </button>
                <div className='w-2 border-2 border-black bg-gray-400'></div>
                <button className={`py-1 px-2 border-2  border-black ${selectedWindow["Chat"]? 'bg-gray-600' : 'bg-gray-400'}`}>
                    W1
                </button>
                <button className={`py-1 px-2 border-2  border-black ${selectedWindow["StandardGraph"]? 'bg-gray-600' : 'bg-gray-400'}`}>
                    W2
                </button>
                <button className={`py-1 px-2 border-2  border-black ${selectedWindow["KeywordGraph"]? 'bg-gray-600' : 'bg-gray-400'}`}>
                    W3
                </button>
                <button className={`py-1 px-2 border-2 rounded-r-md border-black ${selectedWindow["SimilarityGraph"]? 'bg-gray-600' : 'bg-gray-400'} `}>
                    W4
                </button>
                <span className="self-center pl-2">(1/2)</span>
            </div>
        </div>
        <div className="flex flex-col justify-between">
            <label className="text-center">ViewSelect</label>
            <div className="flex">
                <button className={`py-1 px-2 rounded-l-md border-2 border-black ${!multiView? 'bg-gray-600' : 'bg-gray-400'}`}>
                    SV
                </button>
                <button className={`py-1 px-2 border-2 rounded-r-md border-black ${multiView? 'bg-gray-600' : 'bg-gray-400'}`}>
                    MV
                </button>
            </div>
        </div>
        
    </nav>
    );
}