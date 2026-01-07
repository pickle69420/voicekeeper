"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Square, AlertCircle } from "lucide-react";
import { cn, formatDuration, float32ToInt16 } from "@/lib/utils";
import { Button, Badge, ScrollArea, Spinner } from "@/components/ui";
import { WaveformVisualizer } from "./waveform-visualizer";
import type { Word, Utterance, AssemblyAIMessage } from "@/types";

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onSaveComplete: () => void;
}

type ModalState = "requesting" | "recording" | "stopping" | "saving" | "error";

export function RecordingModal({
  isOpen,
  onClose,
  onRecordingStart,
  onRecordingStop,
  onSaveComplete,
}: RecordingModalProps) {
  const [state, setState] = useState<ModalState>("requesting");
  const [duration, setDuration] = useState(0);
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setState("requesting");
      setDuration(0);
      setUtterances([]);
      setInterimText("");
      setError(null);
      setWords([]);
      chunksRef.current = [];
      startRecording();
    } else {
      cleanup();
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-scroll to bottom when new utterances come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [utterances, interimText]);

  const cleanup = useCallback(() => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ terminate_session: true }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Setup MediaRecorder for saving audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks

      // Setup AudioContext for visualization and real-time transcription
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Create analyser for waveform visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Get AssemblyAI token
      const tokenResponse = await fetch("/api/assemblyai/token", {
        method: "POST",
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get transcription token");
      }

      const { token } = await tokenResponse.json();

      // Connect to AssemblyAI WebSocket
      const ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        
        // Create processor for sending audio to AssemblyAI
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm = float32ToInt16(inputData);
            ws.send(pcm.buffer);
          }
        };

        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

        setState("recording");
        onRecordingStart();
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as AssemblyAIMessage;
        handleAssemblyAIMessage(data);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please try again.");
        setState("error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };
    } catch (err) {
      console.error("Error starting recording:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Microphone access denied. Please allow microphone access to record.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to start recording. Please try again.");
      }
      setState("error");
    }
  };

  const handleAssemblyAIMessage = (data: AssemblyAIMessage) => {
    if (data.message_type === "PartialTranscript") {
      setInterimText(data.text);
    } else if (data.message_type === "FinalTranscript") {
      setInterimText("");
      
      if (data.text.trim()) {
        // Store words
        const newWords: Word[] = data.words.map((w) => ({
          text: w.text,
          start: w.start / 1000, // Convert ms to seconds
          end: w.end / 1000,
          confidence: w.confidence,
          speaker: w.speaker || "A",
        }));

        setWords((prev) => [...prev, ...newWords]);

        // Group by speaker for display
        const speaker = data.words[0]?.speaker || "A";
        const startTime = data.words[0]?.start / 1000 || 0;
        const endTime = data.words[data.words.length - 1]?.end / 1000 || 0;

        setUtterances((prev) => {
          // If same speaker as last utterance, append to it
          const lastUtterance = prev[prev.length - 1];
          if (lastUtterance && lastUtterance.speaker === speaker) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastUtterance,
                text: lastUtterance.text + " " + data.text,
                end: endTime,
                words: [...lastUtterance.words, ...newWords],
              },
            ];
          }

          // New speaker or first utterance
          return [
            ...prev,
            {
              speaker,
              text: data.text,
              start: startTime,
              end: endTime,
              words: newWords,
            },
          ];
        });
      }
    }
  };

  const handleStopRecording = async () => {
    setState("stopping");
    onRecordingStop();

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ terminate_session: true }));
      wsRef.current.close();
    }

    // Stop processor
    if (processorRef.current) {
      processorRef.current.disconnect();
    }

    // Stop media recorder and wait for data
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Save recording
    await saveRecording();
  };

  const saveRecording = async () => {
    setState("saving");

    try {
      // Combine audio chunks into a single blob
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

      // Create form data
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording-${Date.now()}.webm`);
      formData.append("duration", duration.toString());
      formData.append("words", JSON.stringify(words));
      formData.append("utterances", JSON.stringify(utterances));
      formData.append(
        "text",
        utterances.map((u) => u.text).join(" ")
      );

      // Send to API
      const response = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to save recording");
      }

      onSaveComplete();
    } catch (err) {
      console.error("Error saving recording:", err);
      setError("Failed to save recording. Please try again.");
      setState("error");
    }
  };

  const handleClose = () => {
    if (state === "recording") {
      // Confirm before closing while recording
      if (window.confirm("Stop recording and discard?")) {
        cleanup();
        onClose();
      }
    } else {
      cleanup();
      onClose();
    }
  };

  // Get speaker color
  const getSpeakerColor = (speaker: string) => {
    const colors: Record<string, string> = {
      A: "bg-primary-50 text-primary-600",
      B: "bg-success-50 text-success-600",
      C: "bg-warning-50 text-warning-600",
    };
    return colors[speaker] || colors.A;
  };

  // Get word confidence styling
  const getConfidenceClass = (confidence: number) => {
    if (confidence < 0.7) return "text-warning-500";
    return "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
            <span className="text-base font-medium text-gray-500">
              {state === "recording"
                ? "Recording"
                : state === "stopping"
                ? "Stopping..."
                : state === "saving"
                ? "Saving..."
                : state === "error"
                ? "Error"
                : "Starting..."}
            </span>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Timer and Waveform */}
          <div className="px-6 py-8 text-center">
            <motion.p
              key={duration}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="font-mono text-5xl font-semibold text-gray-900 tabular-nums"
            >
              {formatDuration(duration)}
            </motion.p>

            <div className="mt-6 bg-gray-100 rounded-lg p-4">
              <WaveformVisualizer
                isRecording={state === "recording"}
                audioContext={audioContextRef.current}
                analyser={analyserRef.current}
              />
            </div>
          </div>

          {/* Transcript */}
          <div className="flex-1 px-4 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div ref={scrollRef} className="space-y-4 pb-4">
                {utterances.length === 0 && state === "recording" && (
                  <p className="text-center text-gray-400 py-8">
                    Start speaking...
                  </p>
                )}

                {utterances.map((utterance, idx) => (
                  <div key={idx} className="space-y-1">
                    <Badge
                      variant="primary"
                      className={cn("text-xs", getSpeakerColor(utterance.speaker))}
                    >
                      Speaker {utterance.speaker}
                    </Badge>
                    <p className="text-lg leading-relaxed text-gray-900">
                      {utterance.words.map((word, widx) => (
                        <span
                          key={widx}
                          className={cn(getConfidenceClass(word.confidence))}
                        >
                          {word.text}{" "}
                        </span>
                      ))}
                    </p>
                  </div>
                ))}

                {/* Interim text */}
                {interimText && (
                  <p className="text-lg leading-relaxed text-gray-400 italic">
                    {interimText}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Error message */}
          {state === "error" && error && (
            <div className="px-4 py-3 mx-4 bg-error-50 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-error-500 shrink-0" />
              <p className="text-base text-error-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 safe-bottom">
            {state === "requesting" && (
              <div className="flex items-center justify-center gap-3 h-12">
                <Spinner size="md" />
                <span className="text-gray-500">Preparing to record...</span>
              </div>
            )}

            {state === "recording" && (
              <Button
                onClick={handleStopRecording}
                className="w-full bg-error-500 hover:bg-error-600 active:bg-error-700"
              >
                <Square className="h-5 w-5" />
                Stop Recording
              </Button>
            )}

            {(state === "stopping" || state === "saving") && (
              <div className="flex items-center justify-center gap-3 h-12">
                <Spinner size="md" />
                <span className="text-gray-500">
                  {state === "stopping" ? "Stopping..." : "Saving your memory..."}
                </span>
              </div>
            )}

            {state === "error" && (
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={startRecording} className="flex-1">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
