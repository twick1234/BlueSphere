import React, { useState, useEffect } from 'react';

interface EducationalResourceCenterProps {
  isDarkMode: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  instructor: string;
  rating: number;
  enrollments: number;
  imageUrl: string;
  tags: string[];
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: 'video' | 'reading' | 'quiz' | 'interactive';
}

interface Article {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedDate: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
}

interface WebinarData {
  id: string;
  title: string;
  description: string;
  speaker: string;
  date: string;
  time: string;
  duration: string;
  attendees: number;
  maxAttendees: number;
  status: 'upcoming' | 'live' | 'recorded';
  category: string;
}

const EducationalResourceCenter: React.FC<EducationalResourceCenterProps> = ({ isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'articles' | 'webinars' | 'interactive'>('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());

  const baseClasses = isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900';
  const cardClasses = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const buttonClasses = isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
  const inputClasses = isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900';

  const courses: Course[] = [
    {
      id: '1',
      title: 'Marine Ecosystem Fundamentals',
      description: 'Learn the basics of marine ecosystems, biodiversity, and conservation principles.',
      category: 'Conservation',
      level: 'Beginner',
      duration: '6 weeks',
      progress: 45,
      instructor: 'Dr. Sarah Chen',
      rating: 4.8,
      enrollments: 2543,
      imageUrl: '/api/placeholder/300/200',
      tags: ['ecosystems', 'biodiversity', 'conservation'],
      modules: [
        { id: '1.1', title: 'Introduction to Marine Life', duration: '45 min', completed: true, type: 'video' },
        { id: '1.2', title: 'Ocean Zones and Habitats', duration: '60 min', completed: true, type: 'interactive' },
        { id: '1.3', title: 'Marine Food Chains', duration: '30 min', completed: false, type: 'reading' },
        { id: '1.4', title: 'Assessment Quiz', duration: '20 min', completed: false, type: 'quiz' }
      ]
    },
    {
      id: '2',
      title: 'Ocean Pollution and Remediation',
      description: 'Understand various types of ocean pollution and cutting-edge cleanup technologies.',
      category: 'Pollution',
      level: 'Intermediate',
      duration: '8 weeks',
      progress: 0,
      instructor: 'Prof. Michael Torres',
      rating: 4.9,
      enrollments: 1876,
      imageUrl: '/api/placeholder/300/200',
      tags: ['pollution', 'remediation', 'technology'],
      modules: [
        { id: '2.1', title: 'Types of Ocean Pollution', duration: '50 min', completed: false, type: 'video' },
        { id: '2.2', title: 'Plastic Pollution Crisis', duration: '40 min', completed: false, type: 'reading' },
        { id: '2.3', title: 'Cleanup Technologies', duration: '70 min', completed: false, type: 'interactive' }
      ]
    },
    {
      id: '3',
      title: 'Climate Change and Ocean Acidification',
      description: 'Explore the relationship between climate change and ocean chemistry changes.',
      category: 'Climate',
      level: 'Advanced',
      duration: '10 weeks',
      progress: 15,
      instructor: 'Dr. Elena Rodriguez',
      rating: 4.7,
      enrollments: 987,
      imageUrl: '/api/placeholder/300/200',
      tags: ['climate change', 'acidification', 'chemistry'],
      modules: [
        { id: '3.1', title: 'Ocean Carbon Cycle', duration: '80 min', completed: true, type: 'video' },
        { id: '3.2', title: 'pH and Marine Life', duration: '60 min', completed: false, type: 'interactive' }
      ]
    },
    {
      id: '4',
      title: 'Marine Conservation Policy',
      description: 'Learn about international policies and regulations for ocean conservation.',
      category: 'Policy',
      level: 'Intermediate',
      duration: '5 weeks',
      progress: 0,
      instructor: 'Dr. James Wilson',
      rating: 4.6,
      enrollments: 1234,
      imageUrl: '/api/placeholder/300/200',
      tags: ['policy', 'regulation', 'international'],
      modules: [
        { id: '4.1', title: 'UNCLOS Overview', duration: '45 min', completed: false, type: 'reading' },
        { id: '4.2', title: 'Marine Protected Areas', duration: '55 min', completed: false, type: 'video' }
      ]
    }
  ];

  const articles: Article[] = [
    {
      id: 'a1',
      title: 'Breakthrough in Coral Reef Restoration Using 3D Printing',
      excerpt: 'Scientists develop innovative 3D printing techniques to accelerate coral reef restoration efforts worldwide.',
      author: 'Dr. Maria Santos',
      publishedDate: '2024-12-01',
      readTime: '8 min read',
      category: 'Research',
      tags: ['coral reefs', '3D printing', 'restoration'],
      featured: true
    },
    {
      id: 'a2',
      title: 'The Role of Phytoplankton in Carbon Sequestration',
      excerpt: 'New research reveals how microscopic marine organisms play a crucial role in global carbon cycling.',
      author: 'Prof. David Kim',
      publishedDate: '2024-11-28',
      readTime: '12 min read',
      category: 'Science',
      tags: ['phytoplankton', 'carbon', 'climate'],
      featured: false
    },
    {
      id: 'a3',
      title: 'Ocean Plastic: From Problem to Solution',
      excerpt: 'Innovative companies are turning ocean plastic waste into valuable products and materials.',
      author: 'Sarah Johnson',
      publishedDate: '2024-11-25',
      readTime: '6 min read',
      category: 'Innovation',
      tags: ['plastic', 'recycling', 'sustainability'],
      featured: true
    },
    {
      id: 'a4',
      title: 'Deep Sea Mining: Balancing Resources and Conservation',
      excerpt: 'Exploring the environmental implications and regulatory challenges of deep sea mining operations.',
      author: 'Dr. Robert Lee',
      publishedDate: '2024-11-22',
      readTime: '15 min read',
      category: 'Policy',
      tags: ['mining', 'deep sea', 'regulation'],
      featured: false
    }
  ];

  const webinars: WebinarData[] = [
    {
      id: 'w1',
      title: 'Future of Ocean Monitoring Technology',
      description: 'Join experts discussing the latest advances in satellite monitoring and autonomous underwater vehicles.',
      speaker: 'Dr. Lisa Zhang',
      date: '2024-12-15',
      time: '14:00 UTC',
      duration: '90 minutes',
      attendees: 245,
      maxAttendees: 500,
      status: 'upcoming',
      category: 'Technology'
    },
    {
      id: 'w2',
      title: 'Marine Biodiversity in the Anthropocene',
      description: 'Understanding how human activities are reshaping marine ecosystems worldwide.',
      speaker: 'Prof. Antonio Garcia',
      date: '2024-12-20',
      time: '16:00 UTC',
      duration: '60 minutes',
      attendees: 189,
      maxAttendees: 300,
      status: 'upcoming',
      category: 'Conservation'
    },
    {
      id: 'w3',
      title: 'Ocean Climate Modeling Workshop',
      description: 'Hands-on session on using climate models to predict ocean changes.',
      speaker: 'Dr. Emma Thompson',
      date: '2024-12-10',
      time: '13:00 UTC',
      duration: '120 minutes',
      attendees: 156,
      maxAttendees: 200,
      status: 'recorded',
      category: 'Climate'
    }
  ];

  const categories = ['all', 'Conservation', 'Pollution', 'Climate', 'Policy', 'Research', 'Technology'];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredWebinars = webinars.filter(webinar => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         webinar.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || webinar.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const enrollInCourse = (courseId: string) => {
    setEnrolledCourses(prev => new Set(prev).add(courseId));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  const renderProgressBar = (progress: number) => (
    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  const renderCourseCard = (course: Course) => (
    <div key={course.id} className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{course.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {course.tags.map(tag => (
              <span key={tag} className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full text-xs`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="ml-4">
          <span className={`${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full text-xs font-medium`}>
            {course.level}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
            By {course.instructor}
          </span>
          <div className="flex items-center">
            {renderStars(Math.floor(course.rating))}
            <span className="ml-1 text-sm">{course.rating}</span>
          </div>
        </div>
        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
          {course.enrollments.toLocaleString()} students
        </span>
      </div>

      {course.progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm">{course.progress}%</span>
          </div>
          {renderProgressBar(course.progress)}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
          Duration: {course.duration}
        </span>
        <button
          onClick={() => enrollInCourse(course.id)}
          disabled={enrolledCourses.has(course.id)}
          className={`${enrolledCourses.has(course.id) ? 'bg-green-600' : buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50`}
        >
          {enrolledCourses.has(course.id) ? 'Enrolled' : 'Enroll Now'}
        </button>
      </div>
    </div>
  );

  const renderArticleCard = (article: Article) => (
    <div key={article.id} className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      {article.featured && (
        <div className="mb-3">
          <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Featured
          </span>
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{article.excerpt}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {article.tags.map(tag => (
          <span key={tag} className={`${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full text-xs`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
          <span>{article.author}</span>
          <span className="mx-2">•</span>
          <span>{new Date(article.publishedDate).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{article.readTime}</span>
        </div>
        <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}>
          Read Article
        </button>
      </div>
    </div>
  );

  const renderWebinarCard = (webinar: WebinarData) => (
    <div key={webinar.id} className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{webinar.title}</h3>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>{webinar.description}</p>
        </div>
        <span className={`${
          webinar.status === 'live' ? 'bg-red-500' : 
          webinar.status === 'upcoming' ? 'bg-green-500' : 'bg-gray-500'
        } text-white px-2 py-1 rounded-full text-xs font-medium uppercase`}>
          {webinar.status}
        </span>
      </div>

      <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm space-y-1 mb-4`}>
        <div>Speaker: {webinar.speaker}</div>
        <div>Date: {new Date(webinar.date).toLocaleDateString()} at {webinar.time}</div>
        <div>Duration: {webinar.duration}</div>
        <div>Attendees: {webinar.attendees}/{webinar.maxAttendees}</div>
      </div>

      <button 
        className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}
        disabled={webinar.status === 'live' && webinar.attendees >= webinar.maxAttendees}
      >
        {webinar.status === 'upcoming' ? 'Register' : 
         webinar.status === 'live' ? 'Join Now' : 'Watch Recording'}
      </button>
    </div>
  );

  return (
    <div className={`${baseClasses} min-h-screen p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Educational Resource Center</h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Comprehensive learning platform for ocean science, conservation, and marine research
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          {[
            { id: 'courses', label: 'Courses', icon: '📚' },
            { id: 'articles', label: 'Articles', icon: '📄' },
            { id: 'webinars', label: 'Webinars', icon: '🎥' },
            { id: 'interactive', label: 'Interactive Tools', icon: '🔬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        {activeTab !== 'interactive' && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search courses, articles, or webinars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClasses} w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${inputClasses} px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            {activeTab === 'courses' && (
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={`${inputClasses} px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                {levels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map(renderCourseCard)}
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredArticles.map(renderArticleCard)}
          </div>
        )}

        {activeTab === 'webinars' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredWebinars.map(renderWebinarCard)}
          </div>
        )}

        {activeTab === 'interactive' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <h3 className="text-xl font-semibold mb-4">🌊 Ocean Current Simulator</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Interactive simulation of global ocean currents and their impact on climate
              </p>
              <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}>
                Launch Simulator
              </button>
            </div>

            <div className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <h3 className="text-xl font-semibold mb-4">🐠 Species Identification Tool</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                AI-powered tool to identify marine species from photos and descriptions
              </p>
              <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}>
                Start Identifying
              </button>
            </div>

            <div className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <h3 className="text-xl font-semibold mb-4">📊 Data Visualization Lab</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Create custom visualizations using real oceanographic datasets
              </p>
              <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}>
                Open Lab
              </button>
            </div>

            <div className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <h3 className="text-xl font-semibold mb-4">🗺️ Marine Protected Areas Map</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Explore global marine protected areas and their conservation status
              </p>
              <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}>
                Explore Map
              </button>
            </div>

            <div className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <h3 className="text-xl font-semibold mb-4">🧪 Virtual Lab Experiments</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Conduct virtual marine chemistry and biology experiments
              </p>
              <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}>
                Enter Lab
              </button>
            </div>

            <div className={`${cardClasses} border rounded-lg p-6 hover:shadow-lg transition-shadow`}>
              <h3 className="text-xl font-semibold mb-4">🎮 Conservation Game</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                Gamified learning experience about marine conservation strategies
              </p>
              <button className={`${buttonClasses} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full`}>
                Play Game
              </button>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-6 mt-12`}>
          <h3 className="text-xl font-semibold mb-4">Platform Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">24</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Courses Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">156</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Research Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">12</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Webinars</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">8,543</div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Learners</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalResourceCenter;