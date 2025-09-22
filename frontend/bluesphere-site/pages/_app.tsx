import type { AppProps } from 'next/app'
import '../styles/globals.css'
import '../styles/premium-theme.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
