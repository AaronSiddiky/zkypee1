"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TrialStats {
  totalTrials: number;
  completedCalls: number;
  conversions: number;
  conversionRate: number;
  averageDuration: number;
  trialsByDay: { date: string; count: number }[];
  conversionsByVariant: { variant: string; count: number; rate: number }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function TrialAnalyticsDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    // Only admins should be able to view this dashboard
    if (!user || !user.app_metadata?.roles?.includes("admin")) {
      setError("You don't have permission to view this page");
      setLoading(false);
      return;
    }

    async function fetchTrialStats() {
      try {
        setLoading(true);

        // Get date filter
        let dateFilter = "";
        if (dateRange === "7d") {
          dateFilter = "AND created_at > now() - interval '7 days'";
        } else if (dateRange === "30d") {
          dateFilter = "AND created_at > now() - interval '30 days'";
        }

        // Get total trials
        const { data: totalData, error: totalError } = await supabaseAdmin
          .from("trial_calls")
          .select("count")
          .eq("count", 1)
          .filter("created_at", "is", "not", "null");

        if (totalError) throw totalError;

        // Get completed calls (count > 0)
        const { data: completedData, error: completedError } =
          await supabaseAdmin
            .from("trial_calls")
            .select("count")
            .gt("count", 0)
            .filter("created_at", "is", "not", "null");

        if (completedError) throw completedError;

        // Get conversions
        const { data: conversionData, error: conversionError } =
          await supabaseAdmin
            .from("trial_calls")
            .select("count")
            .eq("converted_to_signup", true)
            .filter("created_at", "is", "not", "null");

        if (conversionError) throw conversionError;

        // Get average duration
        const { data: durationData, error: durationError } =
          await supabaseAdmin.rpc("get_average_trial_duration");

        if (durationError) throw durationError;

        // Get trials by day
        const { data: dailyData, error: dailyError } = await supabaseAdmin.rpc(
          "get_daily_trial_counts",
          { days_back: dateRange === "7d" ? 7 : 30 }
        );

        if (dailyError) throw dailyError;

        // Get conversions by variant
        const { data: variantData, error: variantError } =
          await supabaseAdmin.rpc("get_conversion_by_variant");

        if (variantError) throw variantError;

        // Format the data
        const totalTrials = totalData?.length || 0;
        const completedCalls = completedData?.length || 0;
        const conversions = conversionData?.length || 0;
        const conversionRate =
          totalTrials > 0 ? (conversions / totalTrials) * 100 : 0;
        const averageDuration = durationData?.[0]?.average_duration || 0;

        const trialsByDay =
          dailyData?.map((item: any) => ({
            date: new Date(item.day).toLocaleDateString(),
            count: item.count,
          })) || [];

        const conversionsByVariant =
          variantData?.map((item: any) => ({
            variant: item.variant,
            count: item.count,
            rate: item.conversion_rate * 100,
          })) || [];

        setStats({
          totalTrials,
          completedCalls,
          conversions,
          conversionRate,
          averageDuration,
          trialsByDay,
          conversionsByVariant,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching trial stats:", err);
        setError("Failed to load analytics data");
        setLoading(false);
      }
    }

    fetchTrialStats();
  }, [user, dateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        No trial data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Trial Analytics Dashboard
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange("7d")}
            className={`px-3 py-1 rounded-md ${
              dateRange === "7d"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange("30d")}
            className={`px-3 py-1 rounded-md ${
              dateRange === "30d"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange("all")}
            className={`px-3 py-1 rounded-md ${
              dateRange === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-700">Total Trials</h3>
          <p className="text-2xl font-bold text-blue-900">
            {stats.totalTrials}
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-700">
            Completed Calls
          </h3>
          <p className="text-2xl font-bold text-green-900">
            {stats.completedCalls}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-700">Conversions</h3>
          <p className="text-2xl font-bold text-purple-900">
            {stats.conversions}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-700">
            Conversion Rate
          </h3>
          <p className="text-2xl font-bold text-yellow-900">
            {stats.conversionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily trials chart */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Daily Trial Usage
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.trialsByDay}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Trials" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Variant conversion chart */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Conversion by Variant
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.conversionsByVariant}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="variant"
                >
                  {stats.conversionsByVariant.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed stats table */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Variant Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.conversionsByVariant.map((variant, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {variant.variant}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(variant.count * (variant.rate / 100))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {variant.rate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
