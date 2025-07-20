"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Users, Calendar, QrCode, Copy, ExternalLink, Trash2, Settings } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  qr_code_url?: string;
  created_at: string;
}

interface SessionManagerProps {
  userId: string;
}

export default function SessionManager({ userId }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setSessions(data || []);
    setLoading(false);
  };

  const handleCreateSession = async () => {
    if (!newSession.title.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        title: newSession.title.trim(),
        description: newSession.description.trim(),
        organizer_id: userId,
        start_time: newSession.start_time || null,
        end_time: newSession.end_time || null,
        is_active: true
      })
      .select()
      .single();
    setCreating(false);
    if (!error && data) {
      setCreatedSessionId(data.id);
      setShowCreateForm(false);
      setNewSession({ title: '', description: '', start_time: '', end_time: '' });
      fetchSessions();
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Delete this session?')) return;
    await supabase.from('sessions').delete().eq('id', id);
    fetchSessions();
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 1200);
  };

  const joinUrl = (id: string) => `${window.location.origin}/join/${id}`;

  return (
    <div className="bg-white/10 rounded-lg p-6 border border-white/20 max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Users className="w-6 h-6 mr-2" />
          Manage Sessions
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Session</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Session Title"
              value={newSession.title}
              onChange={e => setNewSession(s => ({ ...s, title: e.target.value }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={creating}
            />
            <textarea
              placeholder="Session Description"
              value={newSession.description}
              onChange={e => setNewSession(s => ({ ...s, description: e.target.value }))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={creating}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="datetime-local"
                value={newSession.start_time}
                onChange={e => setNewSession(s => ({ ...s, start_time: e.target.value }))}
                className="p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={creating}
              />
              <input
                type="datetime-local"
                value={newSession.end_time}
                onChange={e => setNewSession(s => ({ ...s, end_time: e.target.value }))}
                className="p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={creating}
              />
            </div>
            <div className="flex space-x-3 mt-3">
              <button
                onClick={handleCreateSession}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium"
                disabled={creating || !newSession.title.trim()}
              >
                {creating ? 'Creating...' : 'Create Session'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-medium"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {createdSessionId && (
        <div className="bg-green-700/20 border border-green-600/30 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">Session Created!</div>
            <div className="text-green-300 text-sm mt-1">Share this link with participants:</div>
            <div className="flex items-center mt-2">
              <span className="font-mono text-green-200 text-sm bg-green-900/20 px-2 py-1 rounded mr-2">{joinUrl(createdSessionId)}</span>
              <button onClick={() => handleCopy(joinUrl(createdSessionId))} className="text-green-400 hover:text-green-300 mr-2"><Copy className="w-4 h-4" /></button>
              <a href={joinUrl(createdSessionId)} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300"><ExternalLink className="w-4 h-4" /></a>
            </div>
            {copyMsg && <div className="text-green-300 text-xs mt-1">{copyMsg}</div>}
          </div>
          <button onClick={() => setCreatedSessionId(null)} className="ml-6 text-green-400 hover:text-green-200">Dismiss</button>
        </div>
      )}

      <h3 className="text-lg font-semibold text-white mb-4">Your Sessions</h3>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No sessions found. Click "New Session" to create your first event.</div>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-white/5 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between border border-white/10">
              <div>
                <div className="text-white font-bold text-lg mb-1">{session.title}</div>
                <div className="text-gray-300 text-sm mb-1">{session.description}</div>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span><Calendar className="w-4 h-4 inline mr-1" />{session.start_time ? new Date(session.start_time).toLocaleString() : 'No start'}</span>
                  <span><Calendar className="w-4 h-4 inline mr-1" />{session.end_time ? new Date(session.end_time).toLocaleString() : 'No end'}</span>
                  <span className={session.is_active ? 'text-green-400' : 'text-red-400'}>{session.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <a href={joinUrl(session.id)} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center">
                  <QrCode className="w-4 h-4 mr-1" /> Dashboard
                </a>
                <button onClick={() => handleCopy(joinUrl(session.id))} className="text-blue-400 hover:text-blue-300"><Copy className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteSession(session.id)} className="text-red-400 hover:text-red-300 ml-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
