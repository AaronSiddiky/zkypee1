"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Auth from "./Auth";
import { useTwilio } from "../contexts/TwilioContext";
import TwilioDebugPanel from "./TwilioDebugPanel";
import CreditBalance from "./CreditBalance";
import Link from "next/link";
import CallInfo from "./CallInfo";
import LowCreditWarning from "./LowCreditWarning";
import CallCreditInfo from "@/app/components/CallCreditInfo";
import {
  PhoneIcon,
  BackspaceIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  SpeakerXMarkIcon,
  SpeakerWaveIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { playDTMF, cleanupAudio } from "@/lib/audio";
import { deductCreditsForCall } from "@/lib/credits";
import { trackEvent } from "@/lib/analytics";

// Country codes data
const countryCodes = [
  { code: "+93", name: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", name: "Albania", flag: "🇦🇱" },
  { code: "+213", name: "Algeria", flag: "🇩🇿" },
  { code: "+1684", name: "American Samoa", flag: "🇦🇸" },
  { code: "+376", name: "Andorra", flag: "🇦🇩" },
  { code: "+244", name: "Angola", flag: "🇦🇴" },
  { code: "+1264", name: "Anguilla", flag: "🇦🇮" },
  { code: "+672", name: "Antarctica", flag: "🇦🇶" },
  { code: "+1268", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+374", name: "Armenia", flag: "🇦🇲" },
  { code: "+297", name: "Aruba", flag: "🇦🇼" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+994", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "+1242", name: "Bahamas", flag: "🇧🇸" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "+1246", name: "Barbados", flag: "🇧🇧" },
  { code: "+375", name: "Belarus", flag: "🇧🇾" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+501", name: "Belize", flag: "🇧🇿" },
  { code: "+229", name: "Benin", flag: "🇧🇯" },
  { code: "+1441", name: "Bermuda", flag: "🇧🇲" },
  { code: "+975", name: "Bhutan", flag: "🇧🇹" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴" },
  { code: "+387", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", name: "Botswana", flag: "🇧🇼" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+246", name: "British Indian Ocean Territory", flag: "🇮🇴" },
  { code: "+1284", name: "British Virgin Islands", flag: "🇻🇬" },
  { code: "+673", name: "Brunei", flag: "🇧🇳" },
  { code: "+359", name: "Bulgaria", flag: "🇧🇬" },
  { code: "+226", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", name: "Burundi", flag: "🇧🇮" },
  { code: "+855", name: "Cambodia", flag: "🇰🇭" },
  { code: "+237", name: "Cameroon", flag: "🇨🇲" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+238", name: "Cape Verde", flag: "🇨🇻" },
  { code: "+1345", name: "Cayman Islands", flag: "🇰🇾" },
  { code: "+236", name: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", name: "Chad", flag: "🇹🇩" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+61", name: "Christmas Island", flag: "🇨🇽" },
  { code: "+61", name: "Cocos Islands", flag: "🇨🇨" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+269", name: "Comoros", flag: "🇰🇲" },
  { code: "+682", name: "Cook Islands", flag: "🇨🇰" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+385", name: "Croatia", flag: "🇭🇷" },
  { code: "+53", name: "Cuba", flag: "🇨🇺" },
  { code: "+599", name: "Curacao", flag: "🇨🇼" },
  { code: "+357", name: "Cyprus", flag: "🇨🇾" },
  { code: "+420", name: "Czech Republic", flag: "🇨🇿" },
  { code: "+243", name: "Democratic Republic of the Congo", flag: "🇨🇩" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+253", name: "Djibouti", flag: "🇩🇯" },
  { code: "+1767", name: "Dominica", flag: "🇩🇲" },
  { code: "+1809", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "+670", name: "East Timor", flag: "🇹🇱" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻" },
  { code: "+240", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", name: "Eritrea", flag: "🇪🇷" },
  { code: "+372", name: "Estonia", flag: "🇪🇪" },
  { code: "+251", name: "Ethiopia", flag: "🇪🇹" },
  { code: "+500", name: "Falkland Islands", flag: "🇫🇰" },
  { code: "+298", name: "Faroe Islands", flag: "🇫🇴" },
  { code: "+679", name: "Fiji", flag: "🇫🇯" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+594", name: "French Guiana", flag: "🇬🇫" },
  { code: "+689", name: "French Polynesia", flag: "🇵🇫" },
  { code: "+241", name: "Gabon", flag: "🇬🇦" },
  { code: "+220", name: "Gambia", flag: "🇬🇲" },
  { code: "+995", name: "Georgia", flag: "🇬🇪" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+350", name: "Gibraltar", flag: "🇬🇮" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+299", name: "Greenland", flag: "🇬🇱" },
  { code: "+1473", name: "Grenada", flag: "🇬🇩" },
  { code: "+590", name: "Guadeloupe", flag: "🇬🇵" },
  { code: "+1671", name: "Guam", flag: "🇬🇺" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹" },
  { code: "+44", name: "Guernsey", flag: "🇬🇬" },
  { code: "+224", name: "Guinea", flag: "🇬🇳" },
  { code: "+245", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", name: "Guyana", flag: "🇬🇾" },
  { code: "+509", name: "Haiti", flag: "🇭🇹" },
  { code: "+504", name: "Honduras", flag: "🇭🇳" },
  { code: "+852", name: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", name: "Hungary", flag: "🇭🇺" },
  { code: "+354", name: "Iceland", flag: "🇮🇸" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+98", name: "Iran", flag: "🇮🇷" },
  { code: "+964", name: "Iraq", flag: "🇮🇶" },
  { code: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "+44", name: "Isle of Man", flag: "🇮🇲" },
  { code: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+225", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "+1876", name: "Jamaica", flag: "🇯🇲" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+44", name: "Jersey", flag: "🇯🇪" },
  { code: "+962", name: "Jordan", flag: "🇯🇴" },
  { code: "+7", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+686", name: "Kiribati", flag: "🇰🇮" },
  { code: "+383", name: "Kosovo", flag: "🇽🇰" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", name: "Laos", flag: "🇱🇦" },
  { code: "+371", name: "Latvia", flag: "🇱🇻" },
  { code: "+961", name: "Lebanon", flag: "🇱🇧" },
  { code: "+266", name: "Lesotho", flag: "🇱🇸" },
  { code: "+231", name: "Liberia", flag: "🇱🇷" },
  { code: "+218", name: "Libya", flag: "🇱🇾" },
  { code: "+423", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "+370", name: "Lithuania", flag: "��🇻" },
  { code: "+352", name: "Luxembourg", flag: "🇱🇺" },
  { code: "+853", name: "Macau", flag: "🇲🇴" },
  { code: "+389", name: "Macedonia", flag: "🇲🇰" },
  { code: "+261", name: "Madagascar", flag: "🇲🇬" },
  { code: "+265", name: "Malawi", flag: "🇲🇼" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+960", name: "Maldives", flag: "🇲🇻" },
  { code: "+223", name: "Mali", flag: "🇲🇱" },
  { code: "+356", name: "Malta", flag: "🇲🇹" },
  { code: "+692", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "+596", name: "Martinique", flag: "🇲🇶" },
  { code: "+222", name: "Mauritania", flag: "🇲🇷" },
  { code: "+230", name: "Mauritius", flag: "🇲🇺" },
  { code: "+262", name: "Mayotte", flag: "🇾🇹" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+691", name: "Micronesia", flag: "🇫🇲" },
  { code: "+373", name: "Moldova", flag: "🇲🇩" },
  { code: "+377", name: "Monaco", flag: "🇲🇨" },
  { code: "+976", name: "Mongolia", flag: "🇲🇳" },
  { code: "+382", name: "Montenegro", flag: "🇲🇪" },
  { code: "+1664", name: "Montserrat", flag: "🇲🇸" },
  { code: "+212", name: "Morocco", flag: "🇲🇦" },
  { code: "+258", name: "Mozambique", flag: "🇲🇿" },
  { code: "+95", name: "Myanmar", flag: "🇲🇲" },
  { code: "+264", name: "Namibia", flag: "🇳🇦" },
  { code: "+674", name: "Nauru", flag: "🇳🇷" },
  { code: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+687", name: "New Caledonia", flag: "🇳🇨" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "+505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", name: "Niger", flag: "🇳🇪" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+683", name: "Niue", flag: "🇳🇺" },
  { code: "+850", name: "North Korea", flag: "🇰🇵" },
  { code: "+1670", name: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+680", name: "Palau", flag: "🇵🇼" },
  { code: "+970", name: "Palestine", flag: "🇵🇸" },
  { code: "+507", name: "Panama", flag: "🇵🇦" },
  { code: "+675", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+1787", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+242", name: "Republic of the Congo", flag: "🇨🇬" },
  { code: "+262", name: "Reunion", flag: "🇷🇪" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "+590", name: "Saint Barthelemy", flag: "🇧🇱" },
  { code: "+290", name: "Saint Helena", flag: "🇸🇭" },
  { code: "+1869", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1758", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "+590", name: "Saint Martin", flag: "🇲🇫" },
  { code: "+508", name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
  { code: "+1784", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "+685", name: "Samoa", flag: "🇼🇸" },
  { code: "+378", name: "San Marino", flag: "🇸🇲" },
  { code: "+239", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", name: "Senegal", flag: "🇸🇳" },
  { code: "+381", name: "Serbia", flag: "🇷🇸" },
  { code: "+248", name: "Seychelles", flag: "🇸🇨" },
  { code: "+232", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+1721", name: "Sint Maarten", flag: "🇸🇽" },
  { code: "+421", name: "Slovakia", flag: "🇸🇰" },
  { code: "+386", name: "Slovenia", flag: "🇸🇮" },
  { code: "+677", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "+252", name: "Somalia", flag: "🇸🇴" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+211", name: "South Sudan", flag: "🇸🇸" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", name: "Sudan", flag: "🇸🇩" },
  { code: "+597", name: "Suriname", flag: "🇸🇷" },
  { code: "+47", name: "Svalbard and Jan Mayen", flag: "🇸🇯" },
  { code: "+268", name: "Swaziland", flag: "🇸🇿" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+963", name: "Syria", flag: "🇸🇾" },
  { code: "+886", name: "Taiwan", flag: "🇹🇼" },
  { code: "+992", name: "Tajikistan", flag: "🇹🇯" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+228", name: "Togo", flag: "🇹🇬" },
  { code: "+690", name: "Tokelau", flag: "🇹🇰" },
  { code: "+676", name: "Tonga", flag: "🇹🇴" },
  { code: "+1868", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "+216", name: "Tunisia", flag: "🇹🇳" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+993", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "+1649", name: "Turks and Caicos Islands", flag: "🇹🇨" },
  { code: "+688", name: "Tuvalu", flag: "🇹🇻" },
  { code: "+1340", name: "U.S. Virgin Islands", flag: "🇻🇮" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾" },
  { code: "+998", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", name: "Vanuatu", flag: "🇻🇺" },
  { code: "+379", name: "Vatican", flag: "🇻🇦" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+681", name: "Wallis and Futuna", flag: "🇼🇫" },
  { code: "+212", name: "Western Sahara", flag: "🇪🇭" },
  { code: "+967", name: "Yemen", flag: "🇾🇪" },
  { code: "+260", name: "Zambia", flag: "🇿🇲" },
  { code: "+263", name: "Zimbabwe", flag: "🇿🇼" },
];

interface PhoneDialerProps {
  user: any | null;
  loading: boolean;
}

interface DialButtonProps {
  value: string;
  onClick: () => void;
  disabled: boolean;
  className?: string;
}

// Dial button component with animation
const DialButton: React.FC<DialButtonProps> = ({
  value,
  onClick,
  disabled,
  className,
}) => {
  return (
    <motion.button
      key={value}
      onClick={onClick}
      className={`bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-4 rounded-md transition-colors relative ${className}`}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
      whileHover={{ backgroundColor: "#e5e7eb" }}
    >
      <div className="flex flex-col items-center justify-center">
        <span className="text-xl">{value}</span>
        {value === "0" && <span className="text-xs text-gray-500 mt-1">+</span>}
        {value === "1" && (
          <span className="text-xs text-gray-500 mt-1">Voicemail</span>
        )}
      </div>
    </motion.button>
  );
};

// Add a function to fetch call rate from our new API
async function fetchCallRate(phoneNumber: string): Promise<number> {
  try {
    const response = await fetch(
      `/api/rates/get-rate?phoneNumber=${encodeURIComponent(phoneNumber)}`
    );
    if (!response.ok) {
      console.error("Error fetching call rate:", response.statusText);
      return 0.1; // Default fallback rate
    }

    const data = await response.json();
    if (data.success && data.rate) {
      return data.rate;
    }
    return 0.1; // Default fallback rate
  } catch (error) {
    console.error("Error fetching call rate:", error);
    return 0.1; // Default fallback rate
  }
}

// Add a new Call Cost Timer component
interface CallCostTimerProps {
  isConnected: boolean;
  startTime: Date | null;
  rate: number;
  userId: string;
  phoneNumber: string;
  callSid?: string;
}

const CallCostTimer: React.FC<CallCostTimerProps> = ({
  isConnected,
  startTime,
  rate,
  userId,
  phoneNumber,
  callSid,
}) => {
  const [duration, setDuration] = useState(0);
  const [cost, setCost] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDurationRef = useRef<number>(0);
  const lastCallStateRef = useRef<boolean>(isConnected);
  const [creditDeducted, setCreditDeducted] = useState(false);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isConnected && startTime) {
      // Start the timer
      intervalRef.current = setInterval(() => {
        const currentDuration = Math.ceil(
          (Date.now() - startTime.getTime()) / 1000
        );
        setDuration(currentDuration);
        lastDurationRef.current = currentDuration;

        // Calculate cost: rate per minute * minutes (seconds / 60)
        const calculatedCost = (rate * currentDuration) / 60;
        setCost(parseFloat(calculatedCost.toFixed(4)));
      }, 1000);
    } else if (
      lastCallStateRef.current &&
      !isConnected &&
      userId &&
      lastDurationRef.current > 0 &&
      !creditDeducted
    ) {
      // Call just ended and we have duration data - deduct credits
      const durationMinutes = lastDurationRef.current / 60; // Convert seconds to minutes
      console.log(
        `Call ended. Deducting credits for ${durationMinutes.toFixed(
          2
        )} minutes at rate ${rate}/min`
      );

      setCreditDeducted(true); // Mark credits as deducted to prevent duplicate deductions

      // Deduct credits from the user's account
      deductCreditsForCall(
        userId,
        durationMinutes,
        callSid || "unknown",
        phoneNumber
      )
        .then((result) => {
          console.log("Credit deduction successful:", result);
        })
        .catch((err) => {
          console.error("Error deducting credits:", err);
        });

      // Reset when call ends
      setDuration(0);
      setCost(0);
    }

    // Update last call state reference
    lastCallStateRef.current = isConnected;

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // If component unmounts during an active call, we should still try to deduct credits
      if (
        isConnected &&
        userId &&
        lastDurationRef.current > 0 &&
        !creditDeducted
      ) {
        const durationMinutes = lastDurationRef.current / 60;
        console.log(
          `Component unmounting during call. Deducting credits for ${durationMinutes.toFixed(
            2
          )} minutes`
        );

        setCreditDeducted(true); // Mark as deducted

        deductCreditsForCall(
          userId,
          durationMinutes,
          callSid || "unknown",
          phoneNumber
        ).catch((err) => {
          console.error("Error deducting credits on unmount:", err);
        });
      }
    };
  }, [
    isConnected,
    startTime,
    rate,
    userId,
    phoneNumber,
    callSid,
    creditDeducted,
  ]);

  // When the call completely ends, reset the deducted state for next call
  useEffect(() => {
    if (!isConnected) {
      // Reset after a short delay to ensure the deduction has time to complete
      const resetTimer = setTimeout(() => {
        setCreditDeducted(false);
      }, 2000);

      return () => clearTimeout(resetTimer);
    }
  }, [isConnected]);

  // Format duration for display (MM:SS)
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!isConnected) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-blue-800 font-medium">
            {formatDuration(duration)}
          </span>
        </div>
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-blue-800 font-medium">${cost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

export default function PhoneDialer({ user, loading }: PhoneDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    countryCodes.find((c) => c.code === "+1" && c.name === "United States") ||
      countryCodes.find((c) => c.code === "+1") ||
      countryCodes[0]
  );
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [filteredCountryCodes, setFilteredCountryCodes] =
    useState(countryCodes);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [initializationFailed, setInitializationFailed] = useState(false);
  // Add local state to track call status
  const [localCallState, setLocalCallState] = useState({
    isConnected: false,
    isConnecting: false,
    isMuted: false,
  });

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initAttemptedRef = useRef<boolean>(false);
  const {
    isReady,
    isConnecting: twilioConnecting,
    isConnected: twilioConnected,
    error,
    connection,
    initializeDevice,
    makeCall,
    hangUp,
    callDuration,
    estimatedCost,
    insufficientCredits,
    isMuted,
    toggleMute,
    checkCredits,
    status,
    callStartTime,
    // Add trial-related properties from TwilioContext
    isTrialMode,
    trialCallsRemaining,
    trialTimeRemaining,
    initializeTrialMode,
    showTrialConversionModal,
    setShowTrialConversionModal,
    setTrialCallsRemaining, // Add this line to destructure setTrialCallsRemaining
  } = useTwilio();

  // Add state for call rate and SID
  const [callRate, setCallRate] = useState(0.1); // Default rate, will be updated when call starts
  const [callSid, setCallSid] = useState<string | undefined>(undefined);

  // Add useEffect to track connection state changes
  useEffect(() => {
    console.log("Call state changed:", {
      twilioConnected,
      twilioConnecting,
      status,
    });
    setLocalCallState((prev) => ({
      ...prev,
      isConnected: twilioConnected,
      isConnecting: twilioConnecting,
    }));
  }, [twilioConnected, twilioConnecting, status]);

  // Add a more aggressive check for call status
  useEffect(() => {
    // Force UI update when call duration increases
    if (callDuration > 0 && !localCallState.isConnected) {
      console.log("Call is active (duration > 0), forcing UI update");
      setLocalCallState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
      }));
    }
  }, [callDuration, localCallState.isConnected]);

  // Track mute state changes
  useEffect(() => {
    console.log("Mute state changed:", isMuted);
    setLocalCallState((prev) => ({
      ...prev,
      isMuted,
    }));
  }, [isMuted]);

  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true);
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Filter country codes when search input changes
  useEffect(() => {
    if (searchCountry) {
      const filtered = countryCodes.filter(
        (country) =>
          country.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
          country.code.includes(searchCountry)
      );
      setFilteredCountryCodes(filtered);
    } else {
      setFilteredCountryCodes(countryCodes);
    }
  }, [searchCountry]);

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryCodes(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when country dropdown is shown
  useEffect(() => {
    if (showCountryCodes && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showCountryCodes]);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not in a text input and not showing AI assistant
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key;

      // Handle numeric keys (both numpad and regular numbers)
      if (
        /^[0-9*#]$/.test(key) ||
        (event.code === "NumpadEnter" && key === "Enter")
      ) {
        event.preventDefault();
        handleNumberClick(key === "Enter" ? "#" : key);
      }
      // Handle backspace/delete
      else if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        handleDelete();
      }
      // Handle Enter key for making calls
      else if (key === "Enter" && !event.code.includes("Numpad")) {
        event.preventDefault();
        handleCall();
      }
      // Handle plus sign for international calls
      else if (key === "+" || key === "=") {
        event.preventDefault();
        if (phoneNumber.length === 0) {
          setPhoneNumber("+");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phoneNumber]); // Add phoneNumber as dependency

  // Initialize Twilio when user is available
  useEffect(() => {
    if (user && !initAttemptedRef.current) {
      console.log("User available, initializing Twilio");
      initAttemptedRef.current = true;
      setInitializationFailed(false);

      initializeDevice().catch((err) => {
        console.error("Failed to initialize Twilio:", err);
        setInitializationFailed(true);
        // Reset the flag after a certain delay to allow retry
        setTimeout(() => {
          initAttemptedRef.current = false;
        }, 5000); // Wait 5 seconds before allowing another attempt
      });

      fetchTwilioNumber().catch((err) => {
        console.error("Failed to fetch Twilio number:", err);
      });
    }
  }, [user]); // Remove initializeDevice from the dependency array

  // Fetch the Twilio phone number
  const fetchTwilioNumber = async () => {
    try {
      const response = await fetch("/api/twilio/phone-number");
      if (response.ok) {
        const data = await response.json();
        if (data.phoneNumber) {
          // Format the phone number nicely for display
          const formattedNumber = formatPhoneNumberForDisplay(data.phoneNumber);
          setTwilioNumber(formattedNumber);
        }
      } else {
        // Handle non-200 responses
        console.warn(
          `Error fetching Twilio phone number: Server returned ${response.status}`
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error fetching Twilio phone number:", error);
      return false;
    }
  };

  // Update full phone number whenever phone number or country code changes
  useEffect(() => {
    if (phoneNumber) {
      // If phone number already starts with '+', don't add country code
      const formatted = phoneNumber.startsWith("+")
        ? phoneNumber
        : `${selectedCountryCode.code}${phoneNumber.replace(/\D/g, "")}`;
      setFullPhoneNumber(formatted);
    }
  }, [phoneNumber, selectedCountryCode]);

  // Check microphone permission status on mount
  useEffect(() => {
    async function checkMicPermission() {
      try {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setMicPermissionStatus(result.state as "prompt" | "granted" | "denied");

        // Listen for permission changes
        result.addEventListener("change", () => {
          setMicPermissionStatus(
            result.state as "prompt" | "granted" | "denied"
          );
        });
      } catch (err) {
        console.error("Error checking microphone permission:", err);
      }
    }

    checkMicPermission();
  }, []);

  // Handle microphone permission request
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermissionStatus("granted");
      return true;
    } catch (err) {
      console.error("Error requesting microphone permission:", err);
      setMicPermissionStatus("denied");
      return false;
    }
  };

  const handleNumberClick = (num: string) => {
    // Allow dial pad usage in trial mode without requiring login
    if (!user && !isTrialMode) {
      setShowAuth(true);
      return;
    }

    // Play DTMF tone
    playDTMF(num === "*" ? "*" : num === "#" ? "#" : num);

    setPhoneNumber((prev) => {
      // If "0" is long-pressed at the beginning, add "+"
      if (num === "0" && prev.length === 0) {
        return prev + "+";
      }
      return prev + num;
    });
  };

  const handleDelete = () => {
    if (phoneNumber) {
      playDTMF("#"); // Play a tone for delete as well
      setPhoneNumber((prev) => prev.slice(0, -1));
    }
  };

  const handleLongPressStart = (num: string) => {
    if (num === "0" && !longPressTimer) {
      const timer = setTimeout(() => {
        setPhoneNumber((prev) => {
          // Replace the last "0" with "+"
          if (prev.endsWith("0")) {
            return prev.slice(0, -1) + "+";
          }
          return prev + "+";
        });
      }, 700); // 700ms long press
      setLongPressTimer(timer);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Format phone number for making a call
  const formatPhoneNumberForCall = (
    number: string,
    countryCode: { code: string }
  ): string => {
    return number.startsWith("+")
      ? number
      : `${countryCode.code}${number.replace(/\D/g, "")}`;
  };

  const handleCall = async () => {
    if (!phoneNumber) {
      return;
    }

    // If in trial mode, check the latest trial usage before making a call
    if (isTrialMode) {
      try {
        // Get stored identifiers
        const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        const ipAddress = localStorage.getItem("zkypee_trial_ip_address");

        if (fingerprint && ipAddress) {
          // Directly fetch from API endpoint for most up-to-date values
          console.log(
            "[TRIAL UI] Checking trial usage before call directly from API"
          );
          const response = await fetch(
            `/api/trial/get-usage?fingerprint=${encodeURIComponent(
              fingerprint
            )}&ipAddress=${encodeURIComponent(ipAddress)}`
          );

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const usage = await response.json();
          console.log("[TRIAL UI] Current trial usage from API:", usage);

          // Always update the UI with the latest data from the database
          setTrialCallsRemaining(usage.callsRemaining);
          console.log(
            "[TRIAL UI] Updated trial calls remaining to:",
            usage.callsRemaining
          );

          // If no calls remaining, show the conversion modal and prevent the call ONLY if user is not logged in
          if (usage.callsRemaining <= 0 && !user) {
            console.log(
              "[TRIAL UI] No calls remaining, showing conversion modal"
            );
            setShowTrialConversionModal(true);
            return;
          }
        }
      } catch (error) {
        console.error("[TRIAL UI] Error checking trial usage:", error);
        // Continue with the call attempt even if there's an error checking usage
      }
    }

    // Format the full number with country code
    const fullNumber = formatPhoneNumberForCall(
      phoneNumber,
      selectedCountryCode
    );
    setFullPhoneNumber(fullNumber);

    // For trial mode, we don't need to check credits
    if (!isTrialMode) {
      // Check credits first (only for non-trial users)
      const hasCredits = await checkCredits(10);
      if (!hasCredits) {
        return;
      }
    }

    // Request microphone permission if not already granted
    if (micPermissionStatus !== "granted") {
      const permissionGranted = await requestMicPermission();
      if (!permissionGranted) {
        return;
      }
    }

    try {
      // Update local state to show connecting
      setLocalCallState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: true,
      }));

      // Initialize the device if not already done
      if (!isReady) {
        console.log("Twilio device not ready, attempting to initialize...");
        // Only attempt initialization if we haven't tried recently
        if (!initAttemptedRef.current) {
          initAttemptedRef.current = true;
          console.log("Initializing Twilio device...");

          // Use the appropriate initialization method based on mode
          const initialized = isTrialMode
            ? await initializeTrialMode()
            : await initializeDevice();

          console.log("Initialization result:", initialized);

          // If initialization failed, set a timeout to allow retry later
          if (!initialized) {
            console.error("Failed to initialize Twilio device");
            setLocalCallState((prev) => ({
              ...prev,
              isConnected: false,
              isConnecting: false,
            }));
            setTimeout(() => {
              initAttemptedRef.current = false;
            }, 5000);
            return;
          }
        } else {
          console.log(
            "Initialization already attempted recently, please wait and try again"
          );
          setLocalCallState((prev) => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
          }));
          return;
        }
      }

      // Estimate the call rate based on the destination number using our API
      try {
        const rate = await fetchCallRate(fullNumber);
        setCallRate(rate);
        console.log(`Got rate for ${fullNumber}: $${rate}/min`);
      } catch (err) {
        console.error("Error fetching call rate:", err);
        // Continue with default rate if we can't get the specific rate
      }

      // Make the call
      console.log("Making call to:", fullNumber);
      const callSuccess = await makeCall(fullNumber);
      console.log("Call success:", callSuccess);

      if (callSuccess) {
        // Force update the local state to connected after a short delay
        // This ensures the UI updates even if the event handlers don't fire
        setTimeout(() => {
          setLocalCallState((prev) => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
          }));
        }, 2000);
      } else {
        setLocalCallState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
      }
    } catch (err) {
      console.error("Error making call:", err);
      setLocalCallState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));
    }
  }; // This should be the proper closing of the handleCall function

  const handleHangUp = () => {
    console.log("Hanging up call");
    hangUp();

    // Immediately update local state to show disconnected
    setLocalCallState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
    }));
  };

  // Format phone number for display
  const formatPhoneNumberForDisplay = (number: string): string => {
    if (!number) return "";

    // Clean the number to remove any non-digit characters except the plus sign
    let cleanedNumber = number.replace(/[^\d+]/g, "");

    // Handle fully formatted international numbers
    if (cleanedNumber.startsWith("+")) {
      // For US/Canada numbers (+1)
      if (cleanedNumber.startsWith("+1") && cleanedNumber.length >= 12) {
        return `+1 (${cleanedNumber.substring(2, 5)}) ${cleanedNumber.substring(
          5,
          8
        )}-${cleanedNumber.substring(8)}`;
      }

      // For other international numbers, format with spaces
      return cleanedNumber.replace(
        /(\+\d{1,3})(\d{3})(\d{3})(\d{4})/,
        "$1 $2 $3 $4"
      );
    }

    // If the number doesn't start with a +, use the selected country code
    if (selectedCountryCode.code === "+1" && cleanedNumber.length >= 10) {
      return `(${cleanedNumber.slice(0, 3)}) ${cleanedNumber.slice(
        3,
        6
      )}-${cleanedNumber.slice(6, 10)}`;
    }

    // For other countries, add spaces every 3 digits
    return cleanedNumber.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  };

  // Add a manual retry function
  const handleRetryInitialization = () => {
    if (!initAttemptedRef.current && user) {
      setInitializationFailed(false);
      initAttemptedRef.current = true;

      initializeDevice()
        .then((success) => {
          if (success) {
            setInitializationFailed(false);
            return fetchTwilioNumber();
          } else {
            setInitializationFailed(true);
            throw new Error("Failed to initialize");
          }
        })
        .catch((err) => {
          console.error("Manual retry failed:", err);
          setInitializationFailed(true);
          // Reset the flag after delay
          setTimeout(() => {
            initAttemptedRef.current = false;
          }, 5000);
        });
    }
  };

  const handleMuteToggle = () => {
    // Log the current state for debugging
    console.log("Mute button clicked - Current state:", {
      localMuted: localCallState.isMuted,
      contextMuted: isMuted,
      isConnected: twilioConnected,
    });

    // Only allow muting if we're in a call
    if (!twilioConnected) {
      console.warn("Cannot mute - no active call");
      return;
    }

    try {
      // Calculate the new mute state (opposite of current state)
      const newMuteState = !isMuted;

      // Update local state immediately for visual feedback
      setLocalCallState((prev) => ({
        ...prev,
        isMuted: newMuteState,
      }));

      // Call the context's toggleMute function
      toggleMute();

      // Verify the mute state was properly updated after a short delay
      setTimeout(() => {
        console.log("Mute state after toggle:", {
          localMuted: localCallState.isMuted,
          contextMuted: isMuted,
          isConnected: twilioConnected,
        });

        // If there's a mismatch between local and context state, sync with context state
        // This ensures the UI always reflects the actual mute state
        if (localCallState.isMuted !== isMuted) {
          console.warn(
            "Mute state mismatch detected, syncing with context state"
          );
          setLocalCallState((prev) => ({
            ...prev,
            isMuted: isMuted,
          }));
        }
      }, 300);
    } catch (error) {
      console.error("Error toggling mute state:", error);

      // If an error occurs, reset to the context state
      setLocalCallState((prev) => ({
        ...prev,
        isMuted: isMuted,
      }));
    }
  };

  // Update to track the call SID when connection object changes
  useEffect(() => {
    if (connection && connection.parameters && connection.parameters.CallSid) {
      setCallSid(connection.parameters.CallSid);
    } else {
      setCallSid(undefined);
    }
  }, [connection]);

  // Add TrialModeIndicator component
  const TrialModeIndicator = () => {
    // Return null to hide the trial mode indicator completely
    return null;

    /* Original implementation removed
    if (!isTrialMode) return null;

    // Add function to refresh trial usage
    const refreshTrialUsage = async () => {
      try {
        // Get stored identifiers
        const fingerprint = localStorage.getItem("zkypee_trial_fingerprint");
        const ipAddress = localStorage.getItem("zkypee_trial_ip_address");

        if (!fingerprint || !ipAddress) {
          console.error("[TRIAL UI] Missing fingerprint or IP address");
          return;
        }

        // Directly fetch from API endpoint for most up-to-date values
        console.log("[TRIAL UI] Refreshing trial usage directly from API");
        const response = await fetch(
          `/api/trial/get-usage?fingerprint=${encodeURIComponent(
            fingerprint
          )}&ipAddress=${encodeURIComponent(ipAddress)}`
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const usage = await response.json();
        console.log("[TRIAL UI] Current trial usage from API:", usage);

        // Update the UI with the latest data from the database
        // Use the context function to update the state
        setTrialCallsRemaining(usage.callsRemaining);
        console.log(
          "[TRIAL UI] Updated trial calls remaining to:",
          usage.callsRemaining
        );

        // If no calls remaining, show the conversion modal
        if (usage.callsRemaining <= 0) {
          console.log(
            "[TRIAL UI] No calls remaining, showing conversion modal"
          );
          setShowTrialConversionModal(true);
        }
      } catch (error) {
        console.error("[TRIAL UI] Error refreshing trial usage:", error);
      }
    };

    return (
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex justify-between items-center">
        <div className="flex-1">
          <span className="text-sm font-medium text-yellow-800">
            Trial Mode{" "}
            {localCallState.isConnected && `• ${trialTimeRemaining}s remaining`}
          </span>
          <div className="mt-1 text-xs text-yellow-700 flex items-center">
            <span>
              {trialCallsRemaining} trial call
              {trialCallsRemaining !== 1 ? "s" : ""} remaining
            </span>
            <button
              onClick={refreshTrialUsage}
              className="ml-2 text-blue-500 hover:text-blue-700"
              title="Refresh trial usage"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md transition-colors"
        >
          Sign Up
        </button>
      </div>
    );
    */
  };

  // Add handleTryNowClick function
  const handleTryNowClick = async () => {
    try {
      // Track the trial button click
      await trackEvent("trial_button_click", {
        location: "phone_dialer",
      });

      // Initialize trial mode
      const success = await initializeTrialMode();

      if (success) {
        // Track successful initialization
        await trackEvent("trial_initialized", {
          success: true,
        });
      } else {
        // Track failed initialization
        await trackEvent("trial_initialized", {
          success: false,
          error: error || "Unknown error",
        });
      }
    } catch (err) {
      console.error("Error starting trial:", err);
    }
  };

  // Update TrialConversionModal component
  const TrialConversionModal = () => {
    // Don't show the modal if the user is logged in or if it's not supposed to be shown
    if (!showTrialConversionModal || user) return null;

    // Track modal shown
    useEffect(() => {
      trackEvent("trial_conversion_modal_shown", {
        callsRemaining: trialCallsRemaining,
      });
    }, []);

    const handleCreateAccountClick = () => {
      // Track conversion intent
      trackEvent("trial_conversion_intent", {
        action: "create_account",
      });

      setShowTrialConversionModal(false);
      setShowAuth(true);
    };

    const handleMaybeLaterClick = () => {
      // Track conversion dismissed
      trackEvent("trial_conversion_intent", {
        action: "maybe_later",
      });

      setShowTrialConversionModal(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Your trial call has ended
          </h3>

          <p className="text-gray-600 mb-4">
            Ready to make more calls? Create an account to get started with full
            access.
          </p>

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h4 className="font-medium text-blue-800 mb-1">
              With a full account you get:
            </h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Unlimited call duration
              </li>
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Call anyone worldwide
              </li>
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Crystal clear HD audio
              </li>
              <li className="flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Save favorite contacts
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreateAccountClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Create Account
            </button>
            <button
              onClick={handleMaybeLaterClick}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add useEffect to initialize trial mode when component loads
  useEffect(() => {
    // If we're in trial mode but the device isn't ready, initialize it
    if (isTrialMode && !isReady && !initAttemptedRef.current) {
      console.log("Auto-initializing trial mode");
      initAttemptedRef.current = true;

      initializeTrialMode().then((success) => {
        console.log("Trial mode auto-initialization result:", success);
        // Reset the attempt flag after a delay to allow retries if needed
        setTimeout(() => {
          initAttemptedRef.current = false;
        }, 5000);
      });
    }
  }, [isTrialMode, isReady, initializeTrialMode]);

  // Add useEffect to refresh trial usage when component mounts
  useEffect(() => {
    // Skip all trial operations if user is logged in
    if (user) {
      return;
    }

    if (isTrialMode) {
      const refreshTrialUsageOnMount = async () => {
        try {
          // Get stored identifiers
          // Directly fetch from API endpoint for most up-to-date values
          console.log("[TRIAL UI] Initial refresh of trial usage from API");
          const response = await fetch(
            `/api/trial/get-usage?fingerprint=${encodeURIComponent(
              fingerprint
            )}&ipAddress=${encodeURIComponent(ipAddress)}`
          );

          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }

          const usage = await response.json();
          console.log("[TRIAL UI] Current trial usage from API:", usage);

          // Update the UI with the latest data from the database
          setTrialCallsRemaining(usage.callsRemaining);
          console.log(
            "[TRIAL UI] Updated trial calls remaining to:",
            usage.callsRemaining
          );

          // If no calls remaining, show the conversion modal ONLY if user is not logged in
          if (usage.callsRemaining <= 0 && !user) {
            console.log(
              "[TRIAL UI] No calls remaining, showing conversion modal"
            );
            setShowTrialConversionModal(true);
          }
        } catch (error) {
          console.error("[TRIAL UI] Error refreshing trial usage:", error);
        }
      };

      refreshTrialUsageOnMount();

      // Set up an interval to refresh the trial usage every few seconds
      const refreshInterval = setInterval(refreshTrialUsageOnMount, 3000);

      // Clean up interval on unmount
      return () => clearInterval(refreshInterval);
    }
  }, [isTrialMode, setTrialCallsRemaining, setShowTrialConversionModal, user]);

  // Auto-initialize trial mode for non-authenticated users
  useEffect(() => {
    const autoInitializeTrialMode = async () => {
      // Only auto-initialize if user is not logged in and trial mode is not active
      if (!loading && !user && !isTrialMode) {
        console.log("Auto-initializing trial mode for non-authenticated user");
        try {
          // Track the auto-initialization
          await trackEvent("trial_auto_initialized", {
            location: "phone_dialer",
          });

          // Initialize trial mode
          const success = await initializeTrialMode();

          if (success) {
            // Track successful initialization
            await trackEvent("trial_initialized", {
              success: true,
              method: "auto",
            });
          } else {
            // Track failed initialization
            await trackEvent("trial_initialized", {
              success: false,
              error: error || "Unknown error",
              method: "auto",
            });
          }
        } catch (err) {
          console.error("Error auto-starting trial:", err);
        }
      }
    };

    autoInitializeTrialMode();
  }, [loading, user, isTrialMode, initializeTrialMode, error]);

  // Modify the condition to never show the sign in or try now screen
  // Instead of:
  // if (!loading && !user && !isTrialMode) {
  //   return (
  //     ... sign in or try now UI ...
  //   );
  // }

  // Replace with just showing loading state while trial initializes:
  if (!loading && !user && !isTrialMode) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10">
        <h1 className="text-2xl font-bold mb-4">Initializing Dialer...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Setting up your trial experience</p>
      </div>
    );
  }

  // Modify the main return to include trial components
  return (
    <div className="w-full">
      {/* Remove trial indicator at the top */}
      {/* <TrialModeIndicator /> */}

      {/* Existing phone dialer UI */}
      <div className="flex flex-col w-full max-w-md mx-auto bg-white rounded-xl shadow-sm p-5 border border-gray-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Phone Dialer</h2>
          {twilioNumber && (
            <p className="text-sm text-gray-600">
              Calling from: <span className="font-medium">{twilioNumber}</span>
            </p>
          )}
        </div>

        {/* Show retry button if initialization failed */}
        {initializationFailed && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 mb-2">
              Failed to initialize the phone system. This could be due to a
              network issue.
            </p>
            <button
              onClick={handleRetryInitialization}
              disabled={initAttemptedRef.current}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
            >
              {initAttemptedRef.current ? "Retrying..." : "Retry Connection"}
            </button>
          </div>
        )}

        {/* Credit Balance - Only show for authenticated users, not trial users */}
        {!isTrialMode && (
          <div className="mb-4">
            <CreditBalance />
          </div>
        )}

        {/* Phone number input with country code */}
        <div
          className={`relative mb-4 ${
            localCallState.isConnected ? "opacity-50" : ""
          }`}
        >
          <div className="flex">
            {/* Country code selector */}
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCountryCodes(!showCountryCodes)}
                className="flex items-center justify-between w-28 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled={localCallState.isConnected}
              >
                <span className="flex items-center">
                  <span className="mr-2 text-lg">
                    {selectedCountryCode.flag}
                  </span>
                  <span>{selectedCountryCode.code}</span>
                </span>
                <ChevronDownIcon className="w-4 h-4 ml-1 text-gray-500" />
              </button>

              {/* Country code dropdown with search */}
              <AnimatePresence>
                {showCountryCodes && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 w-72 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden flex flex-col"
                  >
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchCountry}
                          onChange={(e) => setSearchCountry(e.target.value)}
                          placeholder="Search country or code..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchCountry && (
                          <button
                            onClick={() => setSearchCountry("")}
                            className="absolute right-3 top-2.5"
                          >
                            <XMarkIcon className="h-5 w-5 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-60">
                      {filteredCountryCodes.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center">
                          No countries found
                        </div>
                      ) : (
                        filteredCountryCodes.map((country) => (
                          <button
                            key={`${country.code}-${country.name}`}
                            type="button"
                            className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                            onClick={() => {
                              setSelectedCountryCode(country);
                              setShowCountryCodes(false);
                              setSearchCountry("");
                            }}
                          >
                            <span className="mr-2 text-lg">{country.flag}</span>
                            <span className="font-medium">{country.code}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              {country.name}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Phone number input */}
            <div className="relative flex-grow">
              <input
                type="tel"
                value={formatPhoneNumberForDisplay(phoneNumber)}
                onChange={(e) => {
                  // Filter non-numeric characters except for + at the beginning
                  const value = e.target.value;
                  const cleaned = value
                    .replace(/[^\d\s+()-]/g, "")
                    .replace(/\s+/g, " ");
                  setPhoneNumber(cleaned);
                }}
                placeholder="Enter phone number"
                className="w-full h-full px-4 py-2 border border-gray-300 border-l-0 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                disabled={localCallState.isConnected}
              />
              {phoneNumber && (
                <button
                  onClick={handleDelete}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={localCallState.isConnected}
                >
                  <BackspaceIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Credit Info for the call - Only show for authenticated users, not trial users */}
        {fullPhoneNumber && !isTrialMode && (
          <div className="mb-4">
            <CallCreditInfo
              phoneNumber={fullPhoneNumber}
              onCreditCheck={(hasEnough) => setHasEnoughCredits(hasEnough)}
            />
          </div>
        )}

        {/* Trial call info - Only show for trial users */}
        {/* Removed the 60-second trial call limitation message
        {isTrialMode && fullPhoneNumber && !localCallState.isConnected && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-blue-700">
                Trial calls are limited to 60 seconds
              </span>
            </div>
          </div>
        )}
        */}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
            {insufficientCredits && !isTrialMode && (
              <div className="mt-2">
                <Link
                  href="/credits"
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Add Credits
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Microphone permission status message */}
        {micPermissionStatus === "denied" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <p className="font-bold">Microphone access is required</p>
            <p className="text-sm">
              Please allow microphone access in your browser settings to make
              calls.
            </p>
          </div>
        )}

        {/* Add the Call Cost Timer component right before the keypad when on a call */}
        {localCallState.isConnected && (
          <CallCostTimer
            isConnected={localCallState.isConnected}
            startTime={callStartTime}
            rate={callRate}
            userId={user?.id}
            phoneNumber={fullPhoneNumber}
            callSid={callSid}
          />
        )}

        {/* Dialer buttons */}
        <div
          className={`grid grid-cols-3 gap-2 mb-4 ${
            localCallState.isConnected ? "opacity-50" : ""
          }`}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((num) => (
            <DialButton
              key={num}
              value={num.toString()}
              onClick={() => handleNumberClick(num.toString())}
              disabled={localCallState.isConnected}
              className={num === 0 ? "dial-button-zero" : ""}
            />
          ))}
        </div>

        {/* Call/Hangup button */}
        <div className="flex justify-center">
          {!localCallState.isConnected ? (
            <motion.button
              onClick={handleCall}
              disabled={
                localCallState.isConnecting ||
                (!isReady && !isTrialMode) || // Only check isReady for non-trial users
                !phoneNumber
              }
              className={`flex items-center justify-center w-16 h-16 rounded-full ${
                localCallState.isConnecting
                  ? "bg-yellow-500"
                  : phoneNumber && (isReady || isTrialMode) // Allow trial mode calls
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-300"
              } text-white transition-colors`}
              whileTap={{ scale: 0.95 }}
              whileHover={
                phoneNumber && (isReady || isTrialMode) ? { scale: 1.05 } : {}
              }
            >
              {localCallState.isConnecting ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <PhoneIcon className="h-8 w-8" />
              )}
            </motion.button>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <motion.button
                onClick={handleHangUp}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                <PhoneIcon className="h-8 w-8 rotate-135" />
              </motion.button>
              <motion.button
                onClick={handleMuteToggle}
                className={`p-4 rounded-full ${
                  localCallState.isMuted
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-700"
                } hover:bg-opacity-90 transition-colors`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                disabled={!twilioConnected}
              >
                {localCallState.isMuted ? (
                  <SpeakerXMarkIcon className="h-6 w-6" />
                ) : (
                  <SpeakerWaveIcon className="h-6 w-6" />
                )}
                <span className="sr-only">
                  {localCallState.isMuted ? "Unmute" : "Mute"}
                </span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Call Info component for in-call UI */}
        {localCallState.isConnected && (
          <div className="mt-4">
            <CallInfo />
          </div>
        )}
      </div>

      {/* Add trial conversion modal */}
      <TrialConversionModal />

      {/* Existing auth modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowAuth(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Auth onSuccess={() => setShowAuth(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
