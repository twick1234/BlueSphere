/*
 * BlueSphere Educational Storytelling Content
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Interactive educational stories about marine life and ocean conservation
 */

import React, { useState, useEffect } from 'react';
import { performanceCache } from '../lib/performance';

interface Story {
  id: string;
  title: string;
  subtitle: string;
  category: 'marine-life' | 'climate' | 'conservation' | 'exploration';
  readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: StorySection[];
  callToAction: {
    text: string;
    action: string;
    link?: string;
  };
  relatedData?: {
    species?: string;
    location?: { lat: number; lon: number; name: string };
    temperature?: number;
    depth?: number;
  };
}

interface StorySection {
  type: 'text' | 'image' | 'data-viz' | 'interactive' | 'quote';
  content: string;
  metadata?: {
    source?: string;
    imageAlt?: string;
    interactive?: boolean;
  };
}

interface StorytellingContentProps {
  selectedCategory?: string;
  maxStories?: number;
}

const stories: Story[] = [
  {
    id: 'mary-lee-journey',
    title: 'Mary Lee: The Ocean\'s Most Famous Great White',
    subtitle: 'Following a 4.8-meter shark across 40,000 kilometers of ocean',
    category: 'marine-life',
    readingTime: 8,
    difficulty: 'beginner',
    content: [
      {
        type: 'text',
        content: 'In September 2012, off the coast of Cape Cod, marine biologist Dr. Chris Fischer and his team had an extraordinary encounter. They tagged a massive female great white shark, weighing over 1,600 kilograms and stretching 4.8 meters in length. They named her Mary Lee, after Fischer\'s mother.'
      },
      {
        type: 'image',
        content: '/images/stories/mary-lee-tagging.jpg',
        metadata: {
          imageAlt: 'Mary Lee being tagged by OCEARCH researchers',
          source: 'OCEARCH'
        }
      },
      {
        type: 'text',
        content: 'What happened next revolutionized our understanding of great white migration patterns. Mary Lee\'s satellite tag began transmitting her location every time her dorsal fin broke the surface for more than 90 seconds. Over the next several years, she would travel an incredible 40,000+ kilometers, from the frigid waters of Nova Scotia to the warm currents off Jacksonville, Florida.'
      },
      {
        type: 'data-viz',
        content: 'Interactive map showing Mary Lee\'s migration route with temperature data',
        metadata: {
          interactive: true
        }
      },
      {
        type: 'quote',
        content: '"Mary Lee taught us that great whites are not just coastal predators, but true ocean wanderers. Her journey revealed the critical importance of protecting entire ocean basins, not just local waters."',
        metadata: {
          source: 'Dr. Chris Fischer, OCEARCH Founder'
        }
      },
      {
        type: 'text',
        content: 'But Mary Lee\'s story is more than just impressive numbers. Her pings revealed something profound: great white sharks are following the changing ocean. As water temperatures rise due to climate change, Mary Lee and her kind are adjusting their migration patterns, moving further north and staying longer in traditionally cooler waters.'
      }
    ],
    callToAction: {
      text: 'Track active sharks in real-time',
      action: 'View Live Shark Tracker',
      link: '/map?layer=sharks'
    },
    relatedData: {
      species: 'Carcharodon carcharias',
      location: { lat: 33.6891, lon: -78.8867, name: 'Off Cape Fear, North Carolina' },
      temperature: 24.5
    }
  },
  {
    id: 'coral-bleaching-crisis',
    title: 'When Coral Gardens Turn to Ghost Towns',
    subtitle: 'The 2016 Great Barrier Reef bleaching event and the fight for recovery',
    category: 'climate',
    readingTime: 12,
    difficulty: 'intermediate',
    content: [
      {
        type: 'text',
        content: 'Imagine diving into what should be one of Earth\'s most colorful ecosystems, only to find yourself surrounded by white, skeletal remains. This was the heartbreaking reality that marine biologist Dr. Terry Hughes faced in March 2016 when he flew over the Great Barrier Reef.'
      },
      {
        type: 'quote',
        content: '"I showed the results to my students and then we wept. Seriously, we wept. It was the saddest day of my career."',
        metadata: {
          source: 'Dr. Terry Hughes, ARC Centre of Excellence for Coral Reef Studies'
        }
      },
      {
        type: 'text',
        content: 'The 2016 marine heatwave was unlike anything recorded before. Ocean temperatures soared 2-4°C above normal for months. Coral polyps, stressed beyond their limits, expelled the colorful algae that live within their tissues and provide them with food. Without these algae, the corals turned white – they had bleached.'
      },
      {
        type: 'data-viz',
        content: 'Temperature anomaly visualization showing the 2016 heatwave progression',
        metadata: {
          interactive: true
        }
      },
      {
        type: 'text',
        content: 'But here\'s what makes this story remarkable: coral reefs have been bleaching for millions of years. It\'s a survival mechanism. When conditions improve, the algae can return, and the coral recovers. The tragedy of 2016 wasn\'t just the bleaching – it was the speed and scale, driven by rapidly changing ocean conditions.'
      },
      {
        type: 'image',
        content: '/images/stories/coral-before-after.jpg',
        metadata: {
          imageAlt: 'Before and after comparison of coral reef bleaching',
          source: 'AIMS Long-term Monitoring Program'
        }
      },
      {
        type: 'text',
        content: 'Today, marine scientists like Dr. Ruth Gates are working on "super corals" – breeding corals that can withstand higher temperatures. Meanwhile, others focus on reducing local stressors like pollution and overfishing to give reefs the best chance of survival. The race is on to help coral reefs adapt to our changing oceans.'
      }
    ],
    callToAction: {
      text: 'Monitor coral reef health',
      action: 'View Coral Monitoring Dashboard',
      link: '/coral'
    },
    relatedData: {
      location: { lat: -16.2839, lon: 145.7781, name: 'Great Barrier Reef, Australia' },
      temperature: 29.2
    }
  },
  {
    id: 'blue-whale-comeback',
    title: 'The Largest Animal Ever: A Conservation Success Story',
    subtitle: 'How blue whales returned from the brink of extinction',
    category: 'conservation',
    readingTime: 10,
    difficulty: 'beginner',
    content: [
      {
        type: 'text',
        content: 'At up to 30 meters long and weighing as much as 200 tons, blue whales are the largest animals ever known to have lived on Earth – bigger than any dinosaur. Yet by the 1960s, there were fewer than 5,000 left in the entire world. Industrial whaling had brought these ocean giants to the very edge of extinction.'
      },
      {
        type: 'image',
        content: '/images/stories/blue-whale-scale.jpg',
        metadata: {
          imageAlt: 'Blue whale size comparison with human diver',
          source: 'NOAA Fisheries'
        }
      },
      {
        type: 'text',
        content: 'The story of blue whale recovery began in 1966 when the International Whaling Commission finally banned commercial blue whale hunting. But protection alone wasn\'t enough. Marine biologist Dr. John Calambokidis began photographing blue whales off California in the 1980s, discovering that each whale has unique markings – like fingerprints.'
      },
      {
        type: 'quote',
        content: '"Every whale tells a story. Through photo identification, we can follow individual whales for decades, learning about their migration patterns, feeding habits, and family relationships."',
        metadata: {
          source: 'Dr. John Calambokidis, Cascadia Research Collective'
        }
      },
      {
        type: 'data-viz',
        content: 'Blue whale population recovery timeline with key conservation milestones',
        metadata: {
          interactive: true
        }
      },
      {
        type: 'text',
        content: 'Today, blue whale populations are slowly recovering. The eastern North Pacific population has grown to an estimated 5,000-12,000 individuals. Scientists use satellite tags, underwater microphones, and even drones to study these gentle giants without disturbing them.'
      },
      {
        type: 'text',
        content: 'But new challenges emerge. Climate change is shifting the distribution of krill – tiny shrimp-like creatures that blue whales depend on. Ship strikes and ocean noise pollution pose ongoing threats. The blue whale\'s recovery reminds us that conservation is not a destination, but a continuous journey.'
      }
    ],
    callToAction: {
      text: 'Track marine mammal migrations',
      action: 'View Migration Patterns',
      link: '/migration'
    },
    relatedData: {
      species: 'Balaenoptera musculus',
      location: { lat: 36.7783, lon: -119.4179, name: 'Monterey Bay, California' }
    }
  },
  {
    id: 'kelp-forest-carbon',
    title: 'Underwater Forests: The Ocean\'s Hidden Climate Heroes',
    subtitle: 'How kelp forests capture carbon and support marine ecosystems',
    category: 'climate',
    readingTime: 9,
    difficulty: 'intermediate',
    content: [
      {
        type: 'text',
        content: 'Diving into a kelp forest is like entering an underwater cathedral. Giant kelp (Macrocystis pyrifera) can grow up to 60 cm per day, creating towering underwater forests that stretch from the seafloor to the surface. But these aren\'t just beautiful ecosystems – they\'re powerful climate allies.'
      },
      {
        type: 'image',
        content: '/images/stories/kelp-forest-diver.jpg',
        metadata: {
          imageAlt: 'Scuba diver swimming through giant kelp forest',
          source: 'Monterey Bay Aquarium'
        }
      },
      {
        type: 'text',
        content: 'Dr. Kristen Davis, a marine biologist at UC Irvine, discovered that kelp forests are carbon capture powerhouses. A single kelp forest can absorb as much carbon dioxide as a terrestrial forest of similar size. As kelp dies and breaks away, some of this carbon sinks to the deep ocean, where it can remain stored for centuries.'
      },
      {
        type: 'data-viz',
        content: 'Carbon cycle diagram showing kelp forest carbon sequestration',
        metadata: {
          interactive: true
        }
      },
      {
        type: 'quote',
        content: '"Kelp forests represent one of the most productive ecosystems on Earth. They rival tropical rainforests in their ability to support biodiversity and sequester carbon."',
        metadata: {
          source: 'Dr. Kristen Davis, UC Irvine'
        }
      },
      {
        type: 'text',
        content: 'But kelp forests face mounting pressures. Rising ocean temperatures, pollution, and outbreaks of sea urchins – whose populations have exploded due to the decline of their predators – have decimated many kelp forests. Off the coast of Northern California, more than 90% of kelp forests have disappeared since 2014.'
      },
      {
        type: 'text',
        content: 'Conservation efforts now focus on restoring the balance. Marine protected areas allow sea otter populations to recover – these playful mammals are voracious sea urchin predators. Aquaculture projects are experimenting with kelp farming, which could provide sustainable food while capturing carbon.'
      }
    ],
    callToAction: {
      text: 'Explore ocean health metrics',
      action: 'View Ocean Health Dashboard',
      link: '/health'
    },
    relatedData: {
      species: 'Macrocystis pyrifera',
      location: { lat: 36.6002, lon: -121.9000, name: 'Monterey Bay, California' },
      depth: 20
    }
  },
  {
    id: 'deep-sea-exploration',
    title: 'The Last Frontier: Exploring Earth\'s Deep Ocean',
    subtitle: 'Discovering new species in the planet\'s least explored realm',
    category: 'exploration',
    readingTime: 11,
    difficulty: 'advanced',
    content: [
      {
        type: 'text',
        content: 'We have better maps of Mars than we do of our own ocean floor. Less than 20% of the ocean has been mapped, and less than 5% explored. Every deep-sea expedition reveals new species, new ecosystems, and new mysteries. Dr. Robert Ballard, who discovered the Titanic, calls the deep ocean "the world\'s last frontier."'
      },
      {
        type: 'quote',
        content: '"There are more artifacts of human history in the deep sea than in all the world\'s museums combined. And there are more species down there than in all the world\'s rainforests."',
        metadata: {
          source: 'Dr. Robert Ballard, Ocean Explorer'
        }
      },
      {
        type: 'image',
        content: '/images/stories/deep-sea-submersible.jpg',
        metadata: {
          imageAlt: 'Deep-sea submersible exploring the ocean floor',
          source: 'Woods Hole Oceanographic Institution'
        }
      },
      {
        type: 'text',
        content: 'In 2019, marine biologist Dr. Alan Jamieson made an extraordinary discovery in the Mariana Trench – the deepest part of Earth\'s oceans. At depths exceeding 11,000 meters, where the pressure is more than 1,000 times greater than at sea level, he found thriving communities of xenophyophores – single-celled organisms the size of dinner plates.'
      },
      {
        type: 'data-viz',
        content: 'Ocean depth comparison with pressure and temperature data',
        metadata: {
          interactive: true
        }
      },
      {
        type: 'text',
        content: 'But perhaps the most remarkable discovery came from Dr. Sylvia Earle\'s Mission Blue expeditions: bioluminescent creatures that create their own light in the perpetual darkness. From vampire squid with bioluminescent "burglar alarms" to deep-sea jellyfish that pulse like living galaxies, these creatures have evolved extraordinary adaptations.'
      },
      {
        type: 'text',
        content: 'These discoveries aren\'t just scientifically fascinating – they\'re potentially life-saving. Many deep-sea organisms produce unique compounds that show promise for treating cancer, Alzheimer\'s disease, and other conditions. The deep ocean may hold keys to humanity\'s future health and sustainability.'
      },
      {
        type: 'text',
        content: 'Yet this frontier faces unprecedented threats. Deep-sea mining operations threaten to destroy ecosystems before we\'ve even discovered them. Climate change is altering deep-ocean currents and chemistry. The race is on to explore and understand the deep sea before it\'s too late.'
      }
    ],
    callToAction: {
      text: 'Explore ocean data and discoveries',
      action: 'View Real-time Ocean Analytics',
      link: '/analytics'
    },
    relatedData: {
      location: { lat: 11.3733, lon: 142.5917, name: 'Challenger Deep, Mariana Trench' },
      depth: 10994,
      temperature: 1.0
    }
  }
];

