import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, ArrowRight, Bot, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  require_login: boolean;
  description?: string | null;
  custom_content?: string | null;
}

const OrganizationGameLobby = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAnonymousAuth();
  const [searchParams] = useSearchParams();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState(searchParams.get("code") || "");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error || !data) {
        toast({
          title: t('lobby.organizationNotFound', { ns: 'organization' }),
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setOrganization(data);

      // Load custom Google Font if specified
      if (data.font_family && data.font_family !== 'Roboto') {
        const fontName = data.font_family.replace(/\s+/g, '+');
        const linkId = `google-font-${fontName}`;
        let link = document.getElementById(linkId) as HTMLLinkElement;

        if (!link) {
          link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;700&display=swap`;
          document.head.appendChild(link);
        }
      }

      // Set CSS variables
      document.documentElement.style.setProperty('--org-primary', data.primary_color);
      document.documentElement.style.setProperty('--org-secondary', data.secondary_color);
      if (data.font_family) {
        document.documentElement.style.setProperty('--org-font', data.font_family);
      }

      setLoading(false);
    };

    loadOrganization();
  }, [slug, navigate, toast]);

  const createRoom = async () => {
    if (!playerName.trim() || !organization || !user) return;

    setIsCreating(true);

    try {
      // Re-fetch organization to get the latest require_login setting
      const { data: freshOrg, error: orgError } = await supabase
        .from('organizations')
        .select('require_login')
        .eq('id', organization.id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      }

      const requireLogin = freshOrg?.require_login ?? organization.require_login;

      if (requireLogin && user.is_anonymous) {
        setIsCreating(false);
        toast({
          title: t('lobby.loginRequired', { ns: 'organization' }),
          description: t('lobby.loginRequiredDesc', { ns: 'organization' }),
          variant: "destructive"
        });
        navigate(`/org/${slug}/login`);
        return;
      }

      // Create room linked to organization
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          host_name: playerName.trim(),
          status: 'waiting',
          organization_id: organization.id
        })
        .select()
        .single();

      if (roomError || !room) throw roomError || new Error("Failed to create room");

      // Add host as first player with user_id
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName.trim(),
          is_host: true,
          user_id: user.id,
          organization_id: organization.id
        });

      if (playerError) throw playerError;

      navigate(`/org/${slug}/game/${room.join_code}?name=${encodeURIComponent(playerName)}&host=true`);
    } catch (error: any) {
      toast({
        title: t('lobby.errorCreatingRoom', { ns: 'organization' }),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim() || !organization || !user) return;

    setIsJoining(true);

    try {
      // Re-fetch organization to get the latest require_login setting
      const { data: freshOrg, error: orgError } = await supabase
        .from('organizations')
        .select('require_login')
        .eq('id', organization.id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      }

      const requireLogin = freshOrg?.require_login ?? organization.require_login;

      if (requireLogin && user.is_anonymous) {
        setIsJoining(false);
        toast({
          title: t('lobby.loginRequired', { ns: 'organization' }),
          description: t('lobby.loginRequiredDesc', { ns: 'organization' }),
          variant: "destructive"
        });
        navigate(`/org/${slug}/login`);
        return;
      }

      const normalizedCode = roomCode.trim();

      // Use the validation function
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_join_code', { _join_code: normalizedCode });

      if (validationError) throw validationError;

      if (!validation || !validation.room_exists) {
        throw new Error("Room not found");
      }

      // Check organization match
      if (validation.organization_id !== organization.id) {
        throw new Error("Room not found for this organization");
      }

      if (validation.user_already_joined) {
        // User already in this room, just navigate
        navigate(`/org/${slug}/game/${normalizedCode}?name=${encodeURIComponent(playerName)}`);
        return;
      }

      if (validation.room_status !== 'waiting') {
        throw new Error("Game already started");
      }

      if ((validation.player_count as number) >= 6) {
        throw new Error("Room is full");
      }

      // Add player with user_id
      const { error: playerError } = await supabase
        .from('players')
        .insert([{
          room_id: validation.room_id as string,
          name: playerName.trim(),
          is_host: false,
          user_id: user.id,
          organization_id: organization.id
        }]);

      if (playerError) {
        // Handle unique constraint violation (user already in room)
        if (playerError.code === '23505') {
          navigate(`/org/${slug}/game/${normalizedCode}?name=${encodeURIComponent(playerName)}`);
          return;
        }
        throw playerError;
      }

      navigate(`/org/${slug}/game/${normalizedCode}?name=${encodeURIComponent(playerName)}`);
    } catch (error: any) {
      toast({
        title: t('lobby.errorJoiningRoom', { ns: 'organization' }),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading || authLoading || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">{t('lobby.loading', { ns: 'organization' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: organization.font_family }}>
      <OrganizationHeader organization={organization} />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(`/org/${slug}`)}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('lobby.exitGame', { ns: 'organization' })}
          </Button>
          <div className="text-center mb-12">
            <h2
              className="text-5xl md:text-6xl font-bold mb-4"
              style={{ color: organization.primary_color }}
            >
              {t('lobby.playOrg', { ns: 'organization', orgName: organization.name })}
            </h2>
          {organization.description && (
            <p className="text-xl text-muted-foreground mb-4">
              {organization.description}
            </p>
          )}
          {organization.custom_content && (
            <div className="text-lg text-muted-foreground mt-4">
              {organization.custom_content}
            </div>
          )}
          {organization.require_login && !user && (
            <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-4">
              {t('lobby.loginNote', { ns: 'organization' })}
            </p>
          )}
        </div>
      </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: organization.primary_color }}
              >
                <Plus className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-center">{t('lobby.createRoom', { ns: 'organization' })}</CardTitle>
              <CardDescription className="text-center">
                {t('lobby.createRoomDesc', { ns: 'organization' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('lobby.yourName', { ns: 'organization' })}</label>
                <Input
                  placeholder={t('lobby.enterYourName', { ns: 'organization' })}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                />
              </div>
              <Button
                size="lg"
                className="w-full text-white"
                onClick={createRoom}
                disabled={!playerName.trim() || isCreating}
                style={{ backgroundColor: organization.primary_color }}
              >
                {isCreating ? t('lobby.creating', { ns: 'organization' }) : t('lobby.createGameRoom', { ns: 'organization' })}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto"
                style={{ backgroundColor: organization.secondary_color }}
              >
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-center">{t('lobby.joinRoom', { ns: 'organization' })}</CardTitle>
              <CardDescription className="text-center">
                {t('lobby.joinRoomDesc', { ns: 'organization' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('lobby.yourName', { ns: 'organization' })}</label>
                <Input
                  placeholder={t('lobby.enterYourName', { ns: 'organization' })}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t('lobby.roomCode', { ns: 'organization' })}</label>
                <Input
                  placeholder={t('lobby.roomCodeExample', { ns: 'organization' })}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                />
              </div>
              <Button
                size="lg"
                className="w-full text-white"
                onClick={joinRoom}
                disabled={!playerName.trim() || !roomCode.trim() || isJoining}
                style={{ backgroundColor: organization.secondary_color }}
              >
                {isJoining ? t('lobby.joining', { ns: 'organization' }) : t('lobby.joinGameRoom', { ns: 'organization' })}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <OrganizationFooter primaryColor={organization.primary_color} />
    </div>
  );
};

export default OrganizationGameLobby;