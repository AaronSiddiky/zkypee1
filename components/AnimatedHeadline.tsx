"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function AnimatedHeadline() {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Start animation after a short delay
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2500); // Shorter total animation duration

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <div className="mb-2 text-gray-600">Make calls with ease!</div>

      <h1 className="text-5xl font-bold mb-6">
        {/* First part - "Skype is gone" with strikethrough */}
        <div className="relative mb-2">
          <span>Skype is gone</span>

          {/* Strikethrough animation - thicker line in blue */}
          <motion.div
            className="absolute h-2 bg-blue-500 top-[1.3rem] left-0 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            style={{ width: "100%" }}
          />
        </div>

        {/* Second part - "Zkypee is here" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="text-blue-500 mb-2"
        >
          Zkypee is here
        </motion.div>

        {/* Additional text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.7 }}
          className="text-base font-normal text-gray-700 mt-4 max-w-lg"
        >
          Call any landline or phone number with ease
        </motion.div>
      </h1>
    </div>
  );
}
