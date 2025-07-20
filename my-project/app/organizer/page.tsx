"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Users, BarChart3, QrCode, Play, Pause, Trash2, ExternalLink, MessageSquare, FilePlus, Brain } from 'lucide-react';
import PollCreator from '../components/PollCreator';
import OrganizerIntelligence from '../components/OrganizerIntelligence';

// Minimal Q&A and Resource upload logic below.

interface Session {
  id: string;
  title: string;
  description: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  qr_code_url: string;
  created_at: string;
}

export default function OrganizerDashboard() {
  // Engagement creation modal state
  const [activeModal, setActiveModal] = useState<null | { type: 'poll'|'qa'|'resource'|'intelligence', sessionId: string }>(null);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', file: null as File | null, url: '' });
  const [resourceUploading, setResourceUploading] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      router.push('/');
      return;
    }

    // Check if user is organizer
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (userRow?.role !== 'organizer') {
      router.push('/');
      return;
    }

    setUser(data.user);
    loadSessions(data.user.id);
  };

  const loadSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeURL = (sessionId: string) => {
    const joinURL = `${window.location.origin}/join/${sessionId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinURL)}`;
  };

  const createSession = async () => {
    if (!newSession.title.trim() || !user) return;

    setCreating(true);
    try {
      const sessionData = {
        title: newSession.title.trim(),
        description: newSession.description.trim(),
        organizer_id: user.id,
        start_time: newSession.start_time || new Date().toISOString(),
        end_time: newSession.end_time || null,
        is_active: true
      };

      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      // Generate QR code URL and update session
      const qrCodeURL = generateQRCodeURL(data.id);
      await supabase
        .from('sessions')
        .update({ qr_code_url: qrCodeURL })
        .eq('id', data.id);

      // Reset form and reload sessions
      setNewSession({ title: '', description: '', start_time: '', end_time: '' });
      setShowCreateForm(false);
      loadSessions(user.id);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const toggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('sessions')
        .update({ is_active: !currentStatus })
        .eq('id', sessionId);

      loadSessions(user.id);
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      loadSessions(user.id);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const getSessionStats = async (sessionId: string) => {
    const { count: attendanceCount } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    return {
      participants: attendanceCount || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Engagement Feature Creation Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white/10 rounded-lg p-6 border border-white/20 max-w-lg w-full relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-3 right-3 text-gray-300 hover:text-white">✕</button>
            {activeModal.type === 'poll' && (
              <PollCreator sessionId={activeModal.sessionId} userId={user?.id} onPollCreated={() => setActiveModal(null)} />
            )}
            {activeModal.type === 'qa' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><MessageSquare className="w-5 h-5 mr-2"/>Ask a Question</h3>
                <textarea
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  placeholder="Type your question..."
                  value={qaQuestion}
                  onChange={e => setQaQuestion(e.target.value)}
                  rows={3}
                  disabled={qaLoading}
                />
                <button
                  onClick={async () => {
                    if (!qaQuestion.trim() || qaLoading) return;
                    setQaLoading(true);
                    try {
                      // Use engagementService.askQuestion
                      const { engagementService } = await import('@/lib/engagementService');
                      await engagementService.askQuestion(activeModal.sessionId, user.id, qaQuestion.trim());
                      setQaQuestion('');
                      setActiveModal(null);
                    } catch (e) {
                      alert('Failed to create question');
                    } finally {
                      setQaLoading(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium"
                  disabled={!qaQuestion.trim() || qaLoading}
                >{qaLoading ? 'Submitting...' : 'Ask Question'}</button>
              </div>
            )}
            {activeModal.type === 'resource' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center"><FilePlus className="w-5 h-5 mr-2"/>Add Resource</h3>
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-3"
                  value={resourceForm.title}
                  disabled={resourceUploading}
                  onChange={e => setResourceForm(f => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  placeholder="Description"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-3"
                  value={resourceForm.description}
                  disabled={resourceUploading}
                  onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
                <input
                  type="file"
                  className="mb-3 text-white"
                  disabled={resourceUploading}
                  onChange={e => setResourceForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                />
                <input
                  type="url"
                  placeholder="Or paste a link (optional)"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 mb-3"
                  value={resourceForm.url}
                  disabled={resourceUploading}
                  onChange={e => setResourceForm(f => ({ ...f, url: e.target.value }))}
                />
                <button
                  onClick={async () => {
                    if (!resourceForm.title.trim() || resourceUploading) return;
                    if (!resourceForm.file && !resourceForm.url.trim()) {
                      alert('Provide a file or a link');
                      return;
                    }
                    setResourceUploading(true);
                    try {
                      const { engagementService } = await import('@/lib/engagementService');
                      let fileUrl = resourceForm.url;
                      let fileType = 'link';
                      let fileSize = 0;
                      if (resourceForm.file) {
                        // Upload to Supabase Storage
                        const fileExt = resourceForm.file.name.split('.').pop();
                        const fileName = `${Date.now()}.${fileExt}`;
                        const filePath = `resources/${activeModal.sessionId}/${fileName}`;
                        const { data, error } = await supabase.storage.from('resources').upload(filePath, resourceForm.file);
                        if (error) throw error;
                        const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(filePath);
                        fileUrl = publicUrl;
                        fileType = resourceForm.file.type.startsWith('image/') ? 'image' : resourceForm.file.type.startsWith('video/') ? 'video' : resourceForm.file.type === 'application/pdf' ? 'pdf' : 'file';
                        fileSize = resourceForm.file.size;
                      }
                      await engagementService.createResource(
                        activeModal.sessionId,
                        resourceForm.title.trim(),
                        resourceForm.description.trim(),
                        fileUrl,
                        fileType,
                        fileSize,
                        user.id
                      );
                      setResourceForm({ title: '', description: '', file: null, url: '' });
                      setActiveModal(null);
                    } catch (e) {
                      alert('Failed to create resource');
                    } finally {
                      setResourceUploading(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium"
                  disabled={!resourceForm.title.trim() || resourceUploading || (!resourceForm.file && !resourceForm.url.trim())}
                >{resourceUploading ? 'Uploading...' : 'Add Resource'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intelligence Modal */}
      {activeModal?.type === 'intelligence' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-white/20 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Brain className="w-6 h-6 mr-3 text-cyan-400" />
                Session Intelligence
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <OrganizerIntelligence 
                sessionId={activeModal.sessionId} 
                userId={user?.id || ''} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Organizer Dashboard</h1>
            <p className="text-gray-300">Manage your sessions and track engagement</p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Session
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Create Session Form */}
        {showCreateForm && (
          <div className="bg-white/10 rounded-lg p-6 border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Session</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., AI Workshop 2025"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the session"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Start Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={createSession}
                disabled={!newSession.title.trim() || creating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </button>
              
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <div className="bg-white/5 rounded-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Sessions Yet</h3>
            <p className="text-gray-400 mb-6">Create your first session to start tracking engagement</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center mx-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onToggleStatus={toggleSessionStatus}
                onDelete={deleteSession}
                onJoin={(id) => router.push(`/join/${id}`)}
                setActiveModal={setActiveModal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onJoin: (id: string) => void;
  setActiveModal: (modal: { type: 'poll'|'qa'|'resource'|'intelligence', sessionId: string }) => void;
}

function SessionCard({ session, onToggleStatus, onDelete, onJoin, setActiveModal }: SessionCardProps) {
  const [stats, setStats] = useState({ participants: 0 });

  useEffect(() => {
    loadStats();
  }, [session.id]);

  const loadStats = async () => {
    const { count: attendanceCount } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id);

    setStats({ participants: attendanceCount || 0 });
  };

  const copyJoinURL = () => {
    const joinURL = `${window.location.origin}/join/${session.id}`;
    navigator.clipboard.writeText(joinURL);
    alert('Join URL copied to clipboard!');
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = session.qr_code_url || generateQRCodeURL(session.id);
    link.download = `${session.title}-QR.png`;
    link.click();
  };

  const generateQRCodeURL = (sessionId: string) => {
    const joinURL = `${window.location.origin}/join/${sessionId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinURL)}`;
  };

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{session.title}</h3>
          <p className="text-gray-400 text-sm">{session.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            session.is_active 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {session.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.participants}</div>
          <div className="text-gray-400 text-xs">Participants</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {new Date(session.created_at).toLocaleDateString()}
          </div>
          <div className="text-gray-400 text-xs">Created</div>
        </div>
      </div>

      {/* QR Code Preview */}
      <div className="text-center mb-4">
        <img
          src={session.qr_code_url || generateQRCodeURL(session.id)}
          alt="QR Code"
          className="w-20 h-20 mx-auto rounded-lg bg-white p-1"
        />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onJoin(session.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Join Session
        </button>

        {/* Engagement Feature Creation Buttons */}
        <div className="grid grid-cols-2 gap-2 my-2">
          <button
            onClick={() => setActiveModal({ type: 'poll', sessionId: session.id })}
            className="bg-blue-700 hover:bg-blue-800 text-white py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1" />Poll
          </button>
     
        </div>
        <div className="grid grid-cols-2 gap-2 my-2">
          <button
            onClick={() => setActiveModal({ type: 'resource', sessionId: session.id })}
            className="bg-green-700 hover:bg-green-800 text-white py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center"
          >
            <FilePlus className="w-4 h-4 mr-1" />Resource
          </button>
          <button
            onClick={() => setActiveModal({ type: 'intelligence', sessionId: session.id })}
            className="bg-cyan-700 hover:bg-cyan-800 text-white py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center"
          >
            <Brain className="w-4 h-4 mr-1" />Intelligence
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyJoinURL}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Copy URL
          </button>
          <button
            onClick={downloadQRCode}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
          >
            <QrCode className="w-4 h-4 mr-1" />
            QR
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
   
      
        </div>
      </div>
    </div>
  );
}
