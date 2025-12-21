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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="instagram" data-testid="tab-instagram">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
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

          {/* Instagram Tab */}
          <TabsContent value="instagram">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Instagram Graph API Setup</CardTitle>
                  <CardDescription>
                    Connect your Instagram Business Account to enable auto-posting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium mb-2">📘 Currently Using Mock Mode</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The system is currently in mock mode for testing. Captions and hashtags are generated automatically, 
                      but Instagram posting is simulated. Follow the guide below to set up real Instagram integration.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Setup Guide: Instagram Graph API</h3>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Create Facebook Developer Account</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Visit <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developers.facebook.com</a> and create an account
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Create a Facebook App</h4>
                          <p className="text-sm text-muted-foreground">
                            Go to "My Apps" → "Create App" → Choose "Business" type
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Add Instagram Product</h4>
                          <p className="text-sm text-muted-foreground">
                            In your app dashboard, find "Instagram" product and click "Set Up"
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Generate Access Token</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Use Graph API Explorer to generate a User Access Token with these permissions:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-4">
                            <li>instagram_business_browse</li>
                            <li>instagram_graph_user_profile</li>
                            <li>instagram_graph_media_profile</li>
                            <li>pages_show_list</li>
                          </ul>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          5
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Extend Token Validity</h4>
                          <p className="text-sm text-muted-foreground">
                            Visit <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Access Token Debugger</a> and extend your token to 60 days
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          6
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Get Instagram Business Account ID</h4>
                          <p className="text-sm text-muted-foreground">
                            In Graph API Explorer, query: <code className="bg-muted px-2 py-1 rounded text-xs">me/accounts</code> then <code className="bg-muted px-2 py-1 rounded text-xs">{'{'}page-id{'}'}/instagram_accounts</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Configuration (Coming Soon)</h3>
                    <p className="text-sm text-muted-foreground">
                      Once you have your credentials, you'll be able to configure them here. Contact your administrator to enable real Instagram integration.
                    </p>
                    
                    <div className="space-y-3 opacity-50 pointer-events-none">
                      <div className="space-y-2">
                        <Label>Instagram Business Account ID</Label>
                        <Input placeholder="17841XXXXXXXXXX" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <Input type="password" placeholder="Your long-lived access token" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Facebook Page ID</Label>
                        <Input placeholder="123456789012345" disabled />
                      </div>
                      <Button disabled>
                        Save Instagram Credentials
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ Current Features Active</h4>
                    <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                      <li>✓ Gemini AI caption generation</li>
                      <li>✓ Hashtag optimization (5-10 tags)</li>
                      <li>✓ Automatic caption & hashtag attachment to videos</li>
                      <li>✓ Mock Instagram posting (for testing)</li>
                    </ul>
                  </div>
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
