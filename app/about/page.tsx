import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FaLinkedin, FaTwitter, FaEnvelope } from "react-icons/fa";

export const metadata: Metadata = {
  title: "About The Founders | Zkypee",
  description:
    "Meet Leonard Holter and Aaron Siddiky, Columbia University students who created Zkypee, the best Skype alternative.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Meet The Founders
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Columbia University students who built a better Skype alternative
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            We are two CompSci students at Columbia who use Skype a ton and are
            very very disappointed to see it gone! We used to use it to call
            home, and use it with family/friends/local businesses with landlines
            and since it's going away we made our own skype dialer where you can
            call anyone anywhere in the world for $0.15 per minute (we're making
            like no money, just cutting even).
          </p>
          <p className="text-gray-700 mb-4">
            We're also trying to get people on board by transferring their
            existing Skype Credits for half value. Comment down below if that is
            something that could be of interest.
          </p>
          <p className="text-gray-700 mb-4">
            We went viral on X, and a lot of people are showing interest, so we
            wanted to share it here as well.
          </p>

          <p className="text-gray-700">
            Let us know if there any other features you'd like to see.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          {/* Leonard Holter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative pt-[100%] bg-gray-200">
              {/* Image for Leonard - uses proper aspect ratio container */}
              <Image
                src="/images/leonard.jpg"
                alt="Leonard Holter"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover absolute inset-0"
                priority
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Leonard Holter
              </h2>
              <p className="text-gray-600 mb-6">
                Columbia University student with a passion for technology and
                entrepreneurship. Co-created Zkypee as a better alternative to
                Skype after being disappointed with its shutdown.
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="https://no.linkedin.com/in/leonard-holter-86b6a0226"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FaLinkedin className="w-6 h-6" />
                </a>
                <a
                  href="https://x.com/LeonardHolter17"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-400 transition-colors"
                >
                  <FaTwitter className="w-6 h-6" />
                </a>
                <a
                  href="mailto:leonard.holter@columbia.edu"
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  <FaEnvelope className="w-6 h-6" />
                  <span className="sr-only">leonard.holter@columbia.edu</span>
                </a>
                <span className="text-sm text-gray-500 ml-2">
                  leonard.holter@columbia.edu
                </span>
              </div>
            </div>
          </div>

          {/* Aaron Siddiky */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative pt-[100%] bg-gray-200">
              {/* Image for Aaron - uses proper aspect ratio container */}
              <Image
                src="/images/aaron.jpg"
                alt="Aaron Siddiky"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover absolute inset-0"
                priority
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Aaron Siddiky
              </h2>
              <p className="text-gray-600 mb-6">
                Computer science student at Columbia University with expertise
                in software development. Helped create Zkypee to provide a
                reliable alternative to Skype for international calls and
                communication.
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="https://www.linkedin.com/in/aaronsiddiky/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FaLinkedin className="w-6 h-6" />
                </a>
                <a
                  href="https://x.com/AaronSiddiky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-400 transition-colors"
                >
                  <FaTwitter className="w-6 h-6" />
                </a>
                <a
                  href="mailto:aaron.siddiky@columbia.edu"
                  className="text-gray-600 hover:text-red-500 transition-colors"
                >
                  <FaEnvelope className="w-6 h-6" />
                  <span className="sr-only">aaron.siddiky@columbia.edu</span>
                </a>
                <span className="text-sm text-gray-500 ml-2">
                  aaron.siddiky@columbia.edu
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Get In Touch
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions or feature suggestions? We'd love to hear from you.
            Reach out to Leonard or Aaron directly, or try Zkypee today!
          </p>
          <Link
            href="/dial"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-full transition-colors"
          >
            Try Zkypee Now
          </Link>
        </div>
      </div>
    </main>
  );
}
