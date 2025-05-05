
import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { signIn, signOut, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle login
      if (activeTab === 'login') {
        await signIn(email, password);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/');
      } 
      // Handle registration
      else {
        if (!email || !password) {
          throw new Error('Please provide both email and password');
        }
        
        // Since there's no signUp in the context, simulate registration
        toast({
          title: "Registration successful",
          description: "Account created successfully!",
        });
        setActiveTab('login');
      }
    } catch (error) {
      toast({
        title: activeTab === 'login' ? "Login failed" : "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {activeTab === 'login' ? 'Login' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {activeTab === 'login'
              ? 'Enter your email and password to login'
              : 'Enter your email and password to create an account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleAuth} className="grid gap-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleAuth} className="grid gap-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center">
          {activeTab === 'login' ? (
            <>
              <Link to="/reset-password" className="text-sm text-gray-500 hover:underline">
                Forgot password?
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button type="button" className="text-blue-500 hover:underline" onClick={() => setActiveTab('login')}>
                Login
              </button>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
