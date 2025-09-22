// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import React from 'react'
import WorldClassLayout from '../components/WorldClassLayout'
import { getPage, listSlugs } from '../lib/content'

export default function Page({ html, title }:{ html:string, title:string }){
  return <WorldClassLayout title={title}><div dangerouslySetInnerHTML={{__html: html}} /></WorldClassLayout>
}

export async function getStaticPaths(){
  const existingPages = ['index', 'map', 'faq', '_app', '_document', 'education', 'health', 'coral', 'migration', 'pollution', 'about', 'crisis', 'docs', 'sources', 'alerts', 'architecture', 'analytics', 'historical', 'gallery', 'conservation', 'timelapse', 'sharks']
  const slugs = listSlugs().filter(s => !existingPages.includes(s))
  return { paths: slugs.map(s => ({ params: { slug: s }})), fallback: false }
}

export async function getStaticProps({ params }:{ params: { slug: string } }){
  const p = await getPage(params.slug)
  return { props: { html: p.html, title: p.title } }
}
