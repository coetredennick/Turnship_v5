import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Loader2, Shield, Zap, Users } from 'lucide-react';

export function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Check if we're returning from OAuth with success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true') {
      // Redirect to dashboard after successful auth
      window.location.href = '/';
    }
  }, []);
  
  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Redirect to backend OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  const handleDevLogin = async () => {
    if (import.meta.env.DEV) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/dev-login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Dev login failed:', error);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and features */}
        <div className="hidden lg:block space-y-6 p-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Turnship
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Smart outreach management for modern professionals
            </p>
          </div>
          
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Drafts</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Generate personalized emails with context-aware AI assistance
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Connection Tracking</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Manage your professional network with smart follow-up reminders
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Secure & Private</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Your data is encrypted and never shared with third parties
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth card */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">Welcome to Turnship</CardTitle>
              <CardDescription className="text-center">
                Sign in to manage your professional outreach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <Button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full h-11"
                      variant="default"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Continue with Google
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                          Secure Replit Auth
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-center text-gray-500">
                      By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <Button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full h-11"
                      variant="default"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Sign up with Google
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                          Quick & Secure
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-center text-gray-500">
                      Create your account in seconds with Replit authentication
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Dev mode login */}
              {import.meta.env.DEV && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleDevLogin}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Dev Mode: Quick Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}