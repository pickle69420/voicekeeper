"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/navigation";
import { RecordButton, RecentRecordings } from "@/components/recording";
import { Flame, Clock } from "lucide-react";
import type { Recording, Transcript } from "@/types";

interface RecordingWithTranscript extends Recording {
  transcript?: Pick<Transcript, "text">;
}

export default function HomePage() {
  const [recordings, setRecordings] = useState<RecordingWithTranscript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    fetchRecordings();
    fetchStats();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await fetch("/api/recordings?limit=5");
      const data = await response.json();

      if (data.success) {
        setRecordings(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch recordings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();

      if (data.success) {
        setStreak(data.data?.current_streak || 0);
        setTotalMinutes(Math.round((data.data?.total_seconds || 0) / 60));
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <main className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Hero Section with Record Button */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-gray-900 mb-2">
            Capture a Memory
          </h1>
          <p className="text-gray-500 mb-8 md:text-lg">
            Tap to start recording your thoughts
          </p>

          <div className="flex justify-center mb-8">
            <RecordButton />
          </div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-2 text-gray-500">
              <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
              <span className="font-medium md:text-lg">{streak} day streak</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-primary-500" />
              <span className="font-medium md:text-lg">{totalMinutes} min recorded</span>
            </div>
          </div>
        </section>

        {/* Recent Recordings */}
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-gray-900">
              Recent Memories
            </h2>
          </div>

          <RecentRecordings
            recordings={recordings}
            isLoading={isLoading}
            limit={5}
          />
        </section>
      </main>
    </div>
  );
}
