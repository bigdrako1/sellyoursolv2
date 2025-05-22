
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, AlertCircle, LogOut, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  authenticateTelegramUser,
  getTelegramSession,
  signOutFromTelegram,
  isAuthenticatedWithTelegram,
  TelegramUserSession
} from "@/services/telegramAuthService";

interface TelegramAuthenticationProps {
  onAuthenticationChange?: (isAuthenticated: boolean) => void;
}

const TelegramAuthentication: React.FC<TelegramAuthenticationProps> = ({ onAuthenticationChange }) => {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<TelegramUserSession | null>(null);

  // Check for existing session on component mount
  useEffect(() => {
    const existingSession = getTelegramSession();
    if (existingSession && existingSession.isAuthenticated) {
      setSession(existingSession);
      onAuthenticationChange?.(true);
    }
  }, [onAuthenticationChange]);

  const handleSendCode = async () => {
    if (!phone) {
      toast.error("Phone number required", {
        description: "Please enter your phone number"
      });
      return;
    }

    // Clean up phone number - remove spaces and ensure it has a + prefix
    const cleanedPhone = phone.replace(/\s+/g, '');
    const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;
    setPhone(formattedPhone);

    setIsLoading(true);

    try {
      console.log(`Attempting to send verification code to: ${formattedPhone}`);
      await authenticateTelegramUser(formattedPhone);
      setStep('code');
    } catch (error) {
      console.error("Failed to send verification code:", error);
      toast.error("Failed to send code", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      toast.error("Verification code required", {
        description: "Please enter the verification code sent to your phone"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Attempting to verify code: ${code} for phone: ${phone}`);
      const sessionData = await authenticateTelegramUser(phone, code);
      setSession(sessionData);
      onAuthenticationChange?.(true);

      toast.success("Telegram connected successfully", {
        description: "You can now receive notifications and monitor channels"
      });
    } catch (error) {
      console.error("Verification failed:", error);
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
    setStep('phone');
    setPhone("");
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
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>{session.phone}</span>
              </div>
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

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (with country code)</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number with country code"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-black/20 border-white/10"
              />
              <p className="text-xs text-gray-400 mt-1">
                Include your country code (e.g., +1 for US, +44 for UK, +91 for India)
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
              ) : "Send Verification Code"}
            </Button>
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
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('phone')}
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
