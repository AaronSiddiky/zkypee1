"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Country flag emojis and their names
const countryFlags = [
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇨🇳", name: "China" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇷🇺", name: "Russia" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇰🇷", name: "South Korea" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇯🇲", name: "Jamaica" },
  { flag: "🇮🇪", name: "Ireland" },
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇸🇪", name: "Sweden" },
  { flag: "🇮🇱", name: "Israel" },
  { flag: "🇪🇬", name: "Egypt" },
  { flag: "🇹🇷", name: "Turkey" },
  { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇻🇳", name: "Vietnam" },
];

export default function CountryFlagRotator() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % countryFlags.length);
        setIsAnimating(false);
      }, 300); // Half of the transition time
    }, 3000); // Change every 3 seconds (slower than before)

    return () => clearInterval(interval);
  }, []);

  const currentFlag = countryFlags[currentIndex];

  return (
    <div className="flex flex-col xs:flex-row items-center justify-center xs:justify-start text-center xs:text-left w-full">
      <div className="text-xs sm:text-sm text-gray-600 mb-1 xs:mb-0">
        Call anywhere:
      </div>
      <div className="flex items-center justify-center">
        <div className="relative h-7 w-8 flex items-center justify-center mx-1 xs:mx-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.4 }}
              className="absolute text-lg sm:text-xl"
            >
              {currentFlag.flag}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 font-medium">
          {currentFlag.name}
        </div>
      </div>
    </div>
  );
}
