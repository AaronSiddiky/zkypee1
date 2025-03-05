"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SchemaButton from "./schema-button";

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [tablesExist, setTablesExist] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaSql, setSchemaSql] = useState<string | null>(null);
  const router = useRouter();

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // Check if tables exist and get schema on component mount
  useEffect(() => {
    async function checkTables() {
      try {
        setIsLoading(true);
        addLog("Checking if database tables exist...");

        // Check if tables exist
        const checkResponse = await fetch("/api/setup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operation: "check_tables" }),
        });

        const checkData = await checkResponse.json();

        if (checkData.exists) {
          addLog("✅ Database tables already exist!");
          setTablesExist(true);
          setSuccess(true);
        } else {
          addLog("❌ Database tables don't exist yet.");
          setTablesExist(false);

          // Get the schema SQL
          const schemaResponse = await fetch("/api/setup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ operation: "get_schema" }),
          });

          const schemaData = await schemaResponse.json();

          if (schemaData.success && schemaData.schema) {
            setSchemaSql(schemaData.schema);
            addLog("📝 SQL script loaded successfully.");
          } else {
            throw new Error("Failed to load SQL script");
          }
        }
      } catch (error) {
        console.error("Setup page error:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        addLog(`❌ ERROR: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }

    checkTables();
  }, []);

  // Function to try insert the current user when tables exist but we haven't set success
  const tryInsertUser = async () => {
    if (tablesExist && !success) {
      try {
        addLog("Trying to insert current user...");
        const response = await fetch("/api/setup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operation: "insert_users" }),
        });

        const data = await response.json();

        if (data.success) {
          addLog("✅ User inserted successfully!");
          setSuccess(true);
        } else if (data.needsSetup) {
          addLog(
            "❌ User table doesn't exist yet, please run the setup script."
          );
          setTablesExist(false);
        } else {
          addLog(`⚠️ Warning: ${data.error || "Error inserting user"}`);
        }
      } catch (error) {
        console.error("Error inserting user:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addLog(`⚠️ Warning: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This page will help you set up the required database tables for
              the credit system. You'll need to run a SQL script in your
              Supabase dashboard to create the tables.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Great news! Your database tables are already set up and ready to
                use.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        {success ? (
          <Link
            href="/credits"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Go to Credits Page
          </Link>
        ) : (
          <button
            onClick={tryInsertUser}
            disabled={isLoading || (!tablesExist && !schemaSql)}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors ${
              isLoading || (!tablesExist && !schemaSql)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {isLoading ? "Checking..." : "Check Database Status"}
          </button>
        )}
      </div>

      {!tablesExist && schemaSql && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">
            Database Setup Instructions
          </h2>
          <p className="text-sm text-blue-700 mb-4">
            Follow these steps to set up your database tables:
          </p>
          <ol className="list-decimal ml-5 text-sm text-blue-700 mb-4">
            <li>
              Go to your{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Supabase dashboard
              </a>
            </li>
            <li>
              Open the SQL Editor (click on the SQL icon in the left sidebar)
            </li>
            <li>Copy the SQL below and paste it into the editor</li>
            <li>Run the SQL script</li>
            <li>Come back to this page and click "Check Database Status"</li>
          </ol>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-sm">
            <p className="text-yellow-800 font-medium mb-1">
              Note about errors:
            </p>
            <p className="text-yellow-700">
              If you see an error like{" "}
              <code className="bg-yellow-100 px-2 py-0.5 rounded">
                "policy X already exists"
              </code>
              , don't worry! The script now includes commands to drop existing
              policies before creating them. This prevents conflicts if you're
              running the script multiple times.
            </p>
          </div>

          <SchemaButton schemaContent={schemaSql} />

          <div className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-300 max-h-60 overflow-y-auto mt-4">
            <pre>{schemaSql}</pre>
          </div>
        </div>
      )}

      <div className="bg-gray-800 text-green-400 p-4 rounded-lg text-sm font-mono h-72 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Checking database status...</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 ${
                log.startsWith("❌ ERROR:")
                  ? "text-red-400"
                  : log.startsWith("✅")
                  ? "text-green-400"
                  : log.startsWith("⚠️")
                  ? "text-yellow-400"
                  : ""
              }`}
            >
              &gt; {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
