"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Trash2,
  Download,
  HardDrive,
  Bell,
  Volume2,
  Info,
  ChevronRight,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TopBar } from "@/components/navigation/top-bar";
import { cn } from "@/lib/utils";

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
}

export default function SettingsPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [toggleSettings, setToggleSettings] = useState<SettingToggle[]>([
    {
      id: "notifications",
      label: "Daily Reminders",
      description: "Get reminded to record and train",
      enabled: true,
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "sounds",
      label: "Sound Effects",
      description: "Play sounds during games",
      enabled: true,
      icon: <Volume2 className="w-5 h-5" />,
    },
  ]);

  const handleToggle = (id: string) => {
    setToggleSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise((r) => setTimeout(r, 200));
      }

      // In a real implementation, this would call an API to generate the export
      const response = await fetch("/api/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voicekeeper-export-${new Date().toISOString().split("T")[0]}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/data", { method: "DELETE" });
      if (response.ok) {
        // Redirect to home after successful deletion
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopBar title="Settings & Privacy" showBack />

      <div className="max-w-2xl md:max-w-3xl mx-auto px-4 md:px-8 pt-4 md:pt-8 space-y-6 md:space-y-8">
        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">Privacy</h3>
          <Card className="divide-y divide-gray-200">
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Your Data is Private</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    All your recordings and data are stored securely. Only you have access
                    to your memories. We never share your data with third parties.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <HardDrive className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Local-First Storage</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your recordings are stored securely in the cloud with encryption.
                    Transcripts and embeddings are processed securely.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">Preferences</h3>
          <Card className="divide-y divide-gray-200">
            {toggleSettings.map((setting) => (
              <div key={setting.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                      {setting.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{setting.label}</h4>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.id)}
                    className={cn(
                      "w-12 h-7 rounded-full transition-colors relative",
                      setting.enabled ? "bg-purple-600" : "bg-gray-300"
                    )}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-1"
                      animate={{ left: setting.enabled ? 26 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </motion.div>

        {/* Data Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">Data Management</h3>
          <Card className="divide-y divide-gray-200">
            <button
              onClick={() => setShowExportDialog(true)}
              className="w-full p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Export Your Data</h4>
                    <p className="text-sm text-gray-500">
                      Download all your recordings and transcripts
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>

            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full p-4 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-400">Delete All Data</h4>
                    <p className="text-sm text-gray-500">
                      Permanently remove all your data
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </div>
            </button>
          </Card>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-600 mb-3 px-1">About</h3>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">VoiceKeeper</h4>
                <p className="text-sm text-gray-500">Version 1.0.0</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              VoiceKeeper helps preserve precious memories through voice recording
              and AI-powered search. Built with care for those experiencing memory
              challenges and their loved ones.
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Your Data</DialogTitle>
            <DialogDescription>
              Download a complete backup of all your recordings, transcripts, and game data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Your export will include:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  All audio recordings (MP3 format)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Full transcripts (TXT format)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Game history and statistics (JSON)
                </li>
              </ul>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Preparing export...</span>
                  <span className="text-gray-900">{exportProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportData}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Delete All Data
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your recordings, transcripts, and game
              data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This will permanently delete:
              </p>
              <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
                <li>All voice recordings</li>
                <li>All transcripts and embeddings</li>
                <li>All game history and progress</li>
                <li>Your activity streak</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Type <strong className="text-gray-900">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-red-500"
                placeholder="DELETE"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAllData}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Everything
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
