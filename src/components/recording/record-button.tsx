"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordingModal } from "./recording-modal";

type RecordingState = "idle" | "recording" | "saving";

export function RecordButton() {
  const [state, setState] = useState<RecordingState>("idle");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = useCallback(() => {
    if (state === "idle") {
      setIsModalOpen(true);
    }
  }, [state]);

  const handleRecordingStart = useCallback(() => {
    setState("recording");
  }, []);

  const handleRecordingStop = useCallback(() => {
    setState("saving");
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setState("idle");
  }, []);

  const handleSaveComplete = useCallback(() => {
    setState("idle");
    setIsModalOpen(false);
  }, []);

  return (
    <>
      {/* Main Record Button */}
      <motion.button
        onClick={handleClick}
        disabled={state === "saving"}
        className={cn(
          "relative h-20 w-20 rounded-full flex items-center justify-center",
          "transition-all duration-200 focus:outline-none",
          "focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-2",
          state === "idle" && "bg-gray-50 shadow-lg hover:shadow-xl",
          state === "recording" && "bg-error-500 shadow-glow-red",
          state === "saving" && "bg-gray-200 cursor-not-allowed"
        )}
        animate={
          state === "idle"
            ? { scale: [1, 1.03, 1] }
            : { scale: 1 }
        }
        transition={
          state === "idle"
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 }
        }
        aria-label={
          state === "idle"
            ? "Start recording"
            : state === "recording"
            ? "Stop recording"
            : "Saving..."
        }
      >
        {/* Pulsing ring for idle state */}
        {state === "idle" && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary-200"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Icon */}
        {state === "idle" && <Mic className="h-8 w-8 text-primary-500" />}
        {state === "recording" && <Square className="h-6 w-6 text-white" />}
        {state === "saving" && (
          <motion.div
            className="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.button>

      {/* Recording Modal */}
      <RecordingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onRecordingStart={handleRecordingStart}
        onRecordingStop={handleRecordingStop}
        onSaveComplete={handleSaveComplete}
      />
    </>
  );
}
