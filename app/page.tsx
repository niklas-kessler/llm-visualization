"use client"
import { useState } from 'react'
import AppWindow from '@/components/app-window'
import NavBar from '@/components/nav-bar'


export default function Home() {
  
  const [showHistory, setShowHistory] = useState(false);
  const [isMultiView, setMultiView] = useState(true);
  const [activeWindows, setActiveWindows]= useState<string[]>(["Chat", "StandardGraph"]);

  const handleSingleViewClick = () => {
    setMultiView(false);
    setActiveWindows((prevActiveWindows) => [prevActiveWindows[0]]);
  }

  const handleMultiViewClick = () => setMultiView(true);

  const handleHistoryClick = () => setShowHistory(!showHistory);

  const handleWindowClick = (windowName: string) => {
    
    // In Multi-View activate/deactivate windows
    if(isMultiView) {
      setActiveWindows((prevActiveWindows) => {
        
        const nWindows = prevActiveWindows.length
        const activated = prevActiveWindows.includes(windowName)

        // if (2/2) & already activated: Deactivate
        if (nWindows > 1 && activated) {
          return prevActiveWindows.filter((w) => w !== windowName);
        } 

        // if (1/2) & not activated yet: Activate
        else if (nWindows < 2 && !activated) {
          return [...prevActiveWindows, windowName];
        } 
        
        // Don't change anything
        else {
          return prevActiveWindows
        }
      });
    } 
    
    // In Single-View switch between windows
    else {
      setActiveWindows([windowName])
    }
  }

  const handleWindowSwapClick = () => {
    setActiveWindows((prevActiveWindows) => {
      if (prevActiveWindows.length > 1) {
        return [prevActiveWindows[1], prevActiveWindows[0]];
      } else {
        return [...prevActiveWindows];
      }
    })
  }

  return (
    <div className="h-screen flex flex-col">
        <NavBar onSingleViewClick={handleSingleViewClick} onMultiViewClick={handleMultiViewClick} onHistoryClick={handleHistoryClick} onWindowClick={handleWindowClick} onWindowSwapClick={handleWindowSwapClick} showHistory={showHistory} isMultiView={isMultiView} activeWindows={activeWindows}/>
        <AppWindow showHistory={showHistory} activeWindows={activeWindows}/>
    </div>
  )
}
