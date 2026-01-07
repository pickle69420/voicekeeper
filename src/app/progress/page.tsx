"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Mic,
  Search,
  Clock,
  Target,
  Flame,
  ChevronRight,
  BarChart3,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/navigation/top-bar";
import { Skeleton } from "@/components/ui/loading";
import { formatDuration, cn } from "@/lib/utils";
import Link from "next/link";

interface OverallStats {
  totalRecordings: number;
  totalDuration: number;
  totalTranscriptWords: number;
  totalSearches: number;
  totalGamesPlayed: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
}

interface WeeklyActivity {
  day: string;
  recordings: number;
  games: number;
  searches: number;
}

interface RecentActivity {
  id: string;
  type: "recording" | "game" | "search";
  title: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function ProgressPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "insights">("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/progress/stats"),
        fetch("/api/progress/activity"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setWeeklyActivity(statsData.weeklyActivity || []);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities || []);
      }
    } catch (error) {
      console.error("Failed to load progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "recording":
        return <Mic className="w-4 h-4 text-purple-400" />;
      case "game":
        return <Brain className="w-4 h-4 text-emerald-400" />;
      case "search":
        return <Search className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMaxActivity = () => {
    if (!weeklyActivity.length) return 1;
    return Math.max(
      ...weeklyActivity.map((d) => d.recordings + d.games + d.searches),
      1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <TopBar title="Your Progress" showBack />
        <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-8 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Your Progress" showBack />

      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-8 space-y-6 md:space-y-8">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-200 rounded-xl">
          {(["overview", "activity", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            {/* Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-5 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-purple-500/20 border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="text-sm text-gray-400">Current Streak</span>
                    </div>
                    <p className="text-4xl font-bold text-gray-900">
                      {stats?.currentStreak || 0}
                      <span className="text-lg text-gray-500 ml-1">days</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Best: {stats?.longestStreak || 0} days
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalRecordings || 0}
                    </p>
                    <p className="text-xs text-gray-500">Recordings</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDuration(stats?.totalDuration || 0)}
                    </p>
                    <p className="text-xs text-gray-500">Recorded</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalGamesPlayed || 0}
                    </p>
                    <p className="text-xs text-gray-500">Games Played</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalSearches || 0}
                    </p>
                    <p className="text-xs text-gray-500">Searches</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Weekly Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">This Week</h3>
                  <Badge variant="secondary">{weeklyActivity.length} active days</Badge>
                </div>
                
                <div className="flex items-end justify-between gap-2 h-32">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                    const activity = weeklyActivity.find((w) => w.day === day);
                    const total = activity
                      ? activity.recordings + activity.games + activity.searches
                      : 0;
                    const height = (total / getMaxActivity()) * 100;

                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-full flex flex-col-reverse">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 4)}%` }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                            className={cn(
                              "w-full rounded-full",
                              total > 0
                                ? "bg-gradient-to-t from-purple-600 to-purple-400"
                                : "bg-gray-300"
                            )}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{day[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              <Link href="/">
                <Card className="p-4 hover:border-purple-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <Mic className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Record</p>
                      <p className="text-xs text-gray-500">Add memory</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </Card>
              </Link>

              <Link href="/train">
                <Card className="p-4 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                      <Brain className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Train</p>
                      <p className="text-xs text-gray-500">Play games</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          </>
        )}

        {activeTab === "activity" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>

            {recentActivity.length === 0 ? (
              <Card className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent activity</p>
                <p className="text-sm text-gray-600 mt-1">
                  Start recording or playing games to see your activity here
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            activity.type === "recording"
                              ? "default"
                              : activity.type === "game"
                              ? "success"
                              : "secondary"
                          }
                          className="text-xs capitalize"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "insights" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Memory Bank Stats */}
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Memory Bank</h3>
                  <p className="text-sm text-gray-500">Your recorded memories</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total words transcribed</span>
                  <span className="font-medium text-gray-900">
                    {(stats?.totalTranscriptWords || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average recording length</span>
                  <span className="font-medium text-gray-900">
                    {stats?.totalRecordings
                      ? formatDuration(Math.round((stats.totalDuration || 0) / stats.totalRecordings))
                      : "0:00"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Memories searchable</span>
                  <span className="font-medium text-gray-900">
                    {stats?.totalRecordings || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Engagement Score */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Engagement Score</h3>
                    <p className="text-sm text-gray-500">Based on your activity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">
                    {calculateEngagementScore(stats)}%
                  </p>
                </div>
              </div>
              <Progress 
                value={calculateEngagementScore(stats)} 
                className="h-2 bg-gray-200"
              />
              <p className="text-sm text-gray-500 mt-3">
                {getEngagementMessage(calculateEngagementScore(stats))}
              </p>
            </Card>

            {/* Tips */}
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <h3 className="font-semibold text-gray-900 mb-3">Tips to Improve</h3>
              <ul className="space-y-2">
                {generateTips(stats).map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function calculateEngagementScore(stats: OverallStats | null): number {
  if (!stats) return 0;
  
  const recordingScore = Math.min(stats.totalRecordings * 10, 30);
  const gameScore = Math.min(stats.totalGamesPlayed * 5, 30);
  const streakScore = Math.min(stats.currentStreak * 5, 20);
  const searchScore = Math.min(stats.totalSearches * 2, 20);
  
  return Math.min(recordingScore + gameScore + streakScore + searchScore, 100);
}

function getEngagementMessage(score: number): string {
  if (score >= 80) return "Outstanding! You're making excellent use of VoiceKeeper.";
  if (score >= 60) return "Great progress! Keep up the consistent engagement.";
  if (score >= 40) return "Good start! Try to maintain a daily routine.";
  if (score >= 20) return "Building momentum. Every recording and game helps!";
  return "Welcome! Start recording memories and playing games to boost your score.";
}

function generateTips(stats: OverallStats | null): string[] {
  const tips: string[] = [];
  
  if (!stats || stats.totalRecordings < 5) {
    tips.push("Record more memories - try capturing something from your day");
  }
  if (!stats || stats.totalGamesPlayed < 10) {
    tips.push("Play brain games daily to exercise your cognitive skills");
  }
  if (!stats || stats.currentStreak < 3) {
    tips.push("Build a streak by using VoiceKeeper every day");
  }
  if (!stats || stats.totalSearches < 5) {
    tips.push("Use search to revisit and reinforce your memories");
  }
  
  if (tips.length === 0) {
    tips.push("You're doing great! Keep maintaining your routine");
    tips.push("Try exploring different types of brain games");
    tips.push("Consider recording stories from your past");
  }
  
  return tips.slice(0, 3);
}
