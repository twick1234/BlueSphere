import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Layout from '../components/Layout'

export default function MyApp({ Component, pageProps }: AppProps) {
  // @ts-ignore - MDX pages also render as components here
  return <Layout><Component {...pageProps} /></Layout>
}
