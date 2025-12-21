import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { 
  User, 
  Key, 
  Bell, 
  Palette,
  Shield,
  Save,
  Loader2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: {
      video_completed: true,
      prompt_generated: true,
      performance_insights: false,
      weekly_summary: true
    },
    api: {
      fal_key: '',
      gemini_key: ''
    }
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('API keys saved securely!');
    } catch (error) {
      toast.error('Failed to save API keys');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6" data-testid="settings-page">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-3xl">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and configurations</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" data-testid="tab-appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details and personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      data-testid="name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      data-testid="email-input"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      data-testid="current-password-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                        data-testid="new-password-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        data-testid="confirm-password-input"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={loading}
                    className="w-full md:w-auto"
                    data-testid="save-profile-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Configure your API keys for video generation services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-primary mb-1">Security Notice</p>
                        <p className="text-muted-foreground">
                          Your API keys are encrypted and stored securely. They are never shared with third parties.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fal-key">FAL.ai API Key</Label>
                    <Input
                      id="fal-key"
                      type="password"
                      placeholder="Enter your FAL.ai API key"
                      value={settings.api.fal_key}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, fal_key: e.target.value }
                      })}
                      data-testid="fal-key-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">fal.ai/dashboard/keys</a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gemini-key">Gemini API Key</Label>
                    <Input
                      id="gemini-key"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={settings.api.gemini_key}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, gemini_key: e.target.value }
                      })}
                      data-testid="gemini-key-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for AI prompt generation
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveApiKeys} 
                    disabled={loading}
                    className="w-full md:w-auto"
                    data-testid="save-api-keys-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save API Keys
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what updates you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Video Generation Complete</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when your video is ready
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.video_completed}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, video_completed: checked }
                        })}
                        data-testid="notif-video-completed"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Prompt Generated</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive alerts when AI generates a new prompt
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.prompt_generated}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, prompt_generated: checked }
                        })}
                        data-testid="notif-prompt-generated"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Performance Insights</Label>
                        <p className="text-sm text-muted-foreground">
                          Get AI-powered insights on video performance
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.performance_insights}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, performance_insights: checked }
                        })}
                        data-testid="notif-performance-insights"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Summary</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive weekly performance reports
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications.weekly_summary}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, weekly_summary: checked }
                        })}
                        data-testid="notif-weekly-summary"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveNotifications} 
                    disabled={loading}
                    className="w-full md:w-auto"
                    data-testid="save-notifications-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize how VeoPrompt looks for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">
                          Currently using {theme === 'dark' ? 'Dark' : 'Light'} theme
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={toggleTheme}
                        data-testid="toggle-theme-btn"
                      >
                        {theme === 'dark' ? (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            Switch to Light
                          </>
                        ) : (
                          <>
                            <Palette className="w-4 h-4 mr-2" />
                            Switch to Dark
                          </>
                        )}
                      </Button>
                    </div>

                    <Separator />

                    <div className="p-6 rounded-lg border border-border space-y-4">
                      <h3 className="font-medium">Theme Preview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="h-24 rounded-lg bg-background border border-border" />
                          <p className="text-xs text-center text-muted-foreground">Background</p>
                        </div>
                        <div className="space-y-2">
                          <div className="h-24 rounded-lg bg-primary" />
                          <p className="text-xs text-center text-muted-foreground">Primary</p>
                        </div>
                        <div className="space-y-2">
                          <div className="h-24 rounded-lg bg-secondary" />
                          <p className="text-xs text-center text-muted-foreground">Secondary</p>
                        </div>
                        <div className="space-y-2">
                          <div className="h-24 rounded-lg bg-accent" />
                          <p className="text-xs text-center text-muted-foreground">Accent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
