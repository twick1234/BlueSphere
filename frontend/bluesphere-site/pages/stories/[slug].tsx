// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import Layout from '../../components/Layout'
import { getStory, listStorySlugs } from '../../lib/content'

export default function Story({ title, html }:{ title:string, html:string }){
  return <Layout title={title}>
    <div dangerouslySetInnerHTML={{__html: html}} />
  </Layout>
}

export async function getStaticPaths(){
  const slugs = listStorySlugs()
  return { paths: slugs.map(s => ({ params: { slug: s }})), fallback: false }
}

export async function getStaticProps({ params }:{ params: { slug: string } }){
  const s = await getStory(params.slug)
  return { props: { title: s.title, html: s.html } }
}
