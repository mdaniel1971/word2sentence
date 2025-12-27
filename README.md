# VocabQuiz - Vocabulary Learning App

A Next.js application for learning vocabulary through interactive quizzes. Upload your vocabulary lists from JSON files and test your knowledge with multiple choice or type-answer quizzes.

## Features

- **JSON File Upload**: Import vocabulary lists from JSON files
- **Interactive Quizzes**: Multiple choice and type-answer formats
- **Bidirectional Translation**: Practice source→target or target→source
- **Progress Tracking**: Monitor your learning with detailed statistics
- **RTL Support**: Full support for Arabic and other RTL languages
- **Beautiful Dark Theme**: Gold/amber accents inspired by Islamic manuscripts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm
- Supabase account (free tier works)

### 1. Install Dependencies

```bash
cd vocab-quiz
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Settings > API** and copy your project URL and anon key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## JSON File Format

Your vocabulary JSON files should follow this structure:

```json
[
  {
    "id": 1,
    "deck_id": "my-vocabulary",
    "word_type": "noun",
    "source_term": "كِتَابٌ",
    "target_term": "book",
    "details": {
      "source_plural": "كُتُبٌ",
      "target_plural": "books"
    }
  }
]
```

### Supported Word Types

- **Nouns/Adjectives**: Include `source_plural` and `target_plural` in details
- **Verbs**: Include `present`, `verbal_noun`, and `form` in details

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **File Upload**: react-dropzone

## License

MIT License
