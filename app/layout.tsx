import Head from 'next/head'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
//import '@picocss/pico'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Graph GPT',
  description: 'Bachelorproject by Niklas Kessler',
  
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="./globals.css" rel="stylesheet"></link>
      </Head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
