#!/usr/bin/env bash
set -e

# Create .env from available environment variables (in Codespaces these come from repo Codespaces secrets)
cat > .env <<'EOF'
DATABASE_URL="${DATABASE_URL:-}"
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
ASSEMBLYAI_API_KEY="${ASSEMBLYAI_API_KEY:-}"
PINECONE_API_KEY="${PINECONE_API_KEY:-}"
NEXT_PUBLIC_VERCEL_URL="${NEXT_PUBLIC_VERCEL_URL:-}"
NEXTAUTH_URL="${NEXTAUTH_URL:-}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-}"
EOF

echo ".env written (values sourced from container environment)."
