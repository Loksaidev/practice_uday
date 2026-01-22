import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, LogOut, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { tOrg } from "@/utils/translation";
import { loadOrgTranslations } from "@/i18n/config";
import 'react-quill/dist/quill.snow.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationHeaderProps {
  organization: {
    id: string;
    name: string;
    logo_url?: string;
    slug: string;
    font_family?: string;
    primary_color?: string;
    enable_popup?: boolean;
    popup_description?: string | null;
  };
  showStoreLinks?: boolean;
  showPopup?: boolean;
}

const OrganizationHeader = ({ organization, showStoreLinks = true, showPopup = false }: OrganizationHeaderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ];

  const changeLanguage = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    localStorage.setItem("knowsy-language", languageCode);
    if (organization.id) {
      await loadOrgTranslations(organization.id, organization.slug, languageCode);
    }
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    // Check current auth state - only consider non-anonymous users as "logged in"
    supabase.auth.getSession().then(({ data: { session } }) => {
      // A user is considered logged in only if they have a session AND are not anonymous
      const isRealUser = !!session?.user && !session.user.is_anonymous;
      setIsLoggedIn(isRealUser);
      if (isRealUser && session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // A user is considered logged in only if they have a session AND are not anonymous
      const isRealUser = !!session?.user && !session.user.is_anonymous;
      setIsLoggedIn(isRealUser);
      if (isRealUser && session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show custom popup toast if enabled and showPopup is true, only once per session
  useEffect(() => {
    if (showPopup && organization.enable_popup && organization.popup_description) {
      const key = `popup_shown_${organization.slug}`;
      if (!sessionStorage.getItem(key)) {
        toast({
          description: <div className="ql-editor" dangerouslySetInnerHTML={{ __html: organization.popup_description }} />,
        });
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [showPopup, organization.enable_popup, organization.popup_description, organization.slug, toast]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await supabase.auth.signOut();
    navigate(`/org/${organization.slug}`);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-sm"
      style={{
        backgroundColor: organization.primary_color ? `${organization.primary_color}15` : 'rgba(255, 255, 255, 0.05)',
        borderBottomColor: organization.primary_color || 'hsl(var(--border))'
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to={`/org/${organization.slug}`}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {organization.logo_url && (
            <img
              src={organization.logo_url}
              alt={tOrg('org.name', `${organization.name} logo`, organization.id, organization.slug)}
              className="h-10 w-10 object-contain"
            />
          )}
          <h1
            className="text-xl font-bold hidden lg:block"
            style={{
              fontFamily: organization.font_family || 'inherit',
              color: organization.primary_color || 'inherit'
            }}
          >
            {tOrg('org.name', organization.name, organization.id, organization.slug)}
          </h1>
        </Link>
        <nav className="flex items-center gap-6">
          {showStoreLinks && (
            <>
              <Link
                to={`/org/${organization.slug}/store`}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {t('header.store', { ns: 'organization' })}
              </Link>
              <Link
                to={`/org/${organization.slug}/cart`}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {t('header.cart', { ns: 'organization' })}
              </Link>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 rounded-3xl p-2"
              >
                <Globe className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onSelect={() => changeLanguage(language.code)}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{language.flag}</span>
                  {language.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {isLoggedIn ? (
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:ring-2 hover:ring-offset-2"
                  style={{
                    backgroundColor: organization.primary_color || '#6366f1',
                    color: 'white'
                  }}
                  aria-label="User menu"
                >
                  <User className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full pt-2">
                    {/* Invisible bridge to prevent hover gap */}
                    <div
                      className="w-64 rounded-lg shadow-lg border bg-background/95 backdrop-blur-sm overflow-hidden"
                      style={{ borderColor: organization.primary_color || 'hsl(var(--border))' }}
                    >
                      {/* User Email */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                        <p className="text-xs text-muted-foreground mb-1">{t('header.signedInAs', { ns: 'organization' })}</p>
                        <p className="text-sm font-medium truncate">{userEmail}</p>
                      </div>

                      {/* Logout Button */}
                      <div className="p-2">
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('header.logout', { ns: 'organization' })}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={`/org/${organization.slug}/login`}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {t('header.login', { ns: 'organization' })}
              </Link>
            )}
          </nav>
      </div>
    </header>
  );
};

export default OrganizationHeader;