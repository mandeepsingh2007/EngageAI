-- EngageAI Database Schema
-- Run this in your Supabase SQL Editor

-- Sessions table (if not exists)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  organizer_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('organizer', 'participant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendance table (if not exists)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES sessions(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, session_id)
);

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options: ["Option 1", "Option 2", ...]
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE
);

-- Poll responses table
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id),
  user_id UUID REFERENCES auth.users(id),
  selected_option TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_id, user_id)
);

-- Q&A Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES auth.users(id),
  question TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Q&A Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES auth.users(id),
  answer TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false, -- true if answered by organizer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Question upvotes table
CREATE TABLE IF NOT EXISTS question_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(question_id, user_id)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT, -- 'pdf', 'image', 'video', 'link'
  file_size INTEGER, -- in bytes
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Resource downloads table
CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id),
  user_id UUID REFERENCES auth.users(id),
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(resource_id, user_id)
);

-- Engagement metrics table
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES sessions(id),
  activity_type TEXT NOT NULL, -- 'attendance', 'poll', 'question', 'answer', 'resource_download', 'upvote'
  activity_id UUID, -- reference to specific activity (poll_id, question_id, etc.)
  score INTEGER NOT NULL DEFAULT 0,
  metadata JSONB, -- additional data about the activity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User engagement scores (aggregated)
CREATE TABLE IF NOT EXISTS user_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID REFERENCES sessions(id),
  total_score INTEGER DEFAULT 0,
  attendance_score INTEGER DEFAULT 0,
  poll_score INTEGER DEFAULT 0,
  qna_score INTEGER DEFAULT 0,
  resource_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, session_id)
);

-- Activities table (for real-time updates)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  type TEXT NOT NULL, -- 'poll', 'qna', 'resource', 'announcement'
  title TEXT NOT NULL,
  data JSONB, -- activity-specific data
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Sessions: Users can read all, organizers can create/update their own
CREATE POLICY "Users can view sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Organizers can create sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their sessions" ON sessions FOR UPDATE USING (auth.uid() = organizer_id);

-- Users: Users can read all, update their own
CREATE POLICY "Users can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own record" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (auth.uid() = id);

-- Attendance: Users can read all, insert their own
CREATE POLICY "Users can view attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Users can mark their attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their attendance" ON attendance FOR UPDATE USING (auth.uid() = user_id);

-- Polls: Users can read all, organizers can create
CREATE POLICY "Users can view polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Organizers can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Organizers can update their polls" ON polls FOR UPDATE USING (auth.uid() = created_by);

-- Poll responses: Users can read all, insert their own
CREATE POLICY "Users can view poll responses" ON poll_responses FOR SELECT USING (true);
CREATE POLICY "Users can submit poll responses" ON poll_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Questions: Users can read all, insert their own
CREATE POLICY "Users can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Users can ask questions" ON questions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers: Users can read all, insert their own
CREATE POLICY "Users can view answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Users can submit answers" ON answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Question upvotes: Users can read all, insert their own
CREATE POLICY "Users can view upvotes" ON question_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can upvote questions" ON question_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resources: Users can read all, organizers can create
CREATE POLICY "Users can view resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Organizers can create resources" ON resources FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Resource downloads: Users can read all, insert their own
CREATE POLICY "Users can view downloads" ON resource_downloads FOR SELECT USING (true);
CREATE POLICY "Users can download resources" ON resource_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Engagement metrics: Users can read all, system can insert
CREATE POLICY "Users can view engagement metrics" ON engagement_metrics FOR SELECT USING (true);
CREATE POLICY "System can insert engagement metrics" ON engagement_metrics FOR INSERT WITH CHECK (true);

-- User engagement scores: Users can read all, system can upsert
CREATE POLICY "Users can view engagement scores" ON user_engagement_scores FOR SELECT USING (true);
CREATE POLICY "System can upsert engagement scores" ON user_engagement_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update engagement scores" ON user_engagement_scores FOR UPDATE USING (true);

