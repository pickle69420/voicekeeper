import { encode } from "gpt-tokenizer";
import type { Word, Utterance, Chunk } from "@/types";

// Configuration
const MAX_TOKENS = 400; // Target chunk size
const OVERLAP_TOKENS = 50; // Context overlap between chunks

/**
 * Intelligent chunking algorithm for transcripts
 * Preserves speaker boundaries and sentence structure
 */
export function chunkTranscript(
  words: Word[],
  utterances?: Utterance[]
): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  // If we have utterances (speaker-segmented), use them
  if (utterances && utterances.length > 0) {
    for (const utterance of utterances) {
      const utteranceChunks = chunkUtterance(
        utterance,
        chunkIndex,
        MAX_TOKENS,
        OVERLAP_TOKENS
      );
      chunks.push(...utteranceChunks);
      chunkIndex += utteranceChunks.length;
    }
  } else {
    // Fall back to word-based chunking without speaker info
    const allText = words.map((w) => w.text).join(" ");
    const textChunks = splitBySentences(allText, MAX_TOKENS);

    for (const text of textChunks) {
      // Find word boundaries for this text
      const startWord = findWordByText(words, text, 0);
      const endWord = findWordByText(words, text, words.length - 1);

      chunks.push({
        text,
        index: chunkIndex++,
        start_time: startWord?.start || 0,
        end_time: endWord?.end || 0,
        word_count: text.split(/\s+/).length,
        token_count: encode(text).length,
        avg_confidence: calculateAvgConfidence(words),
      });
    }
  }

  return chunks;
}

/**
 * Chunk a single utterance (speaker turn)
 */
function chunkUtterance(
  utterance: Utterance,
  startIndex: number,
  maxTokens: number,
  overlapTokens: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const tokenCount = encode(utterance.text).length;

  // If utterance fits in one chunk, return as-is
  if (tokenCount <= maxTokens) {
    chunks.push({
      text: utterance.text,
      index: startIndex,
      start_time: utterance.start,
      end_time: utterance.end,
      speaker: utterance.speaker,
      word_count: utterance.words.length,
      token_count: tokenCount,
      avg_confidence: calculateAvgConfidence(utterance.words),
    });
    return chunks;
  }

  // Split large utterance by sentences
  const sentences = splitIntoSentences(utterance.text);
  let currentChunk = "";
  let currentWords: Word[] = [];
  let currentTokens = 0;
  let chunkIdx = startIndex;
  let prevChunkLastTokens = ""; // For overlap

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = encode(sentence).length;

    // If adding this sentence exceeds max, finalize current chunk
    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Add overlap from previous chunk if exists
      const chunkText = prevChunkLastTokens
        ? prevChunkLastTokens + " " + currentChunk
        : currentChunk;

      chunks.push({
        text: chunkText.trim(),
        index: chunkIdx++,
        start_time: currentWords[0]?.start || utterance.start,
        end_time: currentWords[currentWords.length - 1]?.end || utterance.end,
        speaker: utterance.speaker,
        word_count: chunkText.split(/\s+/).length,
        token_count: encode(chunkText).length,
        avg_confidence: calculateAvgConfidence(currentWords),
      });

      // Get last N tokens for overlap
      prevChunkLastTokens = getLastNTokensText(currentChunk, overlapTokens);

      currentChunk = sentence;
      currentWords = findWordsForSentence(utterance.words, sentence);
      currentTokens = sentenceTokens;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      currentWords.push(...findWordsForSentence(utterance.words, sentence));
      currentTokens += sentenceTokens;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkText = prevChunkLastTokens
      ? prevChunkLastTokens + " " + currentChunk
      : currentChunk;

    chunks.push({
      text: chunkText.trim(),
      index: chunkIdx,
      start_time: currentWords[0]?.start || utterance.start,
      end_time: currentWords[currentWords.length - 1]?.end || utterance.end,
      speaker: utterance.speaker,
      word_count: chunkText.split(/\s+/).length,
      token_count: encode(chunkText).length,
      avg_confidence: calculateAvgConfidence(currentWords),
    });
  }

  return chunks;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries (periods, question marks, exclamation marks)
  // Keep the punctuation with the sentence
  const regex = /[^.!?]+[.!?]+\s*/g;
  const sentences = text.match(regex);

  if (sentences) {
    return sentences.map((s) => s.trim());
  }

  // If no sentence boundaries found, return the whole text
  return [text];
}

/**
 * Split text by sentences while respecting token limits
 */
function splitBySentences(text: string, maxTokens: number): string[] {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = encode(sentence).length;

    if (currentTokens + sentenceTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      currentTokens = sentenceTokens;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Get the last N tokens worth of text from a string
 */
function getLastNTokensText(text: string, n: number): string {
  const words = text.split(/\s+/);
  const result: string[] = [];
  let tokenCount = 0;

  for (let i = words.length - 1; i >= 0 && tokenCount < n; i--) {
    const wordTokens = encode(words[i]).length;
    tokenCount += wordTokens;
    result.unshift(words[i]);
  }

  return result.join(" ");
}

/**
 * Find words that belong to a sentence
 */
function findWordsForSentence(words: Word[], sentence: string): Word[] {
  const sentenceWords = sentence.toLowerCase().split(/\s+/);
  const result: Word[] = [];

  let searchFrom = 0;
  for (const sw of sentenceWords) {
    for (let i = searchFrom; i < words.length; i++) {
      if (words[i].text.toLowerCase().includes(sw.replace(/[.!?,]/g, ""))) {
        result.push(words[i]);
        searchFrom = i + 1;
        break;
      }
    }
  }

  return result;
}

/**
 * Find a word by matching text
 */
function findWordByText(
  words: Word[],
  text: string,
  fallbackIndex: number
): Word | undefined {
  const firstWord = text.split(/\s+/)[0]?.toLowerCase();
  if (!firstWord) return words[fallbackIndex];

  for (const word of words) {
    if (word.text.toLowerCase() === firstWord) {
      return word;
    }
  }

  return words[fallbackIndex];
}

/**
 * Calculate average confidence of words
 */
function calculateAvgConfidence(words: Word[]): number {
  if (words.length === 0) return 1;
  const sum = words.reduce((acc, w) => acc + (w.confidence || 1), 0);
  return Math.round((sum / words.length) * 100) / 100;
}
