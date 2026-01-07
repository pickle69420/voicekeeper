# VoiceKeeper

A Progressive Web App for memory preservation through voice recording and AI-powered semantic search.

## Features

### 🎤 Voice Recording
- Real-time voice transcription using AssemblyAI
- Speaker diarization support
- Waveform visualization during recording
- Auto-save recordings with transcripts

### 🔍 Smart Search
- **Instant Search**: Fast keyword-based search
- **AI Search**: Semantic vector search using embeddings
- **RAG Answers**: AI-generated answers with source citations

### 🧠 Brain Training
- **Memory Match**: Card matching game for visual memory
- **Word Recall**: Word memorization exercise
- **Daily Quiz**: Knowledge questions for cognitive engagement

### 📊 Progress Tracking
- Activity streaks and statistics
- Weekly progress visualization
- Engagement scoring

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **Database**: PostgreSQL via Prisma ORM
- **Vector Storage**: Pinecone (optional)
- **Transcription**: AssemblyAI (real-time WebSocket)
- **AI**: OpenAI GPT-4 Turbo & text-embedding-3-large (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (local, Railway, Neon, etc.)
- AssemblyAI API key (required for transcription)
- Pinecone account (optional - for semantic search)
- OpenAI API key (optional - for RAG answers)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voicekeeper.git
cd voicekeeper
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.example`:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
# Database (required)
DATABASE_URL=postgresql://username:password@localhost:5432/voicekeeper

# AssemblyAI (required for transcription)
ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# Pinecone (optional - for semantic search)
PINECONE_API_KEY=your-pinecone-api-key

# OpenAI (optional - for RAG answers)
OPENAI_API_KEY=your-openai-api-key
```

5. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

6. (Optional) Create a Pinecone index for semantic search:
   - Name: `voicekeeper-memories`
   - Dimensions: 3072
   - Metric: cosine
   - Region: AWS us-east-1

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── assemblyai/    # AssemblyAI token endpoint
│   │   ├── recordings/    # Recording CRUD
│   │   ├── search/        # Search endpoints
│   │   ├── games/         # Game sessions
│   │   ├── progress/      # Stats endpoints
│   │   └── ...
│   ├── train/             # Brain games hub
│   ├── memories/          # Search page
│   ├── progress/          # Stats dashboard
│   ├── settings/          # Settings page
│   └── about/             # About page
├── components/
│   ├── ui/                # Base UI components
│   ├── navigation/        # TopBar, DrawerMenu
│   ├── recording/         # Recording components
│   ├── search/            # Search components
│   └── games/             # Brain game components
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── pinecone.ts        # Pinecone client
│   ├── openai.ts          # OpenAI client & RAG
│   ├── chunking.ts        # Transcript chunking
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # TypeScript types
```

## PWA Support

VoiceKeeper is a Progressive Web App with:
- Offline support via Service Worker
- App manifest for installation
- Background sync for offline recordings
- Push notifications for reminders

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with care for those experiencing memory challenges and their families
- Inspired by the need to preserve precious memories
