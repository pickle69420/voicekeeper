// Environment variable type checking and validation
// These should be set in .env.local for development and Vercel dashboard for production

export const env = {
  // Database (Prisma)
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Pinecone (optional - for semantic search)
  pineconeApiKey: process.env.PINECONE_API_KEY ?? "",
  
  // OpenAI (optional - for RAG answers)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  
  // AssemblyAI
  assemblyaiApiKey: process.env.ASSEMBLYAI_API_KEY ?? "",
  
  // App config
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

// Check if running on server
export const isServer = typeof window === "undefined";

// Check if in production
export const isProd = env.nodeEnv === "production";

// Validate required env vars (call on server startup)
export function validateEnv() {
  const required = [
    "DATABASE_URL",
    "ASSEMBLYAI_API_KEY",
  ];
  
  const optional = [
    "PINECONE_API_KEY",
    "OPENAI_API_KEY",
  ];
  
  const missing = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(
      `Warning: Missing required environment variables: ${missing.join(", ")}`
    );
  }
  
  if (missingOptional.length > 0) {
    console.log(
      `Info: Optional features disabled (missing: ${missingOptional.join(", ")})`
    );
  }
  
  return missing.length === 0;
}
