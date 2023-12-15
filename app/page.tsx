import AppWindow from '@/components/app-window'
import NavBar from '@/components/nav-bar'

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
        <NavBar />
        <AppWindow />
    </div>
  )
}
