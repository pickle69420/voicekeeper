"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Brain,
  Mic,
  Search,
  Shield,
  Sparkles,
  Users,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { TopBar } from "@/components/navigation/top-bar";

const features = [
  {
    icon: Mic,
    title: "Voice Recording",
    description: "Capture memories naturally through voice with real-time transcription",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Find any memory using natural language powered by AI",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Brain Training",
    description: "Keep your mind sharp with cognitive exercises and games",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your memories are encrypted and only accessible to you",
    color: "from-orange-500 to-red-500",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="About VoiceKeeper" showBack />

      <div className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-8 pt-4 md:pt-8 space-y-6 md:space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 md:py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-purple-500/25"
          >
            <Heart className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">VoiceKeeper</h1>
          <p className="text-gray-600 md:text-lg">Preserving memories, one voice at a time</p>
          <p className="text-sm text-gray-500 mt-2">Version 1.0.0</p>
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Our Mission</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  VoiceKeeper was created to help preserve precious memories for those
                  experiencing early-stage memory challenges. We believe everyone deserves
                  to hold onto their stories, and their loved ones deserve to hear them.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm md:text-base font-medium text-gray-600 mb-3 md:mb-4 px-1">Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card className="p-4 h-full">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3`}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">How It Works</h3>
          <Card className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-sm font-medium text-purple-600">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Record</h4>
                <p className="text-xs text-gray-600">
                  Tap the microphone and speak naturally. Your voice is transcribed in real-time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-sm font-medium text-blue-600">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Store</h4>
                <p className="text-xs text-gray-600">
                  Your memories are securely stored and indexed for easy retrieval later.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-sm font-medium text-emerald-600">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Search</h4>
                <p className="text-xs text-gray-600">
                  Ask questions in natural language and VoiceKeeper will find relevant memories.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 text-sm font-medium text-orange-600">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Train</h4>
                <p className="text-xs text-gray-600">
                  Play brain games to keep your mind active and engaged.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* For Caregivers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For Caregivers</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  VoiceKeeper is designed to be simple and frustration-free. Large buttons,
                  clear feedback, and a gentle interface make it easy for your loved ones to
                  use independently while preserving their precious stories.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">Support</h3>
          <Card className="divide-y divide-gray-200">
            <a
              href="mailto:support@voicekeeper.app"
              className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Contact Support</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </a>
            <a
              href="https://voicekeeper.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Privacy Policy</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </a>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <p className="text-gray-600 text-sm">
            Made with <Heart className="w-3 h-3 inline text-red-400" /> for those who matter most
          </p>
          <p className="text-gray-700 text-xs mt-2">© 2024 VoiceKeeper. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
}
