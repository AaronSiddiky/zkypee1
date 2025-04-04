"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#00AFF0] to-[#0078D4]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0078D4] to-[#00AFF0] opacity-90"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 sm:mb-12"
            >
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
                Stay Connected with Zkypee
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto">
                Free video calls, messaging, and voice chat for everyone. Just like the good old days.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Video Calls</h3>
                <p className="text-white/80">Crystal clear HD video calls with friends and family</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Chat</h3>
                <p className="text-white/80">Send messages, emojis, and share files instantly</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
                <div className="rounded-full bg-white/20 w-12 h-12 flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Voice Calls</h3>
                <p className="text-white/80">High-quality voice calls over the internet</p>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto"
            >
              <div className="flex-1 flex flex-col items-center">
                <Link
                  href="/buy-number"
                  className="w-full bg-white text-[#00AFF0] px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5m0 0v5m0-5l-6 6M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  Private Number
                </Link>
                <p className="text-white/80 text-sm mt-3 px-4 text-center">
                  Get your own permanent number to send/receive texts and calls from any device
                </p>
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                <Link
                  href="/dial"
                  className="w-full bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Public Number
                </Link>
                <p className="text-white/80 text-sm mt-3 px-4 text-center">
                  Make anonymous calls from a temporary number without revealing your identity
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Business Features Section */}
      <section className="py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Connect with customers effortlessly
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Zkypee is a powerful business communication system in an intuitive app that
              works across all your existing devices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white"
            >
              <h3 className="text-3xl font-bold mb-6">Get numbers for any use case</h3>
              <p className="text-lg text-white/80 mb-6">
                Organize conversations by assigning numbers to your specific business and
                customer needs.
              </p>
              <p className="text-lg text-white/80 mb-8">
                Set up new local US and Canadian phone numbers, along with North American toll-free
                numbers in minutes.
              </p>
              <Link
                href="/numbers"
                className="inline-flex items-center bg-white text-[#00AFF0] px-6 py-3 rounded-full text-lg font-medium hover:bg-opacity-90 transition-colors"
              >
                Get your number
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative h-[600px] rounded-lg overflow-hidden"
            >
              <Image
                src="/mockup.png"
                alt="Zkypee Interface"
                fill
                className="object-cover rounded-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Save time with AI
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Give your workflow a boost with Zkypee AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Call summaries and next steps</h3>
              <p className="text-white/80 mb-6">
                Zkypee AI automatically summarizes calls, then intelligently suggests next steps.
              </p>
              <div className="bg-black/20 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div>
                    <div className="text-white/60 text-sm">Call ended</div>
                    <div className="text-white">You answered • 9:30</div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-white/80">
                  <h4 className="font-medium mb-2">Call Summary</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Discussed project timeline and deliverables</li>
                    <li>• Client requested additional features</li>
                    <li>• Follow-up meeting scheduled for next week</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Automatic call transcripts</h3>
              <p className="text-white/80 mb-6">
                Read conversations in detail and easily reference or find info with time-stamps.
              </p>
              <div className="bg-black/20 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <div className="text-white/60 text-sm w-12">0:01</div>
                    <div className="bg-white/10 rounded-lg p-3 text-white flex-1">
                      Hello, this is John speaking.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-white/60 text-sm w-12">0:05</div>
                    <div className="bg-white/10 rounded-lg p-3 text-white flex-1">
                      Hi John, thanks for taking my call.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-black/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6">
              <Image
                src="/testimonial-avatar.jpg"
                alt="Testimonial"
                width={80}
                height={80}
                className="object-cover"
              />
            </div>
            <blockquote className="text-2xl text-white mb-6">
              "Zkypee was truly my first assistant. The AI feature of transcribing calls,
              creating a summary and to-do list, is next-level amazing."
            </blockquote>
            <div className="text-white/80">
              <div className="font-medium">Sarah Johnson</div>
              <div className="text-sm">Business Development Manager</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0078D4] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-white/70 hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white">Pricing</Link></li>
                <li><Link href="/enterprise" className="text-white/70 hover:text-white">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/70 hover:text-white">About</Link></li>
                <li><Link href="/careers" className="text-white/70 hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="text-white/70 hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-white/70 hover:text-white">Help Center</Link></li>
                <li><Link href="/api" className="text-white/70 hover:text-white">API</Link></li>
                <li><Link href="/status" className="text-white/70 hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/70 hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="text-white/70 hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="text-white text-2xl font-bold mr-2">
                Z
              </div>
              <span className="text-white/70">© 2024 Zkypee. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-white/70 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-white/70 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 8c0 .557-.447 1.008-1 1.008s-1-.45-1-1.008c0-.557.447-1.008 1-1.008s1 .452 1 1.008zm0 2h-2v6h2v-6zm3 0h-2v6h2v-2.861c0-1.722 2.002-1.881 2.002 0v2.861h1.998v-3.359c0-3.284-3.128-3.164-4-1.548v-1.093z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
