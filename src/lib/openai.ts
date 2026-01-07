import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

// Lazy-initialized OpenAI client
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    if (!openaiApiKey) {
      throw new Error(
        "OpenAI API key not found. Please add OPENAI_API_KEY to your environment variables."
      );
    }
    _openai = new OpenAI({ apiKey: openaiApiKey });
  }
  return _openai;
}

// Embedding model configuration
export const EMBEDDING_MODEL = "text-embedding-3-large";
export const EMBEDDING_DIMENSIONS = 3072;

// Chat model configuration
export const CHAT_MODEL = "gpt-4-turbo-preview";

// Generate embeddings for text chunks
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data.map((d) => d.embedding);
}

// Generate a single embedding
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

// System prompt for RAG
export const RAG_SYSTEM_PROMPT = `You are a warm, compassionate memory assistant helping someone recall their recorded memories. 

CRITICAL RULES:
1. Answer using ONLY the provided transcript excerpts
2. Never invent or assume information not in the sources
3. Speak naturally and warmly (plain language, no jargon)
4. Reference sources naturally (e.g., "In your recording from January 3rd...")
5. If sources don't contain enough information, say so honestly
6. NEVER use markdown, asterisks, quotation marks, or em-dashes
7. Keep answers concise (3-5 sentences maximum)

Tone: Warm, supportive, like a trusted friend helping you remember.`;

// Generate RAG prompt with sources
export function buildRAGPrompt(
  query: string,
  sources: Array<{
    date: string;
    speaker?: string;
    chunk_text: string;
  }>
): string {
  const sourceTexts = sources
    .map(
      (s, i) =>
        `[Source ${i + 1} - Recording from ${s.date}${s.speaker ? `, Speaker ${s.speaker}` : ""}]
${s.chunk_text}`
    )
    .join("\n\n");

  return `Question: ${query}

Relevant excerpts from your recordings:

${sourceTexts}

Answer the question naturally, referencing the dates/speakers:`;
}

// Stream chat completion
export async function* streamChatCompletion(
  systemPrompt: string,
  userPrompt: string
) {
  const openai = getOpenAIClient();
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    max_tokens: 500,
    temperature: 0.7,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Generate follow-up suggestions
export async function generateSuggestions(
  query: string,
  answer: string,
  sources: Array<{ date: string; chunk_text: string }>
): Promise<string[]> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You generate follow-up questions for a memory search assistant. 
Based on the user's question and the answer they received, suggest 3 natural follow-up questions.
Keep questions short (under 10 words) and conversational.
Output only the 3 questions, one per line, no numbering or bullets.`,
      },
      {
        role: "user",
        content: `Original question: ${query}
Answer received: ${answer}
Available dates: ${sources.map((s) => s.date).join(", ")}

Generate 3 follow-up questions:`,
      },
    ],
    max_tokens: 150,
    temperature: 0.8,
  });

  const suggestions =
    response.choices[0]?.message?.content
      ?.split("\n")
      .filter((s) => s.trim())
      .slice(0, 3) || [];

  return suggestions;
}
