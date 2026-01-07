"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  isRecording: boolean;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  className?: string;
}

export function WaveformVisualizer({
  isRecording,
  audioContext,
  analyser,
  className,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>(0);

  const draw = useCallback(() => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bars
    const barWidth = 3;
    const gap = 2;
    const barCount = Math.floor(canvas.width / (barWidth + gap));
    const step = Math.floor(bufferLength / barCount);

    ctx.fillStyle = "#4B8FFF"; // primary-500

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex];
      const percent = value / 255;
      const height = Math.max(4, percent * canvas.height * 0.8);
      const x = i * (barWidth + gap);
      const y = (canvas.height - height) / 2;

      // Rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, height, 1.5);
      ctx.fill();
    }

    animationIdRef.current = requestAnimationFrame(draw);
  }, [analyser]);

  useEffect(() => {
    if (isRecording && audioContext && analyser) {
      draw();
    } else {
      cancelAnimationFrame(animationIdRef.current);
    }

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [isRecording, audioContext, analyser, draw]);

  // Draw idle state when not recording
  useEffect(() => {
    if (!isRecording && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#EAEDF2"; // gray-200

      const barWidth = 3;
      const gap = 2;
      const barCount = Math.floor(canvas.width / (barWidth + gap));

      for (let i = 0; i < barCount; i++) {
        const height = 8;
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 1.5);
        ctx.fill();
      }
    }
  }, [isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className={cn("w-full h-[60px]", className)}
    />
  );
}
