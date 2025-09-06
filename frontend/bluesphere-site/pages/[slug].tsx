// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import Layout from '../components/Layout'
import { getPage, listSlugs } from '../lib/content'

export default function Page({ html, title }:{ html:string, title:string }){
  return <Layout title={title}><div dangerouslySetInnerHTML={{__html: html}} /></Layout>
}

export async function getStaticPaths(){
  const slugs = listSlugs().filter(s => s !== 'index')
  return { paths: slugs.map(s => ({ params: { slug: s }})), fallback: false }
}

export async function getStaticProps({ params }:{ params: { slug: string } }){
  const p = await getPage(params.slug)
  return { props: { html: p.html, title: p.title } }
}