-- Activities: Users can read all, organizers can create
CREATE POLICY "Users can view activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Organizers can create activities" ON activities FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Functions for engagement scoring
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_user_id UUID,
  p_session_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 0;
  final_score INTEGER := 0;
BEGIN
  -- Define base scores for different activities
  CASE p_activity_type
    WHEN 'attendance' THEN base_score := 10;
    WHEN 'poll' THEN base_score := 5;
    WHEN 'question' THEN base_score := 8;
    WHEN 'answer' THEN base_score := 6;
    WHEN 'resource_download' THEN base_score := 3;
    WHEN 'upvote' THEN base_score := 1;
    WHEN 'session_duration' THEN 
      base_score := COALESCE((p_activity_data->>'minutes')::INTEGER, 0) * 1; -- 1 point per minute
    ELSE base_score := 0;
  END CASE;
  
  final_score := base_score;
  
  -- Apply multipliers based on activity data
  IF p_activity_type = 'answer' AND (p_activity_data->>'is_official')::BOOLEAN THEN
    final_score := final_score * 2; -- Double points for official answers
  END IF;
  
  RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update user engagement scores
CREATE OR REPLACE FUNCTION update_user_engagement_score(
  p_user_id UUID,
  p_session_id UUID,
  p_activity_type TEXT,
  p_score INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_engagement_scores (user_id, session_id, total_score, attendance_score, poll_score, qna_score, resource_score)
  VALUES (p_user_id, p_session_id, p_score, 
    CASE WHEN p_activity_type = 'attendance' THEN p_score ELSE 0 END,
    CASE WHEN p_activity_type = 'poll' THEN p_score ELSE 0 END,
    CASE WHEN p_activity_type IN ('question', 'answer', 'upvote') THEN p_score ELSE 0 END,
    CASE WHEN p_activity_type = 'resource_download' THEN p_score ELSE 0 END
  )
  ON CONFLICT (user_id, session_id) 
  DO UPDATE SET
    total_score = user_engagement_scores.total_score + p_score,
    attendance_score = user_engagement_scores.attendance_score + 
      CASE WHEN p_activity_type = 'attendance' THEN p_score ELSE 0 END,
    poll_score = user_engagement_scores.poll_score + 
      CASE WHEN p_activity_type = 'poll' THEN p_score ELSE 0 END,
    qna_score = user_engagement_scores.qna_score + 
      CASE WHEN p_activity_type IN ('question', 'answer', 'upvote') THEN p_score ELSE 0 END,
    resource_score = user_engagement_scores.resource_score + 
      CASE WHEN p_activity_type = 'resource_download' THEN p_score ELSE 0 END,
    last_updated = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate and store engagement metrics
CREATE OR REPLACE FUNCTION handle_engagement_activity() RETURNS TRIGGER AS $$
DECLARE
  score INTEGER;
  activity_data JSONB := '{}'::jsonb;
BEGIN
  -- Determine activity type and data based on table
  IF TG_TABLE_NAME = 'poll_responses' THEN
    score := calculate_engagement_score(NEW.user_id, 
      (SELECT session_id FROM polls WHERE id = NEW.poll_id), 
      'poll', activity_data);
    
    INSERT INTO engagement_metrics (user_id, session_id, activity_type, activity_id, score, metadata)
    VALUES (NEW.user_id, 
      (SELECT session_id FROM polls WHERE id = NEW.poll_id), 
      'poll', NEW.poll_id, score, activity_data);
    
    PERFORM update_user_engagement_score(NEW.user_id, 
      (SELECT session_id FROM polls WHERE id = NEW.poll_id), 
      'poll', score);
      
  ELSIF TG_TABLE_NAME = 'questions' THEN
    score := calculate_engagement_score(NEW.user_id, NEW.session_id, 'question', activity_data);
    
    INSERT INTO engagement_metrics (user_id, session_id, activity_type, activity_id, score, metadata)
    VALUES (NEW.user_id, NEW.session_id, 'question', NEW.id, score, activity_data);
    
    PERFORM update_user_engagement_score(NEW.user_id, NEW.session_id, 'question', score);
    
  ELSIF TG_TABLE_NAME = 'answers' THEN
    activity_data := jsonb_build_object('is_official', NEW.is_official);
    score := calculate_engagement_score(NEW.user_id, 
      (SELECT session_id FROM questions WHERE id = NEW.question_id), 
      'answer', activity_data);
    
    INSERT INTO engagement_metrics (user_id, session_id, activity_type, activity_id, score, metadata)
    VALUES (NEW.user_id, 
      (SELECT session_id FROM questions WHERE id = NEW.question_id), 
      'answer', NEW.id, score, activity_data);
    
    PERFORM update_user_engagement_score(NEW.user_id, 
      (SELECT session_id FROM questions WHERE id = NEW.question_id), 
      'answer', score);
      
  ELSIF TG_TABLE_NAME = 'resource_downloads' THEN
    score := calculate_engagement_score(NEW.user_id, 
      (SELECT session_id FROM resources WHERE id = NEW.resource_id), 
      'resource_download', activity_data);
    
    INSERT INTO engagement_metrics (user_id, session_id, activity_type, activity_id, score, metadata)
    VALUES (NEW.user_id, 
      (SELECT session_id FROM resources WHERE id = NEW.resource_id), 
      'resource_download', NEW.resource_id, score, activity_data);
    
    PERFORM update_user_engagement_score(NEW.user_id, 
      (SELECT session_id FROM resources WHERE id = NEW.resource_id), 
      'resource_download', score);
      
  ELSIF TG_TABLE_NAME = 'question_upvotes' THEN
    score := calculate_engagement_score(NEW.user_id, 
      (SELECT session_id FROM questions WHERE id = NEW.question_id), 
      'upvote', activity_data);
    
    INSERT INTO engagement_metrics (user_id, session_id, activity_type, activity_id, score, metadata)
    VALUES (NEW.user_id, 
      (SELECT session_id FROM questions WHERE id = NEW.question_id), 
      'upvote', NEW.question_id, score, activity_data);
    
    PERFORM update_user_engagement_score(NEW.user_id, 
      (SELECT session_id FROM questions WHERE id = NEW.question_id), 
      'upvote', score);
      
  ELSIF TG_TABLE_NAME = 'attendance' THEN
    score := calculate_engagement_score(NEW.user_id, NEW.session_id, 'attendance', activity_data);
    
    INSERT INTO engagement_metrics (user_id, session_id, activity_type, activity_id, score, metadata)
    VALUES (NEW.user_id, NEW.session_id, 'attendance', NEW.id, score, activity_data);
    
    PERFORM update_user_engagement_score(NEW.user_id, NEW.session_id, 'attendance', score);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER engagement_poll_response_trigger
  AFTER INSERT ON poll_responses
  FOR EACH ROW EXECUTE FUNCTION handle_engagement_activity();

CREATE TRIGGER engagement_question_trigger
  AFTER INSERT ON questions
  FOR EACH ROW EXECUTE FUNCTION handle_engagement_activity();

CREATE TRIGGER engagement_answer_trigger
  AFTER INSERT ON answers
  FOR EACH ROW EXECUTE FUNCTION handle_engagement_activity();

CREATE TRIGGER engagement_resource_download_trigger
  AFTER INSERT ON resource_downloads
  FOR EACH ROW EXECUTE FUNCTION handle_engagement_activity();

CREATE TRIGGER engagement_upvote_trigger
  AFTER INSERT ON question_upvotes
  FOR EACH ROW EXECUTE FUNCTION handle_engagement_activity();

CREATE TRIGGER engagement_attendance_trigger
  AFTER INSERT ON attendance
  FOR EACH ROW EXECUTE FUNCTION handle_engagement_activity();
