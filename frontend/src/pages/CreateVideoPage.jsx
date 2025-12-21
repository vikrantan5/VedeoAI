import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";
import { 
  Wand2, 
  Loader2, 
  ArrowRight, 
  Film, 
  Sparkles,
  CheckCircle,
  Play
} from "lucide-react";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CreateVideoPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState(null);
  const [videoGenerating, setVideoGenerating] = useState(false);

  const [formData, setFormData] = useState({
    niche: "",
    platform: "instagram",
    video_length: 30,
    tone: "cinematic",
    goal: "engagement",
    custom_idea: ""
  });

  const platforms = [
    { value: "instagram", label: "Instagram Reels" },
    { value: "youtube_shorts", label: "YouTube Shorts" },
    { value: "tiktok", label: "TikTok" },
    { value: "x", label: "X (Twitter)" }
  ];

  const tones = [
    { value: "cinematic", label: "Cinematic" },
    { value: "emotional", label: "Emotional" },
    { value: "aggressive", label: "Aggressive" },
    { value: "calm", label: "Calm" },
    { value: "energetic", label: "Energetic" }
  ];

  const goals = [
    { value: "engagement", label: "Engagement" },
    { value: "virality", label: "Virality" },
    { value: "education", label: "Education" },
    { value: "conversion", label: "Conversion" }
  ];

  const handleGeneratePrompt = async () => {
    if (!formData.niche) {
      toast.error("Please enter a niche/topic");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/prompts/generate`, formData);
      setGeneratedPrompt(response.data);
      setStep(2);
      toast.success("Prompt generated successfully!");
    } catch (error) {
      console.error("Failed to generate prompt:", error);
      toast.error(error.response?.data?.detail || "Failed to generate prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedPrompt) return;

    setVideoGenerating(true);
    try {
      // First approve the prompt
      await axios.patch(`${API_URL}/prompts/${generatedPrompt.id}/approve`);
      
      // Then generate video
      const response = await axios.post(`${API_URL}/videos/generate`, {
        prompt_id: generatedPrompt.id
      });
      
      toast.success("Video generation started! Check your videos page for status.");
      navigate("/videos");
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast.error(error.response?.data?.detail || "Failed to start video generation");
    } finally {
      setVideoGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8" data-testid="create-video-page">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-3xl">Create New Video</h1>
          <p className="text-muted-foreground">Generate an AI-optimized video prompt and create your content</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <span className="font-medium">Configure</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <span className="font-medium">Review Prompt</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span className="font-medium">Generate</span>
          </div>
        </div>

        {/* Step 1: Configuration */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Video Configuration
                </CardTitle>
                <CardDescription>
                  Tell us about the video you want to create
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Niche */}
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche / Topic *</Label>
                  <Input
                    id="niche"
                    placeholder="e.g., AI, Finance, Motivation, Education, Fitness"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    data-testid="niche-input"
                    className="h-12"
                  />
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger data-testid="platform-select" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Video Length */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Video Length</Label>
                    <span className="text-sm font-medium">{formData.video_length} seconds</span>
                  </div>
                  <Slider
                    value={[formData.video_length]}
                    onValueChange={(value) => setFormData({ ...formData, video_length: value[0] })}
                    min={10}
                    max={60}
                    step={5}
                    data-testid="length-slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10s</span>
                    <span>60s</span>
                  </div>
                </div>

                {/* Tone & Goal Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => setFormData({ ...formData, tone: value })}
                    >
                      <SelectTrigger data-testid="tone-select" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Goal</Label>
                    <Select
                      value={formData.goal}
                      onValueChange={(value) => setFormData({ ...formData, goal: value })}
                    >
                      <SelectTrigger data-testid="goal-select" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {goals.map((g) => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Idea */}
                <div className="space-y-2">
                  <Label htmlFor="custom_idea">Custom Idea (Optional)</Label>
                  <Textarea
                    id="custom_idea"
                    placeholder="Add any specific ideas or directions for your video..."
                    value={formData.custom_idea}
                    onChange={(e) => setFormData({ ...formData, custom_idea: e.target.value })}
                    data-testid="custom-idea-input"
                    rows={4}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  className="w-full h-12 glow-primary" 
                  onClick={handleGeneratePrompt}
                  disabled={loading}
                  data-testid="generate-prompt-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Prompt...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate AI Prompt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Review Prompt */}
        {step === 2 && generatedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Prompt Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  Generated Prompt
                </CardTitle>
                <CardDescription>
                  Review your AI-generated video prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hook Section */}
                {generatedPrompt.generated_prompt?.hook && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h3 className="font-medium text-primary mb-2">Hook (First 3 Seconds)</h3>
                    <p className="text-sm">{generatedPrompt.generated_prompt.hook.description}</p>
                    {generatedPrompt.generated_prompt.hook.text_overlay && (
                      <p className="text-sm mt-2 font-mono bg-muted p-2 rounded">
                        "{generatedPrompt.generated_prompt.hook.text_overlay}"
                      </p>
                    )}
                  </div>
                )}

                {/* Scenes */}
                {generatedPrompt.generated_prompt?.scenes && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Scene Breakdown</h3>
                    {generatedPrompt.generated_prompt.scenes.map((scene, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Scene {scene.scene_number || index + 1}</span>
                          <span className="text-xs text-muted-foreground">{scene.duration_seconds}s</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{scene.visual_description}</p>
                        {scene.camera_movement && (
                          <p className="text-xs mt-2"><span className="text-primary">Camera:</span> {scene.camera_movement}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Visual Style */}
                {generatedPrompt.generated_prompt?.visual_style && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Cinematography</p>
                      <p className="text-sm font-medium">{generatedPrompt.generated_prompt.visual_style.cinematography}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Lighting</p>
                      <p className="text-sm font-medium">{generatedPrompt.generated_prompt.visual_style.lighting}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Color Grade</p>
                      <p className="text-sm font-medium">{generatedPrompt.generated_prompt.visual_style.color_grade}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Mood</p>
                      <p className="text-sm font-medium">{generatedPrompt.generated_prompt.visual_style.mood}</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {generatedPrompt.generated_prompt?.metadata && (
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {generatedPrompt.generated_prompt.metadata.aspect_ratio}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm">
                      {generatedPrompt.generated_prompt.metadata.total_duration}s
                    </span>
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm capitalize">
                      {generatedPrompt.generated_prompt.metadata.platform_optimization}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep(1)}
                data-testid="back-btn"
              >
                Back to Edit
              </Button>
              <Button 
                className="flex-1 glow-primary"
                onClick={handleGenerateVideo}
                disabled={videoGenerating}
                data-testid="generate-video-btn"
              >
                {videoGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Generation...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateVideoPage;
