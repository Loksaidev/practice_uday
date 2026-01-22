import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import knowsyLogo from "@/assets/images/logo/Logo.svg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./LanguageSelector";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, ShoppingCart, User as UserIcon, Minus, Plus, X, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import PrimaryButton from "./ui/custom/PrimaryButton";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ShoppingBag from "@/assets/images/icons/ShoppingBag.svg";
import Hamburger from "@/assets/images/icons/Hamburger.svg";

// Import custom font
import annieFont from "@/assets/fonts/AnnieUseYourTelescope-Regular.ttf";

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null
  );
  const [products, setProducts] = useState<any[]>([]);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: cartItems, totalItems, updateQuantity, removeFromCart } = useCart();

  const isGamePage =
    location.pathname.startsWith("/play") ||
    location.pathname.startsWith("/game") ||
    location.pathname.startsWith("/org");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkRoles(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkRoles(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
        setIsOrgAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("store_items").select("*");
      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
    };
    fetchProducts();
  }, []);

  const checkRoles = async (userId: string) => {
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleData) {
      setUserRole("super_admin");
    }

    const { data: orgAdminData } = await supabase
      .from("organization_members")
      .select("role, organization_id")
      .eq("user_id", userId)
      .eq("role", "org_admin")
      .maybeSingle();

    if (orgAdminData) {
      setIsOrgAdmin(true);
    }

    const { data: orgApplication } = await supabase
      .from("organizations")
      .select("status")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (orgApplication && orgApplication.status === "pending") {
      setApplicationStatus("pending");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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

      console.log("Header password reset - Current window.location:", {
        origin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port
      });
      console.log("Header password reset - Final redirectUrl:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Reset link sent",
        description: "Check your inbox for instructions to reset your password.",
      });

      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Header password reset error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Unable to send reset email. Please try again.",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'AnnieUseYourTelescope';
            src: url(${annieFont}) format('truetype');
          }
          /* Increase size of the default sheet close button X */
          .absolute svg.lucide-x {
            height: 2rem;
            width: 2rem;
          }
        `}
      </style>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background ">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="hidden lg:flex items-center gap-6 w-[40%]">
            <Link to="/organizations">
              <PrimaryButton
                text={t("header.organizations")}
                bg_color="#ffffff"
                className="transition-transform hover:scale-105"
              />
            </Link>

            <Link to="/store">
              <Button
                className="bg-white text-black px-5 py-1 rounded-full font-bold text-base border-[3px] border-[#fcc804] flex items-center justify-center gap-2 hover:bg-white hover:text-black hover:scale-105 transition-transform font-heading"
                style={{ boxShadow: "0 4px 4px 0 rgba(0,0,0,0.25)" }}
              >
                <img src={ShoppingBag} alt="" className="w-4 h-4" />
                {t("header.shop")}
              </Button>
            </Link>
          </div>

          <Link to="/" className="hidden lg:flex items-center gap-2 group">
            <img
              src={knowsyLogo}
              alt="Knowsy Logo"
              className="lg:w-48 h-10 group-hover:scale-110 transition-transform"
            />
          </Link>

          <div className="hidden lg:flex items-center justify-end gap-3 w-[40%]">
            <LanguageSelector />
            
            <Link to="/play">
              <PrimaryButton
                text={t("header.playNow")}
                bg_color="#fcc804"
                className="whitespace-nowrap"
              />
            </Link>

            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="ml-12 p-0.5 cursor-pointer border-2 border-black rounded-full transition-colors hover:bg-gray-100">
                    <UserIcon className="w-5 h-5 text-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 md:w-96 lg:w-80 p-0 bg-[#FCC804] border-none overflow-hidden shadow-xl rounded-tr-none mt-2 ml-8">
                  <div className="p-6 font-['Slackey'] text-black">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        
                        <div className="font-sans text-xs flex flex-col mt-2">
                          <span className="opacity-70">Username</span>
                          <span className="font-bold truncate">{user.email}</span>
                          <span className="opacity-70 mt-1">{user.user_metadata?.first_name || 'First Name'} {user.user_metadata?.last_name || 'Last Name'}</span>
                        </div>
                      </div>
                      <div className=" p-2 border-2 border-black rounded-full mt-4">
                        <UserIcon className="w-12 h-12" />
                      </div>
                    </div>

                    <nav className="flex flex-col gap-2 font-sans text-sm mt-6">
                      {userRole === "super_admin" && (
                        <button onClick={() => navigate("/super-admin")} className="text-left hover:underline">
                          {t("header.superAdmin")}
                        </button>
                      )}
                      {isOrgAdmin && (
                        <button onClick={() => navigate("/dashboard")} className="text-left hover:underline">
                          {t("header.dashboard")}
                        </button>
                      )}
                      <button onClick={() => navigate("/profile")} className="text-left hover:underline">
                        edit information
                      </button>
                      <button onClick={() => navigate("/my-orders")} className="text-left hover:underline">
                        view payment details
                      </button>
                      <button
                        onClick={() => setIsResetDialogOpen(true)}
                        className="text-left hover:underline"
                      >
                        change password
                      </button>
                      <button onClick={handleLogout} className="text-left hover:underline mt-2 font-bold">
                        Sign out
                      </button>
                    </nav>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Link to="/auth">
                <PrimaryButton text={t("header.signIn")} bg_color="#fcc804" />
              </Link>
            )}

            <div className="relative">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <img
                      src={ShoppingBag}
                      className="w-5 group-hover:scale-110 transition-transform"
                    />
                    {totalItems > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center p-0 text-xs rounded-full bg-[#FCC804] text-black hover:bg-[#FCC804]"
                      >
                        {totalItems}
                      </Badge>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[280px] sm:w-[450px] md:w-[550px] lg:w-[450px] p-0 bg-[#FCC804] border-none overflow-hidden shadow-xl rounded-tr-none mt-2">
                  <div className="p-6 text-black">
                    <h3 className="font-['Slackey'] text-lg mb-4">Cart</h3>
                    
                    {cartItems.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-4 items-start bg-transparent">
                            <div className="w-32 h-32 rounded-sm overflow-hidden flex items-center justify-center border border-black/10">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-lg" style={{ fontFamily: 'AnnieUseYourTelescope' }}>{item.name}</span>
                              </div>
                              <span className="font-body text-sm">${item.price.toFixed(2)}</span>
                              
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center bg-[#D9D9D9] rounded-full px-2 py-1 gap-3">
                                  <button 
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                    className="hover:scale-125 transition-transform"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-body text-sm min-w-[12px] text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="hover:scale-125 transition-transform"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-base text-[#796105] hover:opacity-100 font-body"
                              >
                                Remove
                              </button>
                              </div>
                          </div>
                        </div>
                      ))}
                        
                        <div className="mt-4 pt-4">
                          <p className="text-sm font-body opacity-70 mb-4">
                            Taxes and shipping calculated at checkout
                          </p>
                          <button
                            onClick={() => navigate("/checkout")}
                            className="w-1/2 bg-black text-[#FCC804] font-['Slackey'] py-3 rounded-full text-lg hover:scale-[1.02] transition-transform shadow-lg"
                          >
                            Checkout
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center font-body opacity-60">
                        Your cart is empty
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="flex w-full lg:hidden justify-between items-center gap-2">
            <div className="w-[40%]">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <img src={Hamburger} alt="Menu Icon" className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                {/* DESIGN UPDATED:
                   - Removed 'left-4' so it touches the left side.
                   - Kept 'top-4' and 'bottom-4' for the vertical "cut" gap.
                   - Changed 'rounded-2xl' to 'rounded-r-2xl' so only the right edges are curved.
                */}
                <SheetContent 
                  side="left" 
                  className="w-[90%] sm:w-[450px] md:w-[550px] bg-[#FCC804] border-none p-0 flex flex-col top-4 left-0 bottom-4 h-[calc(100vh-32px)] rounded-r-2xl shadow-xl"
                >
                  <div className="flex justify-end p-6">
                    <SheetClose className="outline-none">
                      {/* X icon removed */}
                    </SheetClose>
                  </div>
                  
                  <nav className="flex flex-col gap-4 px-10 mt-4 text-black font-['Slackey']">
                    <Link to="/" className={`text-lg md:text-xl  py-2 rounded transition-colors ${location.pathname === "/" ? "text-white" : "hover:opacity-70"}`}>
                      Home Page
                    </Link>
                    <Link to="/play" className="text-lg md:text-xl hover:opacity-70 transition-opacity">
                      Start Playing
                    </Link>
                    <Link to="/organizations" className="text-lg md:text-xl hover:opacity-70 transition-opacity">
                      For Organisations
                    </Link>
                    <Link to="/store" className="text-lg md:text-xl flex items-center gap-2 hover:text-black transition-colors text-black">
                      Visit Shop <span className="text-lg md:text-xl mt-1">&gt;</span>
                    </Link>
                    <Link to="/cart" className="text-lg md:text-xl hover:opacity-70 transition-opacity">
                      View cart
                    </Link>
                    <Link to="/extend" className="text-lg md:text-xl hover:opacity-70 transition-opacity whitespace-nowrap">
                      Extend physical gameplay
                    </Link>

                    {!user ? (
                      <>
                        <Link to="/auth" className="text-lg md:text-xl hover:opacity-70 transition-opacity">
                          Sign in
                        </Link>
                        <Link to="/auth?mode=signup" className="text-lg md:text-xl hover:opacity-70 transition-opacity">
                          Sign up
                        </Link>
                      </>
                    ) : (
                      <>
                        <button onClick={handleLogout} className="text-lg md:text-xl text-left hover:opacity-70 transition-opacity">
                          Sign out
                        </button>
                      </>
                    )}
                    
                    <Link to="/contact" className="text-lg md:text-xl hover:opacity-70 transition-opacity">
                      Contact Sales
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            <Link to="/" className="flex items-center gap-2 group">
              <img src={knowsyLogo} alt="Knowsy Logo" className="lg:w-48 h-10 group-hover:scale-110 transition-transform" />
            </Link>

            <div className="flex items-center justify-end w-[40%] gap-2">
              <LanguageSelector />
              {user ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="p-0.5 cursor-pointer border-2 border-black rounded-full transition-colors hover:bg-gray-100">
                      <UserIcon className="w-5 h-5 text-foreground" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 bg-[#FCC804] border-none overflow-hidden shadow-xl rounded-tr-none mt-2 ml-8">
                    <div className="p-6 font-['Slackey'] text-black">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-1">

                          <div className="font-sans text-xs flex flex-col mt-2">
                            <span className="opacity-70">Username</span>
                            <span className="font-bold truncate">{user.email}</span>
                            <span className="opacity-70 mt-1">{user.user_metadata?.first_name || 'First Name'} {user.user_metadata?.last_name || 'Last Name'}</span>
                          </div>
                        </div>
                        <div className=" p-2 border-2 border-black rounded-full mt-4">
                          <UserIcon className="w-8 h-8" />
                        </div>
                      </div>

                      <nav className="flex flex-col gap-2 font-sans text-sm mt-6">
                        {userRole === "super_admin" && (
                          <button onClick={() => navigate("/super-admin")} className="text-left hover:underline">
                            {t("header.superAdmin")}
                          </button>
                        )}
                        {isOrgAdmin && (
                          <button onClick={() => navigate("/dashboard")} className="text-left hover:underline">
                            {t("header.dashboard")}
                          </button>
                        )}
                        <button onClick={() => navigate("/profile")} className="text-left hover:underline">
                          edit information
                        </button>
                        <button onClick={() => navigate("/my-orders")} className="text-left hover:underline">
                          view payment details
                        </button>
                        <button
                          onClick={() => setIsResetDialogOpen(true)}
                          className="text-left hover:underline"
                        >
                          change password
                        </button>
                        <button onClick={handleLogout} className="text-left hover:underline mt-2 font-bold">
                          Sign out
                        </button>
                      </nav>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Link to="/auth">
                  <div className="p-0.5 cursor-pointer border-2 border-black rounded-full transition-colors hover:bg-gray-100">
                    <UserIcon className="w-5 h-5 text-foreground" />
                  </div>
                </Link>
              )}
              {/* Rest of mobile right icons stay same */}
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative cursor-pointer group">
                      <img src={ShoppingBag} className="w-6" />
                      {totalItems > 0 && (
                        <Badge className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center p-0 text-xs rounded-full bg-[#FCC804] text-black">
                          {totalItems}
                        </Badge>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[350px] sm:w-[400px] md:w-[450px] p-0 bg-[#FCC804] border-none overflow-hidden shadow-xl rounded-tr-none mt-2">
                    <div className="p-6 text-black">
                      <h3 className="font-['Slackey'] text-lg mb-4">Cart</h3>

                      {cartItems.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 items-start bg-transparent">
                              <div className="w-32 h-32 rounded-sm overflow-hidden flex items-center justify-center border border-black/10">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                  <span className="font-medium text-lg" style={{ fontFamily: 'AnnieUseYourTelescope' }}>{item.name}</span>
                                </div>
                                <span className="font-body text-sm">${item.price.toFixed(2)}</span>

                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center bg-[#D9D9D9] rounded-full px-2 py-1 gap-3">
                                    <button
                                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                      className="hover:scale-125 transition-transform"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-body text-sm min-w-[12px] text-center">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="hover:scale-125 transition-transform"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-base text-[#796105] hover:opacity-100 font-body"
                                >
                                  Remove
                                </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="mt-4 pt-4">
                            <p className="text-sm font-body opacity-70 mb-4">
                              Taxes and shipping calculated at checkout
                            </p>
                            <button
                              onClick={() => navigate("/checkout")}
                              className="w-1/2 bg-black text-[#FCC804] font-['Slackey'] py-3 rounded-full text-lg hover:scale-[1.02] transition-transform shadow-lg"
                            >
                              Checkout
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center font-body opacity-60">
                          Your cart is empty
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </header>

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
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="header-reset-email">Email</Label>
              <Input
                id="header-reset-email"
                type="email"
                placeholder="Enter your email address"
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSendingReset}>
                {isSendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;