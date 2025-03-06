import React from "react";
import { useTwilio } from "@/contexts/TwilioContext";

// Component to display Twilio URL error instructions
export const TwilioUrlErrorGuide: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-red-800 font-medium">Twilio Configuration Error</h3>
      <p className="text-red-700 mt-1">
        Twilio requires a publicly accessible URL to make calls. When running
        locally, you need to:
      </p>
      <ol className="list-decimal list-inside text-red-700 mt-2 space-y-1">
        <li>
          Install ngrok:{" "}
          <code className="bg-red-100 px-1 rounded">npm install -g ngrok</code>
        </li>
        <li>
          Run ngrok:{" "}
          <code className="bg-red-100 px-1 rounded">ngrok http 3001</code>
        </li>
        <li>Copy the https URL from ngrok (e.g. https://abc123.ngrok.io)</li>
        <li>
          Add it to your .env.local file:{" "}
          <code className="bg-red-100 px-1 rounded">
            NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
          </code>
        </li>
        <li>Restart your Next.js server</li>
      </ol>
    </div>
  );
};

// Component to display error messages
export const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;

  // Check for specific Twilio URL error
  if (error.includes("publicly accessible URL")) {
    return <TwilioUrlErrorGuide />;
  }

  // Default error message
  return (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-700">{error}</p>
    </div>
  );
};
