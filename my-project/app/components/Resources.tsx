"use client";
import { useState, useEffect } from 'react';
import { engagementService, Resource } from '@/lib/engagementService';
import { supabase } from '@/lib/supabaseClient';
import { Download, FileText, Image, Video, Link, Upload, Eye } from 'lucide-react';

interface ResourcesProps {
  sessionId: string;
  userId: string;
  userRole: string;
}

interface ResourceWithDownloads extends Resource {
  download_count: number;
  user_downloaded: boolean;
}

export default function Resources({ sessionId, userId, userRole }: ResourcesProps) {
  const [resources, setResources] = useState<ResourceWithDownloads[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    file: null as File | null,
    url: ''
  });

  useEffect(() => {
    loadResources();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`resources-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources',
          filter: `session_id=eq.${sessionId}`
        },
        () => loadResources()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource_downloads'
        },
        () => loadResources()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadResources = async () => {
    try {
      const data = await engagementService.getSessionResources(sessionId);
      
      // Get download counts and check if user has downloaded
      const resourcesWithDetails = await Promise.all(
        data.map(async (resource: Resource) => {
          const downloadCount = await engagementService.getResourceDownloadCount(resource.id);
          
          const { data: userDownload } = await supabase
            .from('resource_downloads')
            .select('id')
            .eq('resource_id', resource.id)
            .eq('user_id', userId)
            .single();
          
          return {
            ...resource,
            download_count: downloadCount,
            user_downloaded: !!userDownload
          };
        })
      );
      
      setResources(resourcesWithDetails);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `resources/${sessionId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('resources')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCreateResource = async () => {
    if (!newResource.title.trim() || uploading) return;
    
    if (!newResource.file && !newResource.url.trim()) {
      alert('Please provide either a file or a URL');
      return;
    }

    setUploading(true);
    try {
      let fileUrl = newResource.url;
      let fileType = 'link';
      let fileSize = 0;

      if (newResource.file) {
        fileUrl = await handleFileUpload(newResource.file);
        fileType = newResource.file.type.startsWith('image/') ? 'image' :
                  newResource.file.type.startsWith('video/') ? 'video' :
                  newResource.file.type === 'application/pdf' ? 'pdf' : 'file';
        fileSize = newResource.file.size;
      }

      await engagementService.createResource(
        sessionId,
        newResource.title.trim(),
        newResource.description.trim(),
        fileUrl,
        fileType,
        fileSize,
        userId
      );

      setNewResource({ title: '', description: '', file: null, url: '' });
      setShowUploadForm(false);
      await loadResources();
    } catch (error) {
      console.error('Error creating resource:', error);
      alert('Error creating resource. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadResource = async (resource: ResourceWithDownloads) => {
    if (resource.user_downloaded) {
      // Just open the resource
      window.open(resource.file_url, '_blank');
      return;
    }

    try {
      await engagementService.downloadResource(resource.id, userId);
      
      // Open the resource
      window.open(resource.file_url, '_blank');
      
      // Reload to update download count
      await loadResources();
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'link':
        return <Link className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">
          Resources ({resources.length})
        </h3>
        
        {userRole === 'organizer' && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Resource
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && userRole === 'organizer' && (
        <div className="bg-white/10 rounded-lg p-6 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-4">Add New Resource</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Resource title"
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={newResource.description}
                onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Resource description"
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                disabled={uploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={(e) => setNewResource(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Or URL
                </label>
                <input
                  type="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/resource"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateResource}
                disabled={!newResource.title.trim() || uploading || (!newResource.file && !newResource.url.trim())}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {uploading ? 'Creating...' : 'Create Resource'}
              </button>
              
              <button
                onClick={() => setShowUploadForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No resources available yet.</p>
          {userRole === 'organizer' && (
            <p className="text-gray-500 text-sm mt-2">Add the first resource to get started!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white/10 rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400">
                    {getFileIcon(resource.file_type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg">{resource.title}</h4>
                    <p className="text-gray-400 text-sm capitalize">{resource.file_type}</p>
                  </div>
                </div>
              </div>

              {resource.description && (
                <p className="text-gray-300 text-sm mb-4">{resource.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                {resource.file_size && resource.file_size > 0 && (
                  <span>{formatFileSize(resource.file_size)}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  {resource.download_count} downloads
                </span>

                <button
                  onClick={() => handleDownloadResource(resource)}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors flex items-center ${
                    resource.user_downloaded
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {resource.user_downloaded ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
