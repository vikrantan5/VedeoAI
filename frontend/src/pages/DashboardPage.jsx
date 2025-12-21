import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, 
  Film, 
  FileText, 
  Eye, 
  Heart, 
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles
} from "lucide-react";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/recent-activity`)
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString() || "0";
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: "secondary",
      approved: "default",
      generating: "outline",
      completed: "default",
      queued: "secondary",
      processing: "outline",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

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
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-3xl">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your content overview.</p>
          </div>
          <Link to="/create">
            <Button className="glow-primary" data-testid="create-video-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create New Video
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card data-testid="stat-prompts">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total_prompts || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Prompts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-videos">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Film className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total_videos || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-views">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(stats?.total_views)}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-likes">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(stats?.total_likes)}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1" data-testid="quick-actions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/create" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Plus className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Create New Video</p>
                    <p className="text-xs text-muted-foreground">Generate AI prompt & video</p>
                  </div>
                </Button>
              </Link>
              <Link to="/prompts" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <FileText className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View All Prompts</p>
                    <p className="text-xs text-muted-foreground">Browse your prompt library</p>
                  </div>
                </Button>
              </Link>
              <Link to="/videos" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Film className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Video Gallery</p>
                    <p className="text-xs text-muted-foreground">See all generated videos</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Prompts */}
          <Card className="lg:col-span-2" data-testid="recent-prompts">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Prompts
              </CardTitle>
              <Link to="/prompts">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentActivity?.recent_prompts?.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.recent_prompts.map((prompt, index) => (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{prompt.niche}</p>
                          <p className="text-sm text-muted-foreground capitalize">{prompt.platform}</p>
                        </div>
                      </div>
                      {getStatusBadge(prompt.status)}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No prompts yet. Create your first one!</p>
                  <Link to="/create">
                    <Button className="mt-4" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Prompt
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Videos */}
        <Card data-testid="recent-videos">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              Recent Videos
            </CardTitle>
            <Link to="/videos">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity?.recent_videos?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentActivity.recent_videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center max-h-48">
                      <Film className="w-12 h-12 text-primary/50" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                        {getStatusBadge(video.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No videos yet. Generate your first one!</p>
                <Link to="/create">
                  <Button className="mt-4" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Video
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
