import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Film, 
  Plus, 
  Search, 
  Eye, 
  Heart, 
  Share2,
  Clock,
  Download,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`${API_URL}/videos?limit=100`);
      setVideos(response.data);
      
      // Fetch performance data for each video
      const perfData = {};
      for (const video of response.data) {
        if (video.status === 'completed') {
          try {
            const perfResponse = await axios.get(`${API_URL}/performance/${video.id}`);
            perfData[video.id] = perfResponse.data;
          } catch (err) {
            console.error(`Failed to fetch performance for ${video.id}`);
          }
        }
      }
      setPerformanceData(perfData);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      queued: { variant: 'secondary', label: 'Queued' },
      processing: { variant: 'outline', label: 'Processing' },
      completed: { variant: 'default', label: 'Completed' },
      failed: { variant: 'destructive', label: 'Failed' }
    };
    const config = variants[status] || variants.queued;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const filteredVideos = videos.filter(video => {
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    const matchesSearch = video.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="videos-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl">Videos</h1>
            <p className="text-muted-foreground">View and manage all your generated videos</p>
          </div>
          <Link to="/create">
            <Button className="glow-primary" data-testid="create-video-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New Video
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No videos found</p>
                <p className="mb-6">
                  {videos.length === 0 ? 'Create your first video to get started!' : 'Try adjusting your filters'}
                </p>
                {videos.length === 0 && (
                  <Link to="/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Video
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, index) => {
              const perf = performanceData[video.id];
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`video-card-${index}`}>
                    {/* Video Preview */}
                    <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center max-h-64 relative">
                      {video.status === 'completed' && video.video_url ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center group">
                          <Film className="w-12 h-12 text-white/80" />
                          <a 
                            href={video.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Button size="sm" className="gap-2">
                              <ExternalLink className="w-4 h-4" />
                              View
                            </Button>
                          </a>
                        </div>
                      ) : video.status === 'processing' ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Processing...</p>
                        </div>
                      ) : video.status === 'failed' ? (
                        <div className="text-center text-destructive">
                          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Generation Failed</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Clock className="w-12 h-12 text-primary/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Queued</p>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {/* Status & Date */}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(video.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{video.duration}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Resolution:</span>
                          <span className="font-medium">{video.resolution}</span>
                        </div>
                      </div>

                      {/* Caption & Hashtags */}
                      {video.caption_text && (
                        <div className="pt-3 border-t border-border space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Caption:</p>
                            <p className="text-sm">{video.caption_text}</p>
                          </div>
                          {video.hashtags_used && video.hashtags_used.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Hashtags:</p>
                              <div className="flex flex-wrap gap-1">
                                {video.hashtags_used.slice(0, 5).map((tag, idx) => (
                                  <span 
                                    key={idx}
                                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {video.hashtags_used.length > 5 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{video.hashtags_used.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {video.instagram_post_id && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Instagram Status:</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  Posted ✓
                                </span>
                                {video.posted_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(video.posted_at).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Performance Metrics */}
                      {perf && (
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-green-500">
                              <Eye className="w-3 h-3" />
                              <span className="text-xs font-medium">{formatNumber(perf.views)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Views</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-red-500">
                              <Heart className="w-3 h-3" />
                              <span className="text-xs font-medium">{formatNumber(perf.likes)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Likes</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-500">
                              <Share2 className="w-3 h-3" />
                              <span className="text-xs font-medium">{formatNumber(perf.shares)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Shares</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {video.status === 'completed' && video.video_url && (
                        <div className="pt-2">
                          <a 
                            href={video.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VideosPage;
