// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import Layout from '../../components/Layout'
import Link from 'next/link'
import { listStorySlugs, getStory } from '../../lib/content'

export default function Stories({ items }:{ items: { slug:string, title:string }[] }){
  return <Layout title="Stories">
    <h1>Stories</h1>
    <p>Long-form explainers that connect ocean science to everyday life.</p>
    <ul>
      {items.map(it => <li key={it.slug}><Link href={`/stories/${it.slug}`}>{it.title}</Link></li>)}
    </ul>
  </Layout>
}

export async function getStaticProps(){
  const slugs = listStorySlugs()
  const items = await Promise.all(slugs.map(async s => {
    const p = await getStory(s)
    return { slug: s, title: p.title }
  }))
  return { props: { items } }
}
