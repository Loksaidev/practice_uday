import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Play, Trophy, Bot, X, QrCode, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { TopicSelectionPhase } from "@/components/game/TopicSelectionPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { ScoringPhase } from "@/components/game/ScoringPhase";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isAi: boolean;
}

interface GameRoom {
  id: string;
  status: string;
  game_phase: string;
  current_round: number;
  current_vip_id: string | null;
  total_rounds: number;
  vips_completed: number;
  organization_id: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
}

const OrganizationGameRoom = () => {
  const { slug, roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAnonymousAuth();

  const playerName = searchParams.get("name") || "Player";
  const isHost = searchParams.get("host") === "true";

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingAI, setIsAddingAI] = useState(false);
  const [isHostMigrating, setIsHostMigrating] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const aiTopicHandledRef = useRef<string | null>(null); // Track AI topic selection for phase/round
  const aiGuessHandledRef = useRef<string | null>(null); // Track AI guessing for phase/vip/round

  useEffect(() => {
    const loadOrganization = async () => {
      if (!slug) return;

      const { data } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, primary_color, secondary_color, font_family')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setOrganization(data);
      }
    };

    loadOrganization();
  }, [slug]);

  useEffect(() => {
    // Load custom Google Font if specified
    if (organization?.font_family && organization.font_family !== 'Roboto') {
      const fontName = organization.font_family.replace(/\s+/g, '+');
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
    if (organization?.primary_color) {
      document.documentElement.style.setProperty('--org-primary', organization.primary_color);
    }
    if (organization?.secondary_color) {
      document.documentElement.style.setProperty('--org-secondary', organization.secondary_color);
    }
    if (organization?.font_family) {
      document.documentElement.style.setProperty('--org-font', organization.font_family);
    }
  }, [organization]);



  const loadPlayers = async (currentRoomId: string) => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', currentRoomId)
      .order('joined_at', { ascending: true });

    if (error) {
      toast({
        title: t('gameRoom.errorLoadingPlayers', { ns: 'organization' }),
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const playersList = data.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.is_host,
      isAi: p.is_ai || false
    }));

    setPlayers(playersList);

    // If we were migrating host, check if a new one has been assigned
    if (playersList.some(p => p.isHost)) {
      setIsHostMigrating(false);
    }

    if (user) {
      const current = playersList.find(p =>
        data.find(d => d.id === p.id)?.user_id === user.id
      );
      if (current) {
        setCurrentPlayer(current);
      } else {
        const fallback = playersList.find(p => p.name === playerName);
        if (fallback) {
          setCurrentPlayer(fallback);
        }
      }
    }

    setLoading(false);
  };

  const loadGameRoom = async (currentRoomId: string) => {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', currentRoomId)
      .maybeSingle();

    if (error) {
      console.error("Error loading game room:", error);
      return;
    }

    if (!data) {
      navigate(`/org/${slug}/play`);
      return;
    }

    setGameRoom(data);
  };

  useEffect(() => {
    if (!roomCode) return;

    let playersChannel: RealtimeChannel;
    let roomChannel: RealtimeChannel;
    let pollInterval: NodeJS.Timeout;

    const setupRealtimeAndLoadRoom = async () => {
      if (authLoading) return;

      // Allow anonymous users for now
      // if (!user) {
      //   navigate(`/org/${slug}/play`);
      //   return;
      // }

      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('id')
        .ilike('join_code', roomCode)
        .maybeSingle();

      if (roomError || !room) {
        toast({
          title: t('gameRoom.roomNotFound', { ns: 'organization' }),
          description: t('gameRoom.roomDoesNotExist', { ns: 'organization' }),
          variant: "destructive"
        });
        navigate(`/org/${slug}/play`);
        return;
      }

      const currentRoomId = room.id;
      setRoomId(currentRoomId);

      await loadPlayers(currentRoomId);
      await loadGameRoom(currentRoomId);

      playersChannel = supabase
        .channel(`players-${currentRoomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${currentRoomId}`
          },
          () => {
            loadPlayers(currentRoomId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${currentRoomId}`
          },
          (payload) => {
            const oldPlayer = payload.old as Player;
            if (oldPlayer && oldPlayer.name) {
              toast({
                title: t('gameRoom.playerLeft', { ns: 'organization' }),
                description: `${oldPlayer.name} ${t('gameRoom.hasLeftTheGame', { ns: 'organization' })}`,
              });

              // Immediately remove the player from the local state for instant UI update
              setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== oldPlayer.id));

              if (oldPlayer.id === gameRoom?.current_vip_id) {
                if (currentPlayer?.isHost) {
                  supabase
                    .from("game_rooms")
                    .update({
                      current_round: gameRoom.current_round + 1,
                      game_phase: "topic_selection",
                      current_vip_id: null,
                    })
                    .eq("id", roomId);
                }
              }
            }
            if (payload.old && (payload.old as Player).isHost) {
              setIsHostMigrating(true);
            }

            // Check if only 1 player remains - end the game
            loadPlayers(currentRoomId).then(async () => {
              const { data: remainingPlayers } = await supabase
                .from('players')
                .select('id')
                .eq('room_id', currentRoomId);

              if (remainingPlayers && remainingPlayers.length <= 1 && gameRoom?.status === 'playing') {
                console.log('Only 1 player remaining, ending game');
                await supabase.rpc('end_game_early', { p_room_id: currentRoomId });
                toast({
                  title: t('gameRoom.gameEnded', { ns: 'organization' }),
                  description: t('gameRoom.notEnoughPlayers', { ns: 'organization' }),
                  variant: "destructive"
                });
                // Only navigate away if the current player is not among the remaining players
                if (!remainingPlayers.some(p => p.id === currentPlayer?.id)) {
                  navigate(`/org/${slug}/play`);
                }
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${currentRoomId}`
          },
          (payload) => {
            // Check if someone became the new host
            if (payload.new && payload.old && !payload.old.is_host && payload.new.is_host) {
              const newHostName = payload.new.name;
              if (user && payload.new.user_id === user.id) {
                toast({
                  title: t('gameRoom.youAreNowHost', { ns: 'organization' }),
                  description: t('gameRoom.previousHostLeft', { ns: 'organization' }),
                });
              } else {
                toast({
                  title: t('gameRoom.newHostAssigned', { ns: 'organization' }),
                  description: `${newHostName} ${t('gameRoom.isNowHost', { ns: 'organization' })}`,
                });
              }
            }
            loadPlayers(currentRoomId);
          }
        )
        .subscribe();

      roomChannel = supabase
        .channel(`room-updates-${currentRoomId}`, {
          config: {
            broadcast: { self: true }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_rooms',
            filter: `id=eq.${currentRoomId}`
          },
          (payload) => {
            if (payload.new) {
              setGameRoom(payload.new as GameRoom);
            }
            loadGameRoom(currentRoomId);
          }
        )
        .subscribe();

      pollInterval = setInterval(() => {
        loadPlayers(currentRoomId);
        loadGameRoom(currentRoomId);
      }, 2000);
    };

    setupRealtimeAndLoadRoom();

    return () => {
      if (playersChannel) supabase.removeChannel(playersChannel);
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [roomCode, toast, navigate, user, authLoading, slug]);

  const handleAITopicSelection = async () => {
    const aiPlayers = players.filter(p => p.isAi);

    await Promise.all(
      aiPlayers.map(async (aiPlayer) => {
        try {
          await supabase.functions.invoke('ai-player-topic-selection', {
            body: {
              playerId: aiPlayer.id,
              roomId: gameRoom!.id,
              round: gameRoom!.current_round
            }
          });
        } catch (error) {
          console.error('Error handling AI topic selection:', error);
        }
      })
    );
  };

  const handleAIGuesses = async () => {
    const aiPlayers = players.filter(p => p.isAi && p.id !== gameRoom!.current_vip_id);

    if (aiPlayers.length === 0) return;

    await Promise.all(
      aiPlayers.map(async (aiPlayer) => {
        try {
          await supabase.functions.invoke('ai-player-guess', {
            body: {
              playerId: aiPlayer.id,
              roomId: gameRoom!.id,
              round: gameRoom!.current_round,
              vipPlayerId: gameRoom!.current_vip_id
            }
          });
        } catch (error) {
          console.error('Error handling AI guess:', error);
        }
      })
    );
  };

  useEffect(() => {
    if (!gameRoom || gameRoom.game_phase !== 'topic_selection') return;

    // Create a unique key for this phase/round combination
    const phaseKey = `topic_selection-${gameRoom.current_round}`;

    // Skip if we've already handled this phase/round
    if (aiTopicHandledRef.current === phaseKey) {
      console.log('AI topic selection already handled for this phase/round, skipping...');
      return;
    }

    // Mark as handled before async operations
    aiTopicHandledRef.current = phaseKey;
    handleAITopicSelection();
  }, [gameRoom?.game_phase, gameRoom?.current_round]);

  useEffect(() => {
    if (!gameRoom || gameRoom.game_phase !== 'guessing' || !gameRoom.current_vip_id) return;

    // Create a unique key for this phase/vip/round combination
    const phaseKey = `guessing-${gameRoom.current_vip_id}-${gameRoom.current_round}`;

    // Skip if we've already handled this phase/vip/round
    if (aiGuessHandledRef.current === phaseKey) {
      console.log('AI guessing already handled for this phase/vip/round, skipping...');
      return;
    }

    // Mark as handled before async operations
    aiGuessHandledRef.current = phaseKey;
    handleAIGuesses();
  }, [gameRoom?.game_phase, gameRoom?.current_vip_id, gameRoom?.current_round]);

  useEffect(() => {
    if (gameRoom?.game_phase === 'finished' && roomId) {
      loadPlayers(roomId);
    }
  }, [gameRoom?.game_phase, roomId]);

  const copyRoomCode = () => {
    const joinUrl = `${window.location.origin}/org/${slug}/play?code=${roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    toast({
      title: t('gameRoom.joinLinkCopied', { ns: 'organization' }),
      description: t('gameRoom.shareWithFriends', { ns: 'organization' }),
    });
  };

  const getJoinUrl = () => {
    return `${window.location.origin}/org/${slug}/play?code=${roomCode}`;
  };

  const startGame = async () => {
    if (!roomId || !roomCode) return;

    try {
      const { error: scoreResetError } = await supabase
        .from('players')
        .update({ score: 0 })
        .eq('room_id', roomId);

      if (scoreResetError) throw scoreResetError;

      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: 'playing',
          game_phase: 'topic_selection',
          current_round: 1
        })
        .eq('id', roomId);

      if (error) throw error;

      await loadGameRoom(roomId);

      toast({
        title: t('gameRoom.gameStarted', { ns: 'organization' }),
        description: t('gameRoom.selectTopicMessage', { ns: 'organization' })
      });
    } catch (error: any) {
      toast({
        title: t('gameRoom.errorStartingGame', { ns: 'organization' }),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addAiPlayer = async () => {
    if (!roomCode || !roomId) return;
    setIsAddingAI(true);

    try {
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (count && count >= 6) {
        throw new Error("Room is full (maximum 6 players)");
      }

      const aiCount = players.filter(p => p.isAi).length;
      if (aiCount >= 5) {
        throw new Error("Maximum 5 AI players allowed");
      }

      const aiNames = ["Bot Alice", "Bot Bob", "Bot Charlie", "Bot Diana", "Bot Eve"];
      const usedNames = players.map(p => p.name);
      const availableNames = aiNames.filter(name => !usedNames.includes(name));

      if (availableNames.length === 0) {
        throw new Error("All AI player slots are taken");
      }

      const aiName = availableNames[0];

      const { error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomId,
          name: aiName,
          is_host: false,
          is_ai: true,
          user_id: null,
          score: 0
        });

      if (playerError) throw playerError;

      await loadPlayers(roomId);

      toast({
        title: t('gameRoom.aiPlayerAdded', { ns: 'organization' }),
        description: `${aiName} ${t('gameRoom.hasJoinedGame', { ns: 'organization' })}`,
      });
    } catch (error: any) {
      toast({
        title: t('gameRoom.errorAddingAi', { ns: 'organization' }),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAddingAI(false);
    }
  };

  const removeAiPlayer = async (playerId: string, playerName: string) => {
    if (!roomId) return;

    try {
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('is_ai', true);

      if (deleteError) throw deleteError;

      await loadPlayers(roomId);

      toast({
        title: t('gameRoom.aiPlayerRemoved', { ns: 'organization' }),
        description: `${playerName} ${t('gameRoom.hasLeftTheGame', { ns: 'organization' })}`,
      });
    } catch (error: any) {
      toast({
        title: t('gameRoom.errorRemovingAi', { ns: 'organization' }),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const leaveRoom = async () => {
    if (!currentPlayer || !roomId) return;

    try {
      // If leaving player is host, reassign to another player first
      if (currentPlayer.isHost) {
        const { data: newHostData, error: reassignError } = await supabase
          .rpc('reassign_host', {
            p_room_id: roomId,
            p_leaving_player_id: currentPlayer.id
          });

        if (reassignError) {
          console.error('Error reassigning host:', reassignError);
        } else if (newHostData && newHostData.length > 0) {
          console.log('New host assigned:', newHostData[0]);
        }
      }

      // Delete all player guesses related to this player (as guesser)
      const { error: deletePlayerGuessesError } = await supabase
        .from('player_guesses')
        .delete()
        .eq('player_id', currentPlayer.id);

      if (deletePlayerGuessesError) {
        console.error('Error deleting player guesses:', deletePlayerGuessesError);
      }

      // Delete all player guesses where this player was VIP
      const { error: deleteVipGuessesError } = await supabase
        .from('player_guesses')
        .delete()
        .eq('vip_player_id', currentPlayer.id);

      if (deleteVipGuessesError) {
        console.error('Error deleting VIP guesses:', deleteVipGuessesError);
      }

      // Delete player's selections
      const { error: deleteSelectionsError } = await supabase
        .from('player_selections')
        .delete()
        .eq('player_id', currentPlayer.id);

      if (deleteSelectionsError) {
        console.error('Error deleting player selections:', deleteSelectionsError);
      }

      // Finally delete the player record
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', currentPlayer.id);

      if (error) throw error;

      toast({
        title: t('gameRoom.leftTheRoom', { ns: 'organization' }),
        description: t('gameRoom.youHaveLeft', { ns: 'organization' }),
      });
      navigate(`/org/${slug}/play`);
    } catch (error: any) {
      console.error('Error leaving room:', error);
      // Always navigate away to ensure smooth leave
      toast({
        title: t('gameRoom.leftTheRoom', { ns: 'organization' }),
        description: t('gameRoom.youHaveLeft', { ns: 'organization' }),
      });
      navigate(`/org/${slug}/play`);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: organization?.font_family }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('gameRoom.loadingGame', { ns: 'organization' })}</p>
        </div>
      </div>
    );
  }

  if (isHostMigrating) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">{t('gameRoom.hostMigrating', { ns: 'organization' })}</p>
        </div>
      </div>
    );
  }

  // Waiting lobby
  if (!gameRoom || gameRoom.game_phase === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: organization?.font_family }}>
        {organization && <OrganizationHeader organization={organization} />}
        <main className="flex-1 container mx-auto px-4 pt-24 md:pt-32 pb-12 md:pb-20">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('gameRoom.shareCodeWithFriends', { ns: 'organization' })}
                  </p>
                  <div
                    className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 max-w-full"
                    style={{
                      backgroundColor: `${organization?.primary_color}15`,
                      borderColor: organization?.primary_color
                    }}
                  >
                    <span
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide sm:tracking-wider break-all"
                      style={{ color: organization?.primary_color }}
                    >
                      {roomCode}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyRoomCode}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQRCode(true)}
                        className="shrink-0"
                      >
                        <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl mb-2">{t('gameRoom.waitingForPlayers', { ns: 'organization' })}</CardTitle>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t('gameRoom.minimumPlayers', { ns: 'organization' })}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5" style={{ color: organization?.primary_color }} />
                    <h3 className="text-xl font-bold">{t('gameRoom.playersCount', { ns: 'organization' })} ({players.length}/6)</h3>
                  </div>
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: organization?.primary_color }}
                        >
                          {player.isAi ? (
                            <Bot className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-white font-bold">{player.name[0]}</span>
                          )}
                        </div>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.isHost && (
                          <Badge variant="secondary">{t('gameRoom.host', { ns: 'organization' })}</Badge>
                        )}
                        {player.isAi && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            {t('gameRoom.ai', { ns: 'organization' })}
                          </Badge>
                        )}
                        {currentPlayer?.isHost && player.isAi && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAiPlayer(player.id, player.name)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {currentPlayer?.isHost && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={addAiPlayer}
                      disabled={players.length >= 6 || players.filter(p => p.isAi).length >= 5 || isAddingAI}
                    >
                      <Bot className="w-5 h-5" />
                      {isAddingAI ? t('gameRoom.adding', { ns: 'organization' }) : t('gameRoom.addAiPlayer', { ns: 'organization' })}
                    </Button>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={startGame}
                      disabled={players.length < 2}
                      style={{ backgroundColor: organization?.primary_color }}
                    >
                      <Play className="w-5 h-5" />
                      {t('gameRoom.startGame', { ns: 'organization' })}
                    </Button>
                  </div>
                )}

                {!currentPlayer?.isHost && (
                  <div className="space-y-3">
                    <div className="text-center text-muted-foreground">
                      {t('gameRoom.waitingForHost', { ns: 'organization' })}
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-destructive hover:bg-destructive/10"
                      onClick={leaveRoom}
                    >
                      <LogOut className="w-5 h-5" />
                      {t('gameRoom.leaveRoom', { ns: 'organization' })}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">{t('gameRoom.scanToJoin', { ns: 'organization' })}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={getJoinUrl()} size={256} level="H" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('gameRoom.scanQrCode', { ns: 'organization' })}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                {t('gameRoom.roomCode', { ns: 'organization' })} <span className="font-semibold">{roomCode}</span>
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {organization && <OrganizationFooter primaryColor={organization.primary_color} />}
      </div>
    );
  }

  // Topic Selection Phase
  if (gameRoom.game_phase === 'topic_selection') {
    return (
      <TopicSelectionPhase
        roomId={roomId!}
        currentPlayer={currentPlayer}
        players={players}
        currentRound={gameRoom.current_round}
        isHost={currentPlayer?.isHost || false}
        organization={organization}
        fontFamily={organization?.font_family}
        navigate={navigate}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  // Guessing Phase
  if (gameRoom.game_phase === 'guessing') {
    const vipPlayer = players.find(p => p.id === gameRoom.current_vip_id);

    return (
      <GuessingPhase
        roomId={roomId!}
        currentPlayer={currentPlayer}
        vipPlayer={vipPlayer ?? null}
        players={players}
        currentRound={gameRoom.current_round}
        isHost={currentPlayer?.isHost || false}
        organization={organization}
        fontFamily={organization?.font_family}
        navigate={navigate}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  // Scoring Phase
  if (gameRoom.game_phase === 'scoring') {
    return (
      <ScoringPhase
        roomId={roomId!}
        gameRoom={gameRoom}
        players={players}
        isHost={currentPlayer?.isHost || false}
        organization={organization}
        currentPlayer={currentPlayer}
        fontFamily={organization?.font_family}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  // Game finished
  if (gameRoom.game_phase === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="min-h-screen flex flex-col" style={{ fontFamily: organization?.font_family }}>
        {organization && <OrganizationHeader organization={organization} />}
        <main className="flex-1 container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-2" style={{ borderColor: organization?.primary_color }}>
              <CardHeader>
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: organization?.primary_color }}
                >
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-4xl mb-4">{t('gameRoom.gameOver', { ns: 'organization' })}</CardTitle>
                <CardDescription className="text-xl">
                  <span className="text-2xl font-bold" style={{ color: organization?.primary_color }}>
                    {winner.name}
                  </span>
                  <br />
                  {t('gameRoom.winsWithPoints', { ns: 'organization', score: winner.score })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold mb-4">{t('gameRoom.finalScores', { ns: 'organization' })}</h3>
                  {sortedPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-muted-foreground w-8 font-bold">
                          {idx + 1}.
                        </span>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="text-xl font-bold" style={{ color: organization?.primary_color }}>
                        {t('gameRoom.points', { ns: 'organization', score: player.score })}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate(`/org/${slug}/play`)}
                  style={{ backgroundColor: organization?.primary_color }}
                >
                  {t('gameRoom.backToLobby', { ns: 'organization' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        {organization && <OrganizationFooter primaryColor={organization.primary_color} />}
      </div>
    );
  }

  return null;
};

export default OrganizationGameRoom;
