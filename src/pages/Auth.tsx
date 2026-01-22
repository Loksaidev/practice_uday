import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IntentSelectionDialog from "@/components/auth/IntentSelectionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Auth = () => {
  const { t } = useTranslation();

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "", color: "" };

    // Common weak passwords
    const weakPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football', 'admin', 'root', 'test', 'user', 'login', 'hello', 'world'];

    // Check if password is in common weak list
    if (weakPasswords.includes(pwd.toLowerCase())) {
      return { level: 1, label: t('auth.passwordStrength.weak'), color: "text-red-500" };
    }

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    if (strength <= 1) return { level: 1, label: t('auth.passwordStrength.weak'), color: "text-red-500" };
    if (strength <= 2) return { level: 2, label: t('auth.passwordStrength.fair'), color: "text-yellow-500" };
    if (strength <= 3) return { level: 3, label: t('auth.passwordStrength.good'), color: "text-blue-500" };
    return { level: 4, label: t('auth.passwordStrength.strong'), color: "text-green-500" };
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);

  const checkUserRoleAndRedirect = async (userId: string) => {
    try {
      // Check if user is a super admin
      const { data: superAdminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();

      if (superAdminRole) {
        navigate("/super-admin");
        return;
      }

      // Check if user has an organization application
      const { data: orgApplication } = await supabase
        .from("organizations")
        .select("id, status, name, created_at")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (orgApplication) {
        if (orgApplication.status === "approved") {
          // Check if they're an org admin member
          const { data: orgAdmin } = await supabase
            .from("organization_members")
            .select("role")
            .eq("user_id", userId)
            .eq("organization_id", orgApplication.id)
            .eq("role", "org_admin")
            .maybeSingle();

          if (orgAdmin) {
            navigate("/dashboard");
            return;
          }
        } else if (orgApplication.status === "pending") {
          toast({
            title: t('auth.applicationPending'),
            description: t('auth.pendingDescription'),
          });
          navigate("/");
          return;
        } else if (orgApplication.status === "rejected") {
          toast({
            title: t('auth.applicationStatus'),
            description: t('auth.rejectedDescription'),
          });
          setShowIntentDialog(true);
          return;
        }
      }

      // Check if user has set their intent before
      const userIntent = localStorage.getItem("user_intent");
      if (userIntent === "player") {
        navigate("/play");
        return;
      } else if (userIntent === "org_applicant" && !orgApplication) {
        navigate("/apply");
        return;
      }

      // New user without role or application - show intent dialog
      setShowIntentDialog(true);
    } catch (error) {
      console.error("Error checking user role:", error);
      navigate("/");
    }
  };
  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        // Use setTimeout to defer the role check to avoid blocking
        setTimeout(() => {
          checkUserRoleAndRedirect(session.user.id);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  // Check for email confirmation success and Google OAuth callbacks
  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    const googleSignIn = searchParams.get('google_signin');
    const googleSignUp = searchParams.get('google_signup');

    if (confirmed === 'true') {
      setShowConfirmationSuccess(true);
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('confirmed');
      window.history.replaceState(null, '', newUrl.pathname + newUrl.search);
    }

    // Handle Google Sign In callback - verify user exists
    if (googleSignIn === 'true') {
      const checkGoogleSignInUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if user exists in profiles table (existing user)
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          // Check if the profile was created before this session (within last 30 seconds = new user)
          const userCreatedAt = new Date(session.user.created_at).getTime();
          const now = Date.now();
          const isNewUser = (now - userCreatedAt) < 30000; // 30 seconds

          if (isNewUser && !profile) {
            // This is a new user trying to sign in - they should sign up instead
            await supabase.auth.signOut();
            toast({
              variant: "destructive",
              title: t('auth.accountNotFound'),
              description: t('auth.pleaseSignUp'),
            });
          }

          // Clean up the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('google_signin');
          window.history.replaceState(null, '', newUrl.pathname + newUrl.search);
        }
      };
      checkGoogleSignInUser();
    }

    // Handle Google Sign Up callback - welcome new user
    if (googleSignUp === 'true') {
      const handleGoogleSignUpCallback = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          toast({
            title: t('auth.success'),
            description: t('auth.googleSignUpSuccess'),
          });

          // Clean up the URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('google_signup');
          window.history.replaceState(null, '', newUrl.pathname + newUrl.search);
        }
      };
      handleGoogleSignUpCallback();
    }
  }, [searchParams, toast, t]);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: t('auth.success'),
        description: t('auth.signInSuccess'),
      });

      // The onAuthStateChange listener will handle the redirect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: error.message || t('auth.signInFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In - Only for existing users
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Get the redirect URL
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? window.location.origin : (import.meta.env.VITE_APP_URL || window.location.origin);
      const redirectUrl = `${baseUrl}/auth?google_signin=true`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: error.message || t('auth.googleSignInFailed'),
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Sign Up - For new users
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Get the redirect URL
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? window.location.origin : (import.meta.env.VITE_APP_URL || window.location.origin);
      const redirectUrl = `${baseUrl}/auth?google_signup=true`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: error.message || t('auth.googleSignUpFailed'),
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Starting signup process...");
    console.log("Signup data:", { email, fullName, passwordLength: password.length });

    try {
      // For local testing, use current origin; for production, use configured URL
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? window.location.origin : (import.meta.env.VITE_APP_URL || window.location.origin);
      const redirectUrl = `${baseUrl}/auth?confirmed=true`;

      console.log("Current window.location:", {
        origin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port,
        href: window.location.href
      });
      console.log("Environment VITE_APP_URL:", import.meta.env.VITE_APP_URL);
      console.log("Is localhost:", isLocalhost);
      console.log("Calculated baseUrl:", baseUrl);
      console.log("Final redirectUrl:", redirectUrl);

      console.log("Redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });

      console.log("Supabase signup response:", { data, error });

      if (error) {
        console.error("Signup error details:", error);
        throw error;
      }

      if (data?.user) {
        console.log("User created successfully:", data.user.id);
        toast({
          title: t('auth.success'),
          description: t('auth.accountCreated')
        });
      } else {
        console.warn("Signup completed but no user data returned");
        toast({
          title: t('auth.success'),
          description: t('auth.accountCreated')
        });
      }
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: error.message || t('auth.signUpFailed')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsSendingReset(true);

    try {
      // For local testing, use current origin; for production, use configured URL
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? window.location.origin : (import.meta.env.VITE_APP_URL || window.location.origin);
      const redirectUrl = `${baseUrl}/reset-password?t=${Date.now()}`;

      console.log("Password reset - Current window.location:", {
        origin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port
      });
      console.log("Password reset - Final redirectUrl:", redirectUrl);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;

      toast({
        title: t('auth.resetLinkSent'),
        description: t('auth.checkInbox'),
      });

      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: error.message || t('auth.resetEmailFailed'),
      });
    } finally {
      setIsSendingReset(false);
    }
  };
  return <div className="min-h-screen flex flex-col">
    <Header />

    <IntentSelectionDialog
      open={showIntentDialog}
      onOpenChange={setShowIntentDialog}
    />

    {showConfirmationSuccess && (
      <Dialog open={showConfirmationSuccess} onOpenChange={setShowConfirmationSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl text-green-600">Email Confirmed! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Your email has been successfully confirmed. You can now sign in to your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Check className="w-16 h-16 text-green-500" />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowConfirmationSuccess(false)} className="w-full">
              Continue to Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

    <main className="flex-1 flex items-center justify-center px-4 my-0 py-[100px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">{t('auth.welcomeToKnowsy')}</CardTitle>
          <CardDescription>{t('auth.signInOrCreate')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t('auth.email')}</Label>
                  <Input id="signin-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setIsResetDialogOpen(true)}
                    disabled={isLoading}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signIn')}
                </Button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {t('auth.continueWithGoogle')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                  <Input id="signup-name" type="text" placeholder={t('auth.fullNamePlaceholder')} value={fullName} onChange={e => setFullName(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <Input id="signup-email" type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {password.length >= 6 ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300" />
                      )}
                      <span className={password.length >= 6 ? "text-green-600" : "text-gray-500"}>
                        {t('auth.minimumCharacters', { current: password.length, min: 6 })}
                      </span>
                    </div>
                    {password && (
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-16 rounded-full bg-gray-200 overflow-hidden`}>
                          <div
                            className={`h-full transition-all ${getPasswordStrength(password).level === 1 ? "w-1/4 bg-red-500" :
                              getPasswordStrength(password).level === 2 ? "w-2/4 bg-yellow-500" :
                                getPasswordStrength(password).level === 3 ? "w-3/4 bg-blue-500" :
                                  "w-full bg-green-500"
                              }`}
                          />
                        </div>
                        <span className={`${getPasswordStrength(password).color} font-medium`}>
                          {getPasswordStrength(password).label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button id="signup-submit" type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signUp')}
                </Button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                {/* Google Sign Up Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {t('auth.continueWithGoogle')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>

    <Dialog
      open={isResetDialogOpen}
      onOpenChange={(open) => {
        setIsResetDialogOpen(open);
        if (!open) {
          setResetEmail("");
        }
      }}
    >
      <DialogContent>
        <form onSubmit={handlePasswordResetRequest} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t('auth.resetPassword')}</DialogTitle>
            <DialogDescription>
              {t('auth.resetDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reset-email">{t('auth.email')}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              disabled={isSendingReset}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              disabled={isSendingReset}
            >
              {t('auth.cancel')}
            </Button>
            <Button type="submit" disabled={isSendingReset}>
              {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.sendResetLink')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Footer />
  </div>;
};
export default Auth;