"use client";

import { useState, useCallback, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Play, Calendar, Loader2, MessageCircle } from "lucide-react";
import { Input, Button, Card, Badge } from "@/components/ui";
import { formatDate, formatTimestamp, debounce } from "@/lib/utils";
import type { RAGSource, StreamingSearchEvent } from "@/types";

interface InstantResult {
  recording_id: string;
  date: string;
  title?: string;
  duration_seconds: number;
  snippet: string;
  source_type: "keyword";
}

type SearchState = 
  | "idle" 
  | "typing" 
  | "instant" 
  | "streaming" 
  | "done" 
  | "error";

export function AdvancedSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [instantResults, setInstantResults] = useState<InstantResult[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<RAGSource[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced instant search
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const performInstantSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setInstantResults([]);
        setState("idle");
        return;
      }

      try {
        const response = await fetch(
          `/api/search/instant?q=${encodeURIComponent(searchQuery)}&limit=3`
        );
        const data = await response.json();

        if (data.success && data.data) {
          setInstantResults(data.data);
          setState("instant");
        }
      } catch (err) {
        console.error("Instant search error:", err);
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setState("typing");
    
    // Reset previous results
    setAnswer("");
    setSources([]);
    setSuggestions([]);
    setError(null);
    
    performInstantSearch(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    await performStreamingSearch(query);
  };

  const handleAskAI = () => {
    if (query.trim()) {
      performStreamingSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performStreamingSearch(suggestion);
  };

  const performStreamingSearch = async (searchQuery: string) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setState("streaming");
    setStatusMessage("");
    setAnswer("");
    setSources([]);
    setSuggestions([]);
    setError(null);
    setInstantResults([]);

    try {
      const response = await fetch("/api/search/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as StreamingSearchEvent;
              handleStreamEvent(event);
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was cancelled
        return;
      }
      console.error("Streaming search error:", err);
      setError("Something went wrong. Please try again.");
      setState("error");
    }
  };

  const handleStreamEvent = (event: StreamingSearchEvent) => {
    switch (event.type) {
      case "status":
        setStatusMessage(event.content || "");
        break;
      case "token":
        setAnswer((prev) => prev + (event.content || ""));
        break;
      case "sources":
        setSources(event.sources || []);
        break;
      case "suggestions":
        setSuggestions(event.suggestions || []);
        setState("done");
        break;
      case "error":
        setError(event.error || "An error occurred");
        setState("error");
        break;
      case "done":
        setState("done");
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search your memories or ask a question..."
            className="pl-12 pr-4 h-14 text-lg"
          />
        </div>
      </form>

      {/* Instant Results */}
      <AnimatePresence mode="wait">
        {state === "instant" && instantResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">
                Quick matches ({instantResults.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAskAI}
                className="text-primary-500"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Ask AI
              </Button>
            </div>

            {instantResults.map((result, idx) => (
              <InstantResultCard key={`${result.recording_id}-${idx}`} result={result} />
            ))}
          </motion.div>
        )}

        {/* Streaming Status */}
        {state === "streaming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 py-4"
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            <span className="text-gray-500">{statusMessage || "Processing..."}</span>
          </motion.div>
        )}

        {/* AI Answer */}
        {(state === "streaming" || state === "done") && answer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-primary-600" />
                </div>
                <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {answer}
                  {state === "streaming" && (
                    <span className="inline-block w-2 h-5 bg-primary-500 animate-pulse ml-1" />
                  )}
                </p>
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Sources
                  </h4>
                  <div className="space-y-2">
                    {sources.map((source, idx) => (
                      <SourceCard key={`${source.recording_id}-${idx}`} source={source} />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Follow-up Suggestions */}
        {state === "done" && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-gray-500">
              Related questions
            </h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-gray-600"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {state === "error" && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="p-6 bg-error-50 border border-error-200">
              <p className="text-error-600">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => performStreamingSearch(query)}
                className="mt-3"
              >
                Try again
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {state === "idle" && !query && (
        <div className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Search your memories
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Ask questions about your recordings or search for specific topics, people, or dates.
          </p>
        </div>
      )}
    </div>
  );
}

interface InstantResultCardProps {
  result: InstantResult;
}

function InstantResultCard({ result }: InstantResultCardProps) {
  return (
    <Card hover className="p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <Play className="h-4 w-4 text-primary-500 ml-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {result.title || formatDate(result.date)}
            </span>
            <Badge variant="default" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(result.date)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{result.snippet}</p>
        </div>
      </div>
    </Card>
  );
}

interface SourceCardProps {
  source: RAGSource;
}

function SourceCard({ source }: SourceCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <Play className="h-3 w-3 text-primary-500 ml-0.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {formatDate(source.date)}
          </span>
          {source.speaker && (
            <Badge variant="primary" className="text-xs">
              Speaker {source.speaker}
            </Badge>
          )}
          {source.start_time > 0 && (
            <span className="text-xs text-gray-400">
              at {formatTimestamp(source.start_time)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
