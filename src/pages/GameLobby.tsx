import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, ArrowRight, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";


const GameLobby = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAnonymousAuth();
  const [searchParams] = useSearchParams();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState(searchParams.get("code") || "");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createRoom = async () => {
    if (!playerName.trim() || !user) return;
    setIsCreating(true);
    
    try {
      // Create room in database (join_code is auto-generated)
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          host_name: playerName.trim(),
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError || !room) throw roomError || new Error(t('gameLobby.failedToCreateRoom'));

      // Add host as first player with user_id
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: room.id,
          name: playerName.trim(),
          is_host: true,
          user_id: user.id
        });

      if (playerError) throw playerError;

      navigate(`/game/${room.join_code}?name=${encodeURIComponent(playerName)}&host=true`);
    } catch (error: any) {
      toast({
        title: t('gameLobby.errorCreatingRoom'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim() || !user) return;
    setIsJoining(true);
    
    try {
      const normalizedCode = roomCode.trim();
      
      // Use the validation function
      const { data: validation, error: validationError } = await supabase
        .rpc('validate_join_code', { _join_code: normalizedCode });

      if (validationError) throw validationError;
      
      if (!validation || !validation.room_exists) {
        throw new Error(t('gameLobby.roomNotFound'));
      }

      if (validation.user_already_joined) {
        // User already in this room, just navigate
        navigate(`/game/${normalizedCode}?name=${encodeURIComponent(playerName)}`);
        return;
      }

      if (validation.room_status !== 'waiting') {
        throw new Error(t('gameLobby.gameAlreadyStarted'));
      }

      if ((validation.player_count as number) >= 6) {
        throw new Error(t('gameLobby.roomIsFull'));
      }

      // Add player with user_id
      const { data: insertedPlayer, error: playerError } = await supabase
        .from('players')
        .insert([{
          room_id: validation.room_id as string,
          name: playerName.trim(),
          is_host: false,
          user_id: user.id
        }])
        .select();

      if (playerError) {
        // Handle unique constraint violation (user already in room)
        if (playerError.code === '23505') {
          navigate(`/game/${normalizedCode}?name=${encodeURIComponent(playerName)}`);
          return;
        }
        throw playerError;
      }

      navigate(`/game/${normalizedCode}?name=${encodeURIComponent(playerName)}`);
    } catch (error: any) {
      toast({
        title: t('gameLobby.errorJoiningRoom'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(var(--knowsy-blue)/.1)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--knowsy-blue))] mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">{t('gameLobby.initializingSession')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(var(--knowsy-blue)/.1)]">
      <Header />
      <main className="container mx-auto px-4 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl mb-3 md:mb-4 bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
            {t('gameLobby.title')}
          </h1>
          <p className="font-body text-base sm:text-lg md:text-xl text-muted-foreground px-4">
            {t('gameLobby.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-[hsl(var(--knowsy-blue))] transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center mb-3 mx-auto">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="font-heading text-xl md:text-2xl text-center">{t('gameLobby.createRoom.title')}</CardTitle>
              <CardDescription className="font-body text-center">
                {t('gameLobby.createRoom.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium mb-2 block">{t('gameLobby.yourName')}</label>
                <Input
                  placeholder={t('gameLobby.enterYourName')}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="font-body"
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                />
              </div>
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full"
                onClick={createRoom}
                disabled={!playerName.trim() || isCreating}
              >
                {isCreating ? t('gameLobby.creating') : t('gameLobby.createGameRoom')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[hsl(var(--knowsy-purple))] transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-red))] flex items-center justify-center mb-3 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="font-heading text-xl md:text-2xl text-center">{t('gameLobby.joinRoom.title')}</CardTitle>
              <CardDescription className="font-body text-center">
                {t('gameLobby.joinRoom.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium mb-2 block">{t('gameLobby.yourName')}</label>
                <Input
                  placeholder={t('gameLobby.enterYourName')}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="font-body"
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium mb-2 block">{t('gameLobby.roomCode')}</label>
                <Input
                  placeholder={t('gameLobby.roomCodeExample')}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="font-body"
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                />
              </div>
              <Button 
                variant="game" 
                size="lg" 
                className="w-full"
                onClick={joinRoom}
                disabled={!playerName.trim() || !roomCode.trim() || isJoining}
              >
                {isJoining ? t('gameLobby.joining') : t('gameLobby.joinGameRoom')}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GameLobby;