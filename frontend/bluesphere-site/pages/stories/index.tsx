/*
 * BlueSphere Stories Page
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Educational storytelling hub for ocean conservation and marine science
 */

import React from 'react';
import WorldClassLayout from '../../components/WorldClassLayout';
import StorytellingContent from '../../components/StorytellingContent';
import Link from 'next/link';
import { listStorySlugs, getStory } from '../../lib/content';

export default function Stories({ items }: { items: { slug: string; title: string }[] }) {
  return (
    <WorldClassLayout title="Ocean Stories - Educational Content | BlueSphere">
      <StorytellingContent />

      {/* Legacy stories section if needed */}
      {items && items.length > 0 && (
        <div className="bs-section mt-16 pt-16 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="bs-heading-2 mb-8 text-center">Additional Stories</h2>
            <div className="bs-grid bs-grid-2">
              {items.map(item => (
                <Link key={item.slug} href={`/stories/${item.slug}`} className="bs-premium-card p-6 hover:scale-105 transition-transform">
                  <h3 className="bs-heading-3">{item.title}</h3>
                  <div className="text-blue-600 font-medium mt-4">Read More →</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </WorldClassLayout>
  );
}

export async function getStaticProps() {
  const slugs = listStorySlugs();
  const items = await Promise.all(slugs.map(async s => {
    const p = await getStory(s);
    return { slug: s, title: p.title };
  }));
  return { props: { items } };
}