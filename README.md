# EngageAI - Real-time Engagement Platform for Events



EngageAI is a cutting-edge platform designed to boost participant engagement during events, hackathons, and conferences. It provides real-time interaction tracking, engagement scoring, and AI-powered insights to make your events more interactive and data-driven.

## 🌟 Features

### 🗳️ Poll Participation System
- Real-time polls with multiple choice options
- Live results with percentage breakdown
- Time-limited polls with automatic expiration
- 5 points per poll response

### ❓ Q&A Interaction System
- Ask questions during sessions (8 points)
- Answer questions with official/unofficial responses (6/12 points)
- Upvote questions to prioritize (1 point)
- Real-time updates for all Q&A activities

### 📂 Resource Management
- Upload files (PDF, images, videos) or share links
- Track downloads with engagement scoring (3 points)
- File type detection with appropriate icons
- Download counters and user tracking

### ⏱️ Session Analytics
- Automatic tracking of session duration
- Real-time attendance monitoring
- Engagement heatmaps
- Participant activity timelines

### 🎯 AI-Powered Insights
- Real-time engagement scoring
- Participant clustering and behavior analysis
- Automated recommendations for organizers
- Session intelligence and topic detection

## 🚀 Quick Start

### Option 1: Try the Live Demo

Experience EngageAI instantly with our live demo:

🔗 [https://engage-ai-ruby.vercel.app/](https://engage-ai-ruby.vercel.app/)

### Option 2: Local Development Setup

#### Prerequisites
- Node.js 18+ and npm/yarn
- (Optional) Supabase account for custom backend
- (Optional) Google OAuth credentials for authentication

1. **Clone the repository**
   ```bash
   git clone https://github.com/mandeepsingh2007/EngageAI.git
   cd EngageAI/my-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server** (uses default demo settings)
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **For custom setup** (optional):
   - Create a `.env.local` file with your Supabase credentials
   - Set up your own Supabase project
   - Configure Google OAuth
5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### Advanced Setup (Optional)

If you want to set up your own backend:

1. **Set up Supabase**
   - Create a new project at [Supabase](https://supabase.com/)
   - Run the SQL from `database/schema.sql` in the SQL editor
   - Enable Row Level Security (RLS)
   - Configure Google OAuth in Authentication > Providers

2. **Configure environment variables**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

## 🛠️ Deployment

### Vercel (Recommended)

1. Push your code to a GitHub/GitLab repository
2. Import the project to Vercel
3. Add the same environment variables as in your `.env.local`
4. Deploy!

## 📊 Database Schema

Key tables:
- `users` - User profiles and authentication
- `sessions` - Event sessions
- `session_participants` - Tracks user participation in sessions
- `polls` and `poll_responses` - Poll management
- `questions` and `answers` - Q&A system
- `resources` - File and link resources
- `engagement_metrics` - Tracks all engagement activities

## 🤖 AI/ML Integration

EngageAI includes intelligent features like:
- Topic detection for sessions
- Smart participant clustering
- Engagement prediction
- Automated recommendations for organizers



## 🙏 Acknowledgments

- Built with Next.js, Supabase, and Tailwind CSS
- Icons by Lucide
- Real-time analytics powered by Supabase Realtime

## 📬 Contact

For support or questions, please open an issue on GitHub.
