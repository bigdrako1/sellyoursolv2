
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, AlertCircle, LogOut, Phone, Send, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  authenticateTelegramUser,
  getTelegramSession,
  signOutFromTelegram,
  isAuthenticatedWithTelegram,
  isVerificationSent,
  isVerificationComplete,
  getTelegramUsername,
  initTelegramLoginWidget,
  TelegramUserSession
} from "@/services/telegramAuthService";

interface TelegramAuthenticationProps {
  onAuthenticationChange?: (isAuthenticated: boolean) => void;
}

const TelegramAuthentication: React.FC<TelegramAuthenticationProps> = ({ onAuthenticationChange }) => {
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'auth' | 'code'>('auth');
  const [authMethod, setAuthMethod] = useState<'phone' | 'username'>('username');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<TelegramUserSession | null>(null);
  const telegramLoginRef = useRef<HTMLDivElement>(null);

  // Check for existing session on component mount
  useEffect(() => {
    const existingSession = getTelegramSession();
    if (existingSession && existingSession.isAuthenticated) {
      setSession(existingSession);
      onAuthenticationChange?.(true);
    }
  }, [onAuthenticationChange]);

  // Initialize Telegram login widget
  useEffect(() => {
    if (telegramLoginRef.current && authMethod === 'username') {
      const timerId = setTimeout(() => {
        try {
          initTelegramLoginWidget('telegram-login-container');
        } catch (error) {
          console.error('Failed to initialize Telegram login widget:', error);
        }
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [authMethod]);

  const handleSendCode = async () => {
    if (authMethod === 'phone') {
      if (!phone || phone.length < 10) {
        toast.error("Invalid phone number", {
          description: "Please enter a valid phone number"
        });
        return;
      }

      setIsLoading(true);

      try {
        await authenticateTelegramUser(phone);
        setStep('code');
      } catch (error) {
        toast.error("Failed to send code", {
          description: error instanceof Error ? error.message : "Unknown error occurred"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username || username.length < 5) {
        toast.error("Invalid username", {
          description: "Please enter a valid Telegram username"
        });
        return;
      }

      setIsLoading(true);

      try {
        await authenticateTelegramUser("", undefined, username);
        setStep('code');
      } catch (error) {
        toast.error("Failed to send code", {
          description: error instanceof Error ? error.message : "Unknown error occurred"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 5) {
      toast.error("Invalid code", {
        description: "Please enter a valid verification code"
      });
      return;
    }

    setIsLoading(true);

    try {
      const sessionData = await authenticateTelegramUser(
        authMethod === 'phone' ? phone : "",
        code,
        authMethod === 'username' ? username : undefined
      );
      setSession(sessionData);
      onAuthenticationChange?.(true);
    } catch (error) {
      toast.error("Authentication failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutFromTelegram();
    setSession(null);
    setStep('auth');
    setPhone("");
    setUsername("");
    setCode("");
    onAuthenticationChange?.(false);
  };

  if (session?.isAuthenticated) {
    return (
      <Card className="border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Telegram Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-900/20 p-4 rounded-md border border-green-900/30 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Connected to Telegram</span>
            </div>
            <div className="text-sm text-gray-300">
              {session.username ? (
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-blue-400" />
                  <span>@{session.username}</span>
                </div>
              ) : session.phone ? (
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span>{session.phone}</span>
                </div>
              ) : null}
              <p className="text-xs text-gray-400">
                Last active: {new Date(session.lastActive || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleSignOut}
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Connect to Telegram
        </CardTitle>
        <CardDescription>
          Connect your Telegram account to receive alerts and monitor channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-900/20 p-4 rounded-md border border-blue-900/30 space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">User Account Authentication</h4>
              <p className="text-xs text-gray-400 mt-1">
                Connect your Telegram account to monitor channels and groups you're a member of.
                This requires authenticating with your Telegram user account.
              </p>
            </div>
          </div>
        </div>

        {step === 'auth' ? (
          <div className="space-y-4">
            <Tabs defaultValue={authMethod} onValueChange={(value) => setAuthMethod(value as 'phone' | 'username')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="username">Username</TabsTrigger>
                <TabsTrigger value="phone">Phone Number</TabsTrigger>
              </TabsList>

              <TabsContent value="username" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Telegram Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter your Telegram username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                  <p className="text-xs text-gray-400">
                    Example: johndoe (without @)
                  </p>
                </div>

                <div className="bg-black/20 p-3 rounded-md border border-white/10">
                  <div className="text-xs text-gray-400 mb-2">
                    <span className="font-medium">Alternative Method:</span> Use Telegram's official login
                  </div>
                  <div id="telegram-login-container" ref={telegramLoginRef} className="flex justify-center">
                    {/* Telegram login widget will be inserted here */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                      onClick={() => window.open("https://telegram.org/", "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Telegram
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSendCode}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></span>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number with country code"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                  <p className="text-xs text-gray-400">
                    Example: +12025550123
                  </p>
                </div>
                <Button
                  onClick={handleSendCode}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></span>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-black/20 border-white/10"
              />
              <p className="text-xs text-gray-400">
                Enter the code sent to your {authMethod === 'phone' ? 'phone number' : 'Telegram account'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('auth')}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyCode}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></span>
                    Verifying...
                  </>
                ) : "Verify Code"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramAuthentication;
