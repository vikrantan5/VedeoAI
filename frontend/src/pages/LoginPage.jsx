import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";
import { Film, Sun, Moon, ArrowLeft, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 items-center justify-center p-12">
        <div className="hero-glow opacity-50" />
        <div className="relative z-10 max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Film className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-2xl">VeoPrompt</span>
          </Link>
          <h1 className="font-heading font-bold text-4xl mb-4">
            Your AI Creative Director
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate cinematic video prompts, create viral content, and grow your audience with AI-powered insights.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">VeoPrompt</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="login-theme-toggle">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading font-semibold text-3xl mb-2">Welcome back</h2>
            <p className="text-muted-foreground mb-8">Enter your credentials to access your account</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                  className="h-12"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 glow-primary" 
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-8">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline" data-testid="login-register-link">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
