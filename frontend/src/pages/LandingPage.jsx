import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { 
  Play, 
  Sparkles, 
  Zap, 
  BarChart3, 
  Film, 
  Wand2,
  ArrowRight,
  Sun,
  Moon,
  Menu,
  X,
  Check
} from "lucide-react";

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "AI Prompt Engineer",
      description: "Generate cinematic, retention-optimized video prompts with our advanced AI"
    },
    {
      icon: <Film className="w-6 h-6" />,
      title: "Gemini Veo Integration",
      description: "Seamlessly generate videos from your prompts using cutting-edge AI"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Platform Optimized",
      description: "Perfect aspect ratios and formats for Instagram, TikTok, YouTube Shorts"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "Track views, engagement, and optimize future content with AI insights"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Smart Learning",
      description: "AI learns from your best performers to create even better prompts"
    },
    {
      icon: <Play className="w-6 h-6" />,
      title: "One-Click Generation",
      description: "From idea to video in minutes, not hours. Streamlined creative workflow"
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out VeoPrompt",
      features: ["5 prompts/month", "3 video generations", "Basic analytics", "Community support"]
    },
    {
      name: "Creator",
      price: "$29",
      period: "/month",
      description: "For growing content creators",
      features: ["50 prompts/month", "30 video generations", "Advanced analytics", "Priority support", "Custom templates"],
      popular: true
    },
    {
      name: "Agency",
      price: "$99",
      period: "/month",
      description: "For teams and agencies",
      features: ["Unlimited prompts", "100 video generations", "Team collaboration", "API access", "White-label options", "Dedicated support"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl">VeoPrompt</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button data-testid="dashboard-btn">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" data-testid="login-btn">Log In</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="glow-primary" data-testid="get-started-btn">
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden mt-4 pb-4 space-y-4"
            >
              <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground">How It Works</a>
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                {isAuthenticated ? (
                  <Link to="/dashboard" className="flex-1">
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" className="w-full">Log In</Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="hero-glow" />
        
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <motion.div {...fadeUp} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI-Powered Video Creation</span>
            </div>
            
            <h1 className="font-heading font-bold text-5xl md:text-7xl tracking-tight leading-none">
              Your AI Creative Director
              <br />
              <span className="text-gradient">for Short-Form Video</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
              Transform ideas into viral-ready video prompts. Generate cinematic content for 
              Instagram Reels, TikTok, and YouTube Shorts with AI that learns what works.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" className="glow-primary text-lg px-8 py-6" data-testid="hero-cta-btn">
                  Start Creating <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="hero-demo-btn">
                  <Play className="w-5 h-5 mr-2" /> See How It Works
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass-dark rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
              <div className="bg-card rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-sm text-muted-foreground font-mono">VeoPrompt Dashboard</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                    <div className="w-32 h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <Film className="w-12 h-12 text-primary/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">2.4M</div>
                      <div className="text-sm text-muted-foreground">Views</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-accent">89%</div>
                      <div className="text-sm text-muted-foreground">Retention</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">156K</div>
                      <div className="text-sm text-muted-foreground">Shares</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              Everything You Need to Create
              <br />
              <span className="text-gradient">Viral Content</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete suite of AI tools designed for modern content creators, agencies, and growth marketers.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="p-8 rounded-2xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {feature.icon}
                </div>
                <h3 className="font-heading font-medium text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              From Idea to Video in <span className="text-gradient">3 Steps</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Describe Your Vision", desc: "Enter your niche, platform, tone, and goal. Add any custom ideas." },
              { step: "02", title: "AI Creates Prompt", desc: "Our AI generates a cinematic, scene-by-scene video prompt optimized for engagement." },
              { step: "03", title: "Generate & Publish", desc: "Send to Gemini Veo, get your video, and post directly to your platforms." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-7xl font-heading font-bold text-muted/20 absolute -top-4 -left-2">{item.step}</div>
                <div className="pt-12 pl-4">
                  <h3 className="font-heading font-medium text-xl mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground">
              Start free, scale as you grow.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-primary bg-card shadow-xl' : 'border-border bg-card/50'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-heading font-medium text-xl mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button 
                    className={`w-full ${plan.popular ? 'glow-primary' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                  >
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight mb-4">
              Ready to Transform Your Content?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of creators using AI to produce viral-ready video content.
            </p>
            <Link to="/register">
              <Button size="lg" className="glow-primary text-lg px-8 py-6" data-testid="final-cta-btn">
                Start Creating for Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Film className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold">VeoPrompt</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 VeoPrompt. AI Creative Director for Short-Form Content.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
