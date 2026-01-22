import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [hasCheckedRecovery, setHasCheckedRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkRecoveryLink = async () => {
      const hash = window.location.hash;
      console.log("Reset password hash:", hash); // Debug log

      const params = new URLSearchParams(hash.replace("#", ""));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      console.log("Parsed params:", { access_token: !!access_token, refresh_token: !!refresh_token, type }); // Debug log

      const isRecoveryLink = type === "recovery" && Boolean(access_token) && Boolean(refresh_token);

      if (isRecoveryLink && access_token && refresh_token) {
        try {
          setIsRecoveryMode(true);
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error("Session set error:", error);
            setIsRecoveryMode(false);
          } else {
            console.log("Session set successfully:", !!data.session);
          }

          // Clean up the URL
          window.history.replaceState(null, "", window.location.pathname);
        } catch (error) {
          console.error("Error setting session:", error);
          setIsRecoveryMode(false);
        }
      } else {
        console.log("Not a recovery link or missing parameters");
        setIsRecoveryMode(false);
      }

      setHasCheckedRecovery(true);
    };

    checkRecoveryLink();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out both password fields.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Make sure both passwords are the same.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log("Current session:", !!session, sessionError); // Debug log

      if (!session || sessionError) {
        throw new Error("This reset link is invalid or has expired. Please request a new one.");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully.",
      });

      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Unable to reset password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasCheckedRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">
              {!isRecoveryMode ? "Link invalid" : isSuccess ? "Password reset!" : "Set a new password"}
            </CardTitle>
            <CardDescription>
              {!isRecoveryMode
                ? "This reset link is invalid or expired. Request a fresh link from the login page."
                : isSuccess
                  ? "Hang tight, we're taking you back to the login page."
                  : "Choose a new password for your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isRecoveryMode ? (
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Go back to the login page and use “Forgot password?” to request a new link.
                </p>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Back to login
                </Button>
              </div>
            ) : isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="relative">
                  <CheckCircle className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
                </div>
                <p className="text-muted-foreground">Password reset successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;