const StorytellingContent: React.FC<StorytellingContentProps> = ({
  selectedCategory,
  maxStories = 5
}) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [userPreferences, setUserPreferences] = useState({
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    category: 'all' as string
  });

  useEffect(() => {
    // Filter stories based on category and user preferences
    let filtered = stories;

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(story => story.category === selectedCategory);
    }

    if (userPreferences.category !== 'all') {
      filtered = filtered.filter(story => story.category === userPreferences.category);
    }

    // Sort by reading time and difficulty preference
    filtered = filtered.sort((a, b) => {
      if (a.difficulty === userPreferences.difficulty) return -1;
      if (b.difficulty === userPreferences.difficulty) return 1;
      return a.readingTime - b.readingTime;
    });

    setFilteredStories(filtered.slice(0, maxStories));
  }, [selectedCategory, userPreferences, maxStories]);

  const handleStorySelect = (story: Story) => {
    setCurrentStory(story);
    setReadingProgress(0);

    // Cache story for performance
    performanceCache.set(`story_${story.id}`, story, 60); // Cache for 1 hour
  };

  const renderStorySection = (section: StorySection, index: number) => {
    switch (section.type) {
      case 'text':
        return (
          <div key={index} className="bs-text-body mb-6 leading-relaxed">
            {section.content}
          </div>
        );

      case 'quote':
        return (
          <blockquote key={index} className="bs-premium-card p-6 mb-6 border-l-4 border-blue-500">
            <div className="text-lg italic text-gray-700 mb-3">
              "{section.content}"
            </div>
            {section.metadata?.source && (
              <cite className="bs-text-small text-gray-600">
                — {section.metadata.source}
              </cite>
            )}
          </blockquote>
        );

      case 'image':
        return (
          <div key={index} className="mb-6">
            <div className="bg-gray-200 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">📸</div>
              <div className="bs-text-small text-gray-600">
                {section.metadata?.imageAlt || 'Story illustration'}
              </div>
              {section.metadata?.source && (
                <div className="bs-text-small text-gray-500 mt-2">
                  Source: {section.metadata.source}
                </div>
              )}
            </div>
          </div>
        );

      case 'data-viz':
        return (
          <div key={index} className="bs-premium-card p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="bs-text-body text-gray-700 mb-3">
                {section.content}
              </div>
              {section.metadata?.interactive && (
                <button className="bs-btn-primary mt-4">
                  Explore Interactive Visualization
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (currentStory) {
    return (
      <div className="bs-section">
        <div className="max-w-4xl mx-auto">
          {/* Story Header */}
          <div className="mb-8">
            <button
              onClick={() => setCurrentStory(null)}
              className="bs-btn-secondary mb-6"
            >
              ← Back to Stories
            </button>

            <div className="bs-premium-card p-8">
              <div className="flex items-center gap-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStory.category === 'marine-life' ? 'bg-blue-100 text-blue-800' :
                  currentStory.category === 'climate' ? 'bg-red-100 text-red-800' :
                  currentStory.category === 'conservation' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {currentStory.category.replace('-', ' ')}
                </span>
                <span className="bs-text-small text-gray-600">
                  {currentStory.readingTime} min read
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  currentStory.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  currentStory.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentStory.difficulty}
                </span>
              </div>

              <h1 className="bs-heading-1 mb-4">{currentStory.title}</h1>
              <p className="bs-text-body text-gray-600 text-lg">{currentStory.subtitle}</p>
            </div>
          </div>

          {/* Story Content */}
          <div className="prose prose-lg max-w-none">
            {currentStory.content.map((section, index) =>
              renderStorySection(section, index)
            )}
          </div>

          {/* Call to Action */}
          <div className="bs-premium-card p-8 mt-12 text-center">
            <h3 className="bs-heading-3 mb-4">Ready to Explore?</h3>
            <p className="bs-text-body mb-6">{currentStory.callToAction.text}</p>
            {currentStory.callToAction.link ? (
              <a href={currentStory.callToAction.link} className="bs-btn-primary">
                {currentStory.callToAction.action}
              </a>
            ) : (
              <button className="bs-btn-primary">
                {currentStory.callToAction.action}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bs-section">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="bs-heading-1 mb-4">Ocean Stories</h1>
          <p className="bs-text-body text-gray-600 max-w-2xl mx-auto">
            Discover the fascinating world beneath the waves through compelling stories
            of marine life, climate change, conservation successes, and scientific exploration.
          </p>
        </div>

        {/* Filters */}
        <div className="bs-premium-card p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <select
              value={userPreferences.category}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="marine-life">Marine Life</option>
              <option value="climate">Climate Change</option>
              <option value="conservation">Conservation</option>
              <option value="exploration">Exploration</option>
            </select>

            <select
              value={userPreferences.difficulty}
              onChange={(e) => setUserPreferences(prev => ({
                ...prev,
                difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
              }))}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner Friendly</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Story Grid */}
        <div className="bs-grid bs-grid-auto">
          {filteredStories.map((story) => (
            <div
              key={story.id}
              className="bs-premium-card p-6 cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => handleStorySelect(story)}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  story.category === 'marine-life' ? 'bg-blue-100 text-blue-800' :
                  story.category === 'climate' ? 'bg-red-100 text-red-800' :
                  story.category === 'conservation' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {story.category.replace('-', ' ')}
                </span>
                <span className="bs-text-small text-gray-600">
                  {story.readingTime} min
                </span>
              </div>

              <h3 className="bs-heading-3 mb-3">{story.title}</h3>
              <p className="bs-text-body text-gray-600 mb-4 line-clamp-3">
                {story.subtitle}
              </p>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  story.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  story.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {story.difficulty}
                </span>
                <div className="text-blue-600 font-medium">Read Story →</div>
              </div>

              {story.relatedData?.location && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="bs-text-small text-gray-500">
                    📍 {story.relatedData.location.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌊</div>
            <h3 className="bs-heading-3 mb-2">No stories found</h3>
            <p className="bs-text-body text-gray-600">
              Try adjusting your filters to discover more ocean stories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorytellingContent;