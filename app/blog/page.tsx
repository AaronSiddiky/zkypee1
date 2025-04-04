import React from 'react';
import Link from 'next/link';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zkypee Blog | Communication Tips & Best Skype Alternatives",
  description:
    "Learn about communication tools, tips, and the best Skype alternatives as Skype is shutting down. Discover why Zkypee is the perfect free Skype replacement.",
  alternates: {
    canonical: "https://zkypee.com/blog/skype-shutting-down",
  },
};

export default function BlogPage() {
  const blogPosts = [
    {
      title: 'The Future of Communication',
      excerpt: 'Discover how modern technology is revolutionizing the way we connect with each other.',
      date: 'March 15, 2024',
      category: 'Technology',
      image: '/blog/communication.jpg'
    },
    {
      title: 'Working Remotely: Best Practices',
      excerpt: 'Learn how to stay productive and connected while working from home.',
      date: 'March 10, 2024',
      category: 'Remote Work',
      image: '/blog/remote-work.jpg'
    },
    {
      title: 'Video Call Tips for Professionals',
      excerpt: 'Essential tips to make your video calls more professional and effective.',
      date: 'March 5, 2024',
      category: 'Tips & Tricks',
      image: '/blog/video-calls.jpg'
    },
    {
      title: 'Security in Online Communication',
      excerpt: 'Understanding the importance of secure communication in the digital age.',
      date: 'March 1, 2024',
      category: 'Security',
      image: '/blog/security.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#00AFF0] to-[#0085B3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Latest Blog Posts
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Stay updated with the latest news, tips, and insights
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <Link 
              key={index}
              href={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="group"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden transition-transform duration-300 group-hover:transform group-hover:scale-105">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {/* Image placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-white/5 to-white/10" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/60">{post.date}</span>
                    <span className="text-sm text-white/60 px-3 py-1 rounded-full bg-white/5">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90">
                    {post.title}
                  </h3>
                  <p className="text-white/80">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center text-white/60 group-hover:text-white/80">
                    <span>Read more</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-white/80 mb-6">
            Get the latest updates delivered straight to your inbox
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-[#00AFF0] rounded-lg font-medium hover:bg-opacity-90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
