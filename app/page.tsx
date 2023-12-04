import Image from 'next/image'
import Settings from '@/components/settings'
import AppWindow from '@/components/app-window'
import NavBar from '@/components/nav-bar'

export default function Home() {
  return (
    <main className="container">
      <section>
        <NavBar />
        <AppWindow />
      </section>
    </main>
  )
}
