// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import WorldClassLayout from '../../components/WorldClassLayout'
import { getStory, listStorySlugs } from '../../lib/content'

export default function Story({ title, html }:{ title:string, html:string }){
  return <WorldClassLayout title={title}>
    <div dangerouslySetInnerHTML={{__html: html}} />
  </WorldClassLayout>
}

export async function getStaticPaths(){
  const slugs = listStorySlugs()
  return { paths: slugs.map(s => ({ params: { slug: s }})), fallback: false }
}

export async function getStaticProps({ params }:{ params: { slug: string } }){
  const s = await getStory(params.slug)
  return { props: { title: s.title, html: s.html } }
}
