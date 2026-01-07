import { Pinecone, Index } from "@pinecone-database/pinecone";
import type { PineconeMetadata } from "@/types";

const pineconeApiKey = process.env.PINECONE_API_KEY;

// Index name for VoiceKeeper
export const PINECONE_INDEX_NAME = "voicekeeper-memories";

// Lazy-initialized Pinecone client
let _pinecone: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!_pinecone) {
    if (!pineconeApiKey) {
      throw new Error(
        "Pinecone API key not found. Please add PINECONE_API_KEY to your environment variables."
      );
    }
    _pinecone = new Pinecone({ apiKey: pineconeApiKey });
  }
  return _pinecone;
}

// Get index reference
export function getPineconeIndex(): Index<PineconeMetadata> {
  return getPineconeClient().index<PineconeMetadata>(PINECONE_INDEX_NAME);
}

// Vector operations
export async function upsertVectors(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: PineconeMetadata;
  }>
) {
  const index = getPineconeIndex();
  
  // Batch upsert in chunks of 100
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
  }
  
  return { upserted: vectors.length };
}

export async function queryVectors(
  vector: number[],
  topK: number = 5,
  filter?: Record<string, unknown>
) {
  const index = getPineconeIndex();
  
  const results = await index.query({
    vector,
    topK,
    includeMetadata: true,
    filter,
  });
  
  return results.matches || [];
}

export async function deleteVectorsByRecordingId(recordingId: string) {
  const index = getPineconeIndex();
  
  // Delete all vectors with this recording_id prefix
  await index.deleteMany({
    filter: { recording_id: { $eq: recordingId } },
  });
}

export async function getIndexStats() {
  const index = getPineconeIndex();
  return await index.describeIndexStats();
}
