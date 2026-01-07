"use client";

import Link from "next/link";
import { Play, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Card, Badge, Button, RecordingCardSkeleton } from "@/components/ui";
import { formatDate, formatDuration, truncateText } from "@/lib/utils";
import type { Recording, Transcript } from "@/types";

interface RecordingWithTranscript extends Recording {
  transcript?: Pick<Transcript, "text">;
}

interface RecentRecordingsProps {
  recordings: RecordingWithTranscript[];
  isLoading?: boolean;
  limit?: number;
}

export function RecentRecordings({
  recordings,
  isLoading = false,
  limit = 5,
}: RecentRecordingsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <RecordingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">No recordings yet</p>
            <p className="text-sm text-gray-500">
              Tap the record button to capture your first memory
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const displayedRecordings = recordings.slice(0, limit);

  return (
    <div className="space-y-3">
      {displayedRecordings.map((recording, index) => (
        <motion.div
          key={recording.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <RecordingCard recording={recording} />
        </motion.div>
      ))}

      {recordings.length > limit && (
        <Link href="/memories">
          <Button variant="ghost" className="w-full text-gray-500">
            View all {recordings.length} recordings
          </Button>
        </Link>
      )}
    </div>
  );
}

interface RecordingCardProps {
  recording: RecordingWithTranscript;
}

function RecordingCard({ recording }: RecordingCardProps) {
  const preview = recording.transcript?.text
    ? truncateText(recording.transcript.text, 100)
    : "Transcript not available";

  return (
    <Link href={`/memories?recording=${recording.id}`}>
      <Card hover className="p-4">
        <div className="flex items-start gap-4">
          {/* Play button */}
          <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
            <Play className="h-5 w-5 text-primary-500 ml-0.5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">
                {recording.title || formatDate(recording.date)}
              </span>
              {recording.title && (
                <Badge variant="default" className="text-xs">
                  {formatDate(recording.date)}
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-500 line-clamp-2">{preview}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(recording.duration_seconds)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
