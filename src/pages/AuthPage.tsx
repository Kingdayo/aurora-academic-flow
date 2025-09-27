
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Book, Brain, Timer, Mic, BarChart3 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import ThemeToggle from "@/components/ThemeToggle";
import ThemeToggle from "@/components/ThemeToggle";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.name, formData.email, formData.password);
      }

      if (result.error) {
        toast.error(result.error.message);
      } else if (!isLogin) {
        toast.success("Account created successfully! Please sign in to continue. 📧");
        setIsLogin(true);
        setFormData({ name: "", email: "", password: "" });
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(forgotPasswordEmail);
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center relative">
        {/* Blurred backdrop */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 z-10" />
        
        {/* Centered loading content */}
        <div className="relative z-20 flex flex-col items-center space-y-6 p-8">
          <div className="w-20 h-20 bg-purple-gradient rounded-full flex items-center justify-center animate-pulse-glow">
            <Book className="w-10 h-10 text-white" />
          </div>
          <LoadingSpinner size="lg" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Signing you in...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Preparing your AI-powered academic experience
            </p>
            <div className="mt-4 text-sm text-gray-500">
              This may take a few moments...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">

        {/* Theme Toggle positioned in top right */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 bg-purple-gradient rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Book className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Aurora</h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto px-4">
            AI-Powered Academic Planner for Modern Students
          </p>
        </div>

        {/* Main Content Container */}
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center">

          {/* Desktop Layout - Side by Side */}
          <div className="hidden lg:flex items-center justify-center gap-8 w-full">
            {/* Left Features - 2 items */}
            <div className="flex flex-col space-y-4 w-60">
              {[
                { icon: Brain, title: "AI Assistant", desc: "Smart task suggestions and academic help" },
                { icon: Timer, title: "Pomodoro Timer", desc: "Focused study sessions with breaks" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <feature.icon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Auth Card - Center */}
            <Card className="w-full max-w-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in">
              <CardHeader className="text-center space-y-2 pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {isLogin ? "Welcome Back" : "Get Started"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isLogin ? "Sign in to your account" : "Create your account to begin"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="auth-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="auth-name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="h-10 text-sm"
                        autoComplete="name"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="auth-email" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="auth-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange} 
                      className="h-10 text-sm" 
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auth-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="auth-password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="h-10 text-sm"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required 
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-gradient hover:opacity-90 hover-glow transition-all h-10 text-sm font-medium"
                    disabled={isLoading}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </Button>
                </form>

                {isLogin && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-purple-600 hover:text-purple-800 p-0 h-auto text-xs"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-600 hover:text-purple-800 p-0 h-auto font-medium text-sm"
                  >
                    {isLogin ? "Sign up here" : "Sign in here"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Features - 2 items */}
            <div className="flex flex-col space-y-4 w-60">
              {[
                { icon: Mic, title: "Voice Commands", desc: "Hands-free control with voice" },
                { icon: BarChart3, title: "Analytics", desc: "Track your progress and productivity" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <feature.icon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tablet/Mobile Layout - Centered */}
          <div className="lg:hidden flex flex-col items-center space-y-8 w-full max-w-md">
            {/* Auth Card */}
            <Card className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-purple-200/50 dark:border-purple-700/50 animate-scale-in">
              <CardHeader className="text-center space-y-2 pb-4">
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {isLogin ? "Welcome Back" : "Get Started"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isLogin ? "Sign in to your account" : "Create your account to begin"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="auth-name-mobile" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="auth-name-mobile"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="h-10 text-sm"
                        autoComplete="name"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="auth-email-mobile" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="auth-email-mobile"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange} 
                      className="h-10 text-sm" 
                      autoComplete="email"
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auth-password-mobile" className="text-sm font-medium">Password</Label>
                    <Input
                      id="auth-password-mobile"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="h-10 text-sm"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-gradient hover:opacity-90 hover-glow transition-all h-10 text-sm font-medium"
                    disabled={isLoading}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </Button>
                </form>

                {isLogin && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-purple-600 hover:text-purple-800 p-0 h-auto text-xs"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-purple-600 hover:text-purple-800 p-0 h-auto font-medium text-sm"
                  >
                    {isLogin ? "Sign up here" : "Sign in here"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
              {[
                { icon: Brain, title: "AI Assistant", desc: "Smart task suggestions" },
                { icon: Timer, title: "Pomodoro Timer", desc: "Focus sessions" },
                { icon: Mic, title: "Voice Commands", desc: "Hands-free control" },
                { icon: BarChart3, title: "Analytics", desc: "Track progress" }
              ].map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                  <feature.icon className="w-8 h-8 text-purple-600" />
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input 
                    id="forgot-email"
                    type="email" 
                    placeholder="Enter your email" 
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail("");
                    }}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-gradient hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AuthPage;
