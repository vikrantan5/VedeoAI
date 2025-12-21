import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye,
  Clock,
  Film,
  Play,
  ChevronRight
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PromptsPage = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API_URL}/prompts?limit=100`);
      setPrompts(response.data);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      toast.error('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: { variant: 'secondary', label: 'Draft' },
      approved: { variant: 'default', label: 'Approved' },
      generating: { variant: 'outline', label: 'Generating' },
      completed: { variant: 'default', label: 'Completed' }
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setDialogOpen(true);
  };

  const handleGenerateVideo = async (promptId) => {
    try {
      await axios.patch(`${API_URL}/prompts/${promptId}/approve`);
      await axios.post(`${API_URL}/videos/generate`, { prompt_id: promptId });
      toast.success('Video generation started!');
      setDialogOpen(false);
      navigate('/videos');
    } catch (error) {
      console.error('Failed to generate video:', error);
      toast.error('Failed to start video generation');
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesPlatform = platformFilter === 'all' || prompt.platform === platformFilter;
    const matchesSearch = 
      prompt.niche.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
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
      <div className="space-y-6" data-testid="prompts-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl">Prompts</h1>
            <p className="text-muted-foreground">Browse and manage your AI-generated video prompts</p>
          </div>
          <Link to="/create">
            <Button className="glow-primary" data-testid="create-prompt-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New Prompt
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
                  placeholder="Search prompts by niche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full md:w-48" data-testid="platform-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram Reels</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prompts List */}
        {filteredPrompts.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No prompts found</p>
                <p className="mb-6">
                  {prompts.length === 0 ? 'Create your first prompt to get started!' : 'Try adjusting your filters'}
                </p>
                {prompts.length === 0 && (
                  <Link to="/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Prompt
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow" data-testid={`prompt-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-heading font-medium text-xl capitalize">{prompt.niche}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {new Date(prompt.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {getStatusBadge(prompt.status)}
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Platform</p>
                            <p className="text-sm font-medium capitalize">{prompt.platform.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Length</p>
                            <p className="text-sm font-medium">{prompt.video_length}s</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tone</p>
                            <p className="text-sm font-medium capitalize">{prompt.tone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Goal</p>
                            <p className="text-sm font-medium capitalize">{prompt.goal}</p>
                          </div>
                        </div>

                        {/* Hook Preview */}
                        {prompt.generated_prompt?.hook && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-primary font-medium mb-1">Hook</p>
                            <p className="text-sm">{prompt.generated_prompt.hook.description}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewPrompt(prompt)}
                            data-testid={`view-prompt-${index}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          {prompt.status === 'draft' && (
                            <Button 
                              size="sm"
                              onClick={() => handleGenerateVideo(prompt.id)}
                              data-testid={`generate-video-${index}`}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Generate Video
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Prompt Details
            </DialogTitle>
            <DialogDescription>
              Full AI-generated video prompt
            </DialogDescription>
          </DialogHeader>
          
          {selectedPrompt && (
            <div className="space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Platform</p>
                  <p className="text-sm font-medium capitalize">{selectedPrompt.platform.replace('_', ' ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Length</p>
                  <p className="text-sm font-medium">{selectedPrompt.video_length}s</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Tone</p>
                  <p className="text-sm font-medium capitalize">{selectedPrompt.tone}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="text-sm font-medium capitalize">{selectedPrompt.goal}</p>
                </div>
              </div>

              {/* Hook */}
              {selectedPrompt.generated_prompt?.hook && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h3 className="font-medium text-primary mb-2">Hook (First 3 Seconds)</h3>
                  <p className="text-sm mb-2">{selectedPrompt.generated_prompt.hook.description}</p>
                  {selectedPrompt.generated_prompt.hook.text_overlay && (
                    <p className="text-sm font-mono bg-muted p-2 rounded">
                      "{selectedPrompt.generated_prompt.hook.text_overlay}"
                    </p>
                  )}
                </div>
              )}

              {/* Scenes */}
              {selectedPrompt.generated_prompt?.scenes && (
                <div className="space-y-3">
                  <h3 className="font-medium">Scene Breakdown</h3>
                  {selectedPrompt.generated_prompt.scenes.map((scene, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Scene {scene.scene_number || idx + 1}</span>
                        <span className="text-xs text-muted-foreground">{scene.duration_seconds}s</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{scene.visual_description}</p>
                      {scene.camera_movement && (
                        <p className="text-xs mt-2">
                          <span className="text-primary">Camera:</span> {scene.camera_movement}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Visual Style */}
              {selectedPrompt.generated_prompt?.visual_style && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Cinematography</p>
                    <p className="text-sm font-medium">{selectedPrompt.generated_prompt.visual_style.cinematography}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Lighting</p>
                    <p className="text-sm font-medium">{selectedPrompt.generated_prompt.visual_style.lighting}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Color Grade</p>
                    <p className="text-sm font-medium">{selectedPrompt.generated_prompt.visual_style.color_grade}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Mood</p>
                    <p className="text-sm font-medium">{selectedPrompt.generated_prompt.visual_style.mood}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedPrompt.status === 'draft' && (
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => handleGenerateVideo(selectedPrompt.id)}
                    className="glow-primary"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Generate Video
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PromptsPage;
