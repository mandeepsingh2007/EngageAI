# EngageAI - Complete Engagement Tracking Setup

## 🚀 Quick Setup Guide

### 1. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire content from `database/schema.sql`
4. Run the SQL script to create all tables, functions, and triggers

### 2. Storage Setup (for Resources)
1. In Supabase dashboard, go to Storage
2. Create a new bucket called `resources`
3. Set the bucket to public
4. Add the following RLS policy for the resources bucket:
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload resources" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'resources');

-- Allow public access to view files
CREATE POLICY "Public can view resources" ON storage.objects
FOR SELECT USING (bucket_id = 'resources');
```

### 3. Environment Variables
Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Features Implemented

### ✅ Poll Participation
- **Real-time polls** with multiple choice options
- **Live results** with percentage breakdown
- **Time-limited polls** with automatic expiration
- **Engagement scoring** (5 points per poll response)

### ✅ Q&A Interactions
- **Ask questions** during sessions
- **Answer questions** with official/unofficial responses
- **Upvote questions** to prioritize important ones
- **Real-time updates** for all Q&A activities
- **Engagement scoring**: 8 points for questions, 6 points for answers, 1 point for upvotes

### ✅ Resource Downloads
- **Upload files** (PDF, images, videos) or share links
- **Track downloads** with engagement scoring (3 points per download)
- **File type detection** with appropriate icons
- **Download counters** and user tracking

### ✅ Session Duration Tracking
- **Automatic tracking** when users join/leave sessions
- **Duration-based scoring** (1 point per minute)
- **Real-time attendance** monitoring

### ✅ Engagement Scoring System
- **Weighted scoring** for different activities:
  - Attendance: 10 points
  - Poll participation: 5 points
  - Asking questions: 8 points
  - Answering questions: 6 points (12 for official answers)
  - Resource downloads: 3 points
  - Question upvotes: 1 point
  - Session duration: 1 point per minute

### ✅ Real-time Dashboard
- **Live leaderboard** with user rankings
- **Session analytics** for organizers
- **Activity feed** with real-time updates
- **Personal engagement scores** with breakdowns

## 🎮 How to Use

### For Organizers:
1. **Create Sessions** and generate QR codes
2. **Create Polls** with multiple options and time limits
3. **Share Resources** by uploading files or adding links
4. **Monitor Engagement** through the analytics dashboard
5. **Answer Questions** with official responses for bonus points

### For Participants:
1. **Scan QR Code** to join sessions
2. **Participate in Polls** to earn engagement points
3. **Ask Questions** and upvote interesting ones
4. **Download Resources** shared by organizers
5. **Track Your Score** on the engagement leaderboard

## 📊 Engagement Metrics

### Scoring Breakdown:
- **Attendance**: 10 points (one-time)
- **Poll Response**: 5 points each
- **Question Asked**: 8 points each
- **Answer Given**: 6 points each (12 if organizer)
- **Question Upvote**: 1 point each
- **Resource Download**: 3 points each
- **Session Duration**: 1 point per minute

### Real-time Features:
- Live poll results
- Instant Q&A updates
- Real-time leaderboard
- Activity notifications
- Engagement score updates

## 🔧 Technical Architecture

### Database Tables:
- `sessions` - Session management
- `polls` & `poll_responses` - Poll system
- `questions` & `answers` - Q&A system
- `resources` & `resource_downloads` - Resource sharing
- `engagement_metrics` - Individual activity tracking
- `user_engagement_scores` - Aggregated scores
- `activities` - Real-time activity feed

### Real-time Features:
- Supabase Realtime subscriptions
- Automatic trigger-based scoring
- Live dashboard updates
- Session duration tracking

### Components:
- `Poll.tsx` - Interactive poll component
- `QASection.tsx` - Q&A interface
- `Resources.tsx` - Resource management
- `EngagementScore.tsx` - Score display and leaderboard
- `PollCreator.tsx` - Poll creation for organizers

## 🚀 Testing the System

### Test Flow:
1. **Setup Database** using the SQL schema
2. **Create a test session** as an organizer
3. **Generate QR code** for the session
4. **Join as participant** using the QR code
5. **Test all features**:
   - Create and respond to polls
   - Ask and answer questions
   - Upload and download resources
   - Check engagement scores

### QR Code Testing (Without Phone):
1. **Direct URL**: Navigate to `http://localhost:3000/join/[sessionId]`
2. **Browser Extension**: Use QR code scanner extensions
3. **Online Tools**: Use online QR code readers to decode the URL

## 📈 Analytics Dashboard

### For Organizers:
- Total participants count
- Active engagement metrics
- Average engagement scores
- Real-time activity monitoring
- Leaderboard with participant rankings

### For Participants:
- Personal engagement score
- Score breakdown by activity type
- Leaderboard ranking
- Activity history
- Achievement tracking

## 🎯 Hackathon Ready!

This system is now **complete and ready** for your hackathon presentation:

✅ **Real-time engagement tracking**
✅ **Comprehensive scoring system**
✅ **Interactive dashboard**
✅ **QR code session joining**
✅ **Multi-feature engagement** (polls, Q&A, resources)
✅ **Live analytics and leaderboards**

The platform successfully addresses the problem of tracking meaningful engagement at events and conferences, providing organizers with detailed insights into participant interaction and learning.
