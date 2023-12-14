import AppWindow from '@/components/app-window'
import NavBar from '@/components/nav-bar'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <AppWindow />
    </div>
  )
}
