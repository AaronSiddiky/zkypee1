"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import Auth from "./Auth";
import { useTwilio } from "../contexts/TwilioContext";
import TwilioDebugPanel from "./TwilioDebugPanel";
import CreditBalance from "./CreditBalance";
import Link from "next/link";
import CallInfo from "./CallInfo";
import LowCreditWarning from "./LowCreditWarning";

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
  { code: "+370", name: "Lithuania", flag: "🇱🇹" },
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

export default function PhoneDialer({ user, loading }: PhoneDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    countryCodes.find(c => c.code === "+1" && c.name === "United States") || 
    countryCodes.find(c => c.code === "+1") || 
    countryCodes[0]
  );
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const {
    isReady,
    isConnecting,
    isConnected,
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
  } = useTwilio();

  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phoneNumber]); // Add phoneNumber as dependency

  // Initialize Twilio when user is available
  useEffect(() => {
    if (user) {
      console.log("User available, initializing Twilio");
      initializeDevice();
      fetchTwilioNumber();
    }
  }, [user, initializeDevice]);

  // Fetch the Twilio phone number
  const fetchTwilioNumber = async () => {
    try {
      const response = await fetch("/api/twilio/phone-number");
      if (response.ok) {
        const data = await response.json();
        if (data.phoneNumber) {
          setTwilioNumber(data.phoneNumber);
        }
      }
    } catch (error) {
      console.error("Error fetching Twilio phone number:", error);
    }
  };

  const handleNumberClick = (num: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setPhoneNumber((prev) => prev + num);
  };

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber) {
      return;
    }

    if (!user) {
      setShowAuth(true);
      return;
    }

    // Format the phone number with country code
    const fullNumber = `${selectedCountryCode.code}${phoneNumber.replace(
      /\D/g,
      ""
    )}`;

    try {
      // Initialize the device if not already done
      if (!isReady) {
        const initialized = await initializeDevice();
        if (!initialized) {
          console.error("Failed to initialize Twilio device");
          return;
        }
      }

      // Make the call
      const callSuccess = await makeCall(fullNumber);
      
      if (!callSuccess && error?.includes("Authentication required")) {
        // If there's an authentication error, show the auth modal
        setShowAuth(true);
      }
    } catch (err) {
      console.error("Error making call:", err);
    }
  };

  const handleHangUp = () => {
    console.log("Hanging up call");
    hangUp();
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Render authentication UI if user is not logged in
  if (!loading && !user) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-4">Make a Call</h1>
        <p className="text-gray-600 mb-6">Enter a phone number to call</p>
        
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Authentication Required</p>
          <p className="text-sm">You need to sign in to make phone calls.</p>
        </div>
        
        <button
          onClick={() => setShowAuth(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors"
        >
          Sign In to Continue
        </button>
        
        {/* Auth Modal */}
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

  return (
    <div className="relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Make a Call</h2>
        <p className="text-gray-600">Enter a phone number to call</p>
      </div>

      {/* Credit balance display */}
      {user && (
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-2 hidden md:inline-block text-gray-600">
              Your credit balance:
            </span>
            <CreditBalance
              showBuyButton={true}
              className="font-semibold text-lg"
            />
          </div>
        </div>
      )}

      {/* Low credit warning */}
      {user && <LowCreditWarning threshold={15} />}

      {/* Call information during active call */}
      <CallInfo />

      {/* Phone number input */}
      <div className="relative mb-4">
        <div className="flex">
          {/* Country code selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountryCodes(!showCountryCodes)}
              className="flex items-center justify-between w-28 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <span className="flex items-center">
                <span className="mr-2 text-lg">{selectedCountryCode.flag}</span>
                <span>{selectedCountryCode.code}</span>
              </span>
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            {/* Country code dropdown */}
            {showCountryCodes && (
              <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {countryCodes.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      setSelectedCountryCode(country);
                      setShowCountryCodes(false);
                    }}
                  >
                    <span className="mr-2 text-lg">{country.flag}</span>
                    <span>{country.code}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      {country.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone number input */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
            className="w-full px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {phoneNumber && (
          <button
            onClick={handleDelete}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4.586 1.707a1 1 0 00-1.414 1.414L11.586 10l-1.707 1.707a1 1 0 101.414 1.414L13 11.414l1.707 1.707a1 1 0 001.414-1.414L14.414 10l1.707-1.707a1 1 0 00-1.414-1.414L13 8.586l-1.707-1.707z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
          {insufficientCredits && (
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

      {/* Dialer buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-md transition-colors"
            disabled={isConnected}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Call/Hangup button */}
      <div className="flex justify-center">
        {!isConnected ? (
          <button
            onClick={handleCall}
            disabled={isConnecting || !isReady}
            className={`flex items-center justify-center w-16 h-16 rounded-full ${
              isConnecting
                ? "bg-yellow-500"
                : isReady
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-300"
            } text-white transition-colors`}
          >
            {isConnecting ? (
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            )}
          </button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {/* Call controls - mute button and hang up button */}
            <div className="flex items-center space-x-4">
              {/* Mute button */}
              <button
                onClick={toggleMute}
                className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  isMuted
                    ? "bg-gray-700 hover:bg-gray-800"
                    : "bg-gray-500 hover:bg-gray-600"
                } text-white transition-colors`}
                title={isMuted ? "Unmute call" : "Mute call"}
              >
                {isMuted ? (
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
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
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
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                )}
              </button>

              {/* Hang up button */}
              <button
                onClick={handleHangUp}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="End call"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
            </div>

            {/* Mute status text */}
            <span className="text-sm text-gray-600">
              {isMuted ? "Muted" : "Unmute"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
