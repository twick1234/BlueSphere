// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import Layout from '../components/Layout'
import { getPage } from '../lib/content'

export default function Home({ html }: { html: string }){
  return <Layout title="Home">
    <div dangerouslySetInnerHTML={{__html: html}} />
  </Layout>
}

export async function getStaticProps(){
  const page = await getPage('index')
  return { props: { html: page.html } }
}
