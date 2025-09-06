// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const contentDir = path.join(process.cwd(), '..', '..', 'website')

export type PageItem = {
  slug: string;
  title: string;
  descriptor?: string;
  html: string;
}

export function listSlugs(): string[] {
  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
}

export async function getPage(slug: string): Promise<PageItem> {
  const file = path.join(contentDir, slug + '.md')
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  const processed = await remark().use(html).process(content)
  return {
    slug,
    title: (data && (data as any).title) || slug,
    descriptor: (data && (data as any).descriptor) || '',
    html: processed.toString()
  }
}


export function listStorySlugs(): string[] {
  const dir = path.join(contentDir, 'stories')
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
}

export async function getStory(slug: string): Promise<PageItem> {
  const file = path.join(contentDir, 'stories', slug + '.md')
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  const processed = await remark().use(html).process(content)
  return {
    slug,
    title: (data && (data as any).title) || slug,
    descriptor: (data && (data as any).descriptor) || '',
    html: processed.toString()
  }
}
