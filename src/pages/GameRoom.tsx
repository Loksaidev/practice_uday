import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Play, Trophy, Star, Bot, X, Crown, List, Target, QrCode, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { TopicSelectionPhase } from "@/components/game/TopicSelectionPhase";
import { GuessingPhase } from "@/components/game/GuessingPhase";
import { ScoringPhase } from "@/components/game/ScoringPhase";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { QRCodeSVG } from "qrcode.react";

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isAi: boolean;
  left_at?: string;
}

interface GameRoom {
  id: string;
  status: string;
  game_phase: string;
  current_round: number;
  current_vip_id: string | null;
  total_rounds: number;
  vips_completed: number;
}

const GameRoom = () => {
  const { t } = useTranslation();
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAnonymousAuth();

  const playerName = searchParams.get("name") || "Player";
  const isHost = searchParams.get("host") === "true";

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingAI, setIsAddingAI] = useState(false);
  const [isHostMigrating, setIsHostMigrating] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const aiTopicHandledRef = useRef<string | null>(null); // Track AI topic selection for phase/round
  const aiGuessHandledRef = useRef<string | null>(null); // Track AI guessing for phase/vip/round

  const loadPlayers = async (currentRoomId: string) => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', currentRoomId)
      .order('joined_at', { ascending: true });

    if (error) {
      toast({
        title: t('gameRoom.errorLoadingPlayers'),
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
      isAi: p.is_ai || false,
      left_at: (p as any).left_at
    }));

    setPlayers(playersList);

    // If we were migrating host, check if a new one has been assigned
    if (playersList.some(p => p.isHost)) {
      setIsHostMigrating(false);
    }

    // Set current player by user_id (more reliable than name)
    if (user) {
      const current = playersList.find(p =>
        data.find(d => d.id === p.id)?.user_id === user.id
      );
      if (current) {
        setCurrentPlayer(current);
      } else {
        // Fallback: try to find by name if user_id doesn't match
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
      // Room no longer exists, navigate away
      navigate('/play');
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
      // Wait for auth to be ready
      if (authLoading) {
        return;
      }

      if (!user) {
        navigate('/play');
        return;
      }
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('id')
        .ilike('join_code', roomCode)
        .maybeSingle();

      if (roomError || !room) {
        toast({
          title: t('gameRoom.roomNotFound'),
          description: t('gameRoom.roomNotFoundDescription'),
          variant: "destructive"
        });
        navigate('/play');
        return;
      }

      const currentRoomId = room.id;
      setRoomId(currentRoomId);

      await loadPlayers(currentRoomId);
      await loadGameRoom(currentRoomId);

      // Subscribe to player changes with better error handling
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
            console.log('Player joined, reloading players...');
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
            if (oldPlayer) {
              const playerName = oldPlayer.name || "A player";
              const playerScore = oldPlayer.score || 0;
              toast({
                title: `${playerName} has left the game.`,
                description: `${playerName} had ${playerScore} points.`,
              });
            }

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
            console.log('Player left:', payload.old);
            if (payload.old && (payload.old as Player).isHost) {
              console.log('Host has left the game, migrating to a new host...');
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
                  title: "Game Ended",
                  description: "Not enough players to continue.",
                  variant: "destructive"
                });
                navigate('/play');
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
            console.log('Player updated:', payload);
            // Check if someone became the new host
            if (payload.new && payload.old && !payload.old.is_host && payload.new.is_host) {
              const newHostName = payload.new.name;
              // Check if current user became the host
              if (user && payload.new.user_id === user.id) {
                toast({
                  title: t('gameRoom.youAreNowHost'),
                  description: t('gameRoom.youAreNowHostDescription'),
                });
              } else {
                toast({
                  title: t('gameRoom.newHostAssigned'),
                  description: t('gameRoom.newHostAssignedDescription', { name: newHostName }),
                });
              }
            }
            loadPlayers(currentRoomId);
          }
        )
        .subscribe((status, err) => {
          console.log('Players channel status:', status, err ? 'Error:' : '', err);
          if (status === 'CHANNEL_ERROR') {
            console.error('Players realtime channel error, will rely on polling');
          }
        });

      // Subscribe to game room changes with better error handling
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
            console.log('Game room updated via realtime:', payload);
            if (payload.new) {
              setGameRoom(payload.new as GameRoom);
            }
            loadGameRoom(currentRoomId);
          }
        )
        .subscribe((status, err) => {
          console.log('Room channel status:', status, err ? 'Error:' : '', err);
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error, reloading room data');
            loadGameRoom(currentRoomId);
          }
        });

      // Polling fallback - check for updates every 2 seconds
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
  }, [roomCode, toast, navigate, user, authLoading]);

  // Handle AI player topic selections when phase changes to topic_selection
  useEffect(() => {
    if (!gameRoom || gameRoom.game_phase !== 'topic_selection') return;

    // Create a unique key for this phase/round combination
    const phaseKey = `topic_selection-${gameRoom.current_round}`;

    // Skip if we've already handled this phase/round
    if (aiTopicHandledRef.current === phaseKey) {
      console.log('AI topic selection already handled for this phase/round, skipping...');
      return;
    }

    const handleAITopicSelection = async () => {
      // Mark as handled before async operations
      aiTopicHandledRef.current = phaseKey;

      const aiPlayers = players.filter(p => p.isAi);

      // Process all AI topic selections in parallel for speed
      await Promise.all(
        aiPlayers.map(async (aiPlayer) => {
          try {
            await supabase.functions.invoke('ai-player-topic-selection', {
              body: {
                playerId: aiPlayer.id,
                roomId: gameRoom.id,
                round: gameRoom.current_round
              }
            });
          } catch (error) {
            console.error('Error handling AI topic selection:', error);
          }
        })
      );
    };

    handleAITopicSelection();
  }, [gameRoom?.game_phase, gameRoom?.current_round, players]);

  // Handle AI player guesses when phase changes to guessing
  useEffect(() => {
    if (!gameRoom || gameRoom.game_phase !== 'guessing' || !gameRoom.current_vip_id) return;

    // Create a unique key for this phase/vip/round combination
    const phaseKey = `guessing-${gameRoom.current_vip_id}-${gameRoom.current_round}`;

    // Skip if we've already handled this phase/vip/round
    if (aiGuessHandledRef.current === phaseKey) {
      console.log('AI guessing already handled for this phase/vip/round, skipping...');
      return;
    }

    const handleAIGuesses = async () => {
      // Mark as handled before async operations
      aiGuessHandledRef.current = phaseKey;

      const aiPlayers = players.filter(p => p.isAi && p.id !== gameRoom.current_vip_id);

      if (aiPlayers.length === 0) return;

      // Process all AI guesses in parallel for speed
      await Promise.all(
        aiPlayers.map(async (aiPlayer) => {
          try {
            await supabase.functions.invoke('ai-player-guess', {
              body: {
                playerId: aiPlayer.id,
                roomId: gameRoom.id,
                round: gameRoom.current_round,
                vipPlayerId: gameRoom.current_vip_id
              }
            });
          } catch (error) {
            console.error('Error handling AI guess:', error);
          }
        })
      );
    };

    handleAIGuesses();
  }, [gameRoom?.game_phase, gameRoom?.current_vip_id, gameRoom?.current_round, players]);

  // Reload players when game finishes to ensure we have latest scores
  useEffect(() => {
    if (gameRoom?.game_phase === 'finished' && roomId) {
      loadPlayers(roomId);
    }
  }, [gameRoom?.game_phase, roomId]);

  const copyRoomCode = () => {
    const joinUrl = `${window.location.origin}/play?code=${roomCode}`;
    navigator.clipboard.writeText(joinUrl);
    toast({
      title: t('gameRoom.joinLinkCopied'),
      description: t('gameRoom.shareLinkDescription'),
    });
  };

  const getJoinUrl = () => {
    return `${window.location.origin}/play?code=${roomCode}`;
  };

  const startGame = async () => {
    if (!roomId || !roomCode) return;

    try {
      // Reset all player scores to 0 for the new game
      const { error: scoreResetError } = await supabase
        .from('players')
        .update({ score: 0 })
        .eq('room_id', roomId);

      if (scoreResetError) throw scoreResetError;

      // Update game room status
      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: 'playing',
          game_phase: 'topic_selection',
          current_round: 1
        })
        .eq('id', roomId);

      if (error) throw error;

      // Immediately reload the game room to update UI
      await loadGameRoom(roomId);

      toast({
        title: t('gameRoom.gameStarted'),
        description: t('gameRoom.gameStartedDescription')
      });
    } catch (error: any) {
      toast({
        title: t('gameRoom.errorStartingGame'),
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
        title: t('gameRoom.aiPlayerAdded'),
        description: t('gameRoom.aiPlayerJoined', { name: aiName }),
      });
    } catch (error: any) {
      toast({
        title: t('gameRoom.errorAddingAiPlayer'),
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
        title: t('gameRoom.aiPlayerRemoved'),
        description: t('gameRoom.aiPlayerLeft', { name: playerName }),
      });
    } catch (error: any) {
      toast({
        title: t('gameRoom.errorRemovingAiPlayer'),
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
          // Continue with leaving even if reassignment fails
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

      if (error) {
        console.error('Error deleting player record:', error);
        // Continue with leaving even if delete fails
      }

      toast({
        title: t('gameRoom.leftRoom'),
        description: t('gameRoom.leftRoomDescription'),
      });
      navigate('/play');
    } catch (error: any) {
      console.error('Error leaving room:', error);
      // Always navigate away to ensure smooth leave
      toast({
        title: t('gameRoom.leftRoom'),
        description: t('gameRoom.leftRoomDescription'),
      });
      navigate('/play');
    }
  };

  const handleLeaveClick = () => {
    setShowLeaveConfirmation(true);
  };

  const confirmLeaveRoom = async () => {
    setShowLeaveConfirmation(false);
    await leaveRoom();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(var(--knowsy-purple)/.1)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--knowsy-blue))] mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">{t('gameRoom.loadingGame')}</p>
        </div>
      </div>
    );
  }

  if (isHostMigrating) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--knowsy-blue))] mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">Host is migrating...</p>
        </div>
      </div>
    );
  }


  // Waiting lobby
  if (!gameRoom || gameRoom.game_phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(var(--knowsy-purple)/.1)]">
        <Header />
        {!loading && !isHostMigrating && gameRoom && (
          <div className="fixed top-20 right-4 z-40">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors w-24 px-1 h-7 text-xs"
              onClick={handleLeaveClick}
            >
              <LogOut className="w-8 h-4 mr-1" />
              Exit Game
            </Button>
          </div>
        )}
        <main className="container mx-auto px-4 pt-24 md:pt-32 pb-12 md:pb-20">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center space-y-6">
                <div>
                  <p className="font-body text-sm text-muted-foreground mb-3">
                    {t('gameRoom.shareCodeDescription')}
                  </p>
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)] px-3 sm:px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-[hsl(var(--knowsy-blue))] max-w-full">
                    <span className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-wide sm:tracking-wider bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent break-all">
                      {roomCode}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyRoomCode}
                        className="hover:bg-[hsl(var(--knowsy-blue)/.2)]"
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQRCode(true)}
                        className="hover:bg-[hsl(var(--knowsy-blue)/.2)]"
                      >
                        <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <CardTitle className="font-heading text-2xl sm:text-3xl mb-2">{t('gameRoom.waitingForPlayers')}</CardTitle>
                  <p className="font-body text-sm sm:text-base text-muted-foreground">
                    {t('gameRoom.minimumPlayersRequired')}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-[hsl(var(--knowsy-blue))]" />
                    <h3 className="font-heading text-xl">{t('gameRoom.players', { count: players.length })}</h3>
                  </div>
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center">
                          {player.isAi ? (
                            <Bot className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-white font-heading">{player.name[0]}</span>
                          )}
                        </div>
                        <span className="font-body font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {player.isHost && (
                          <Badge variant="secondary" className="font-body">{t('gameRoom.host')}</Badge>
                        )}
                        {player.isAi && (
                          <Badge variant="outline" className="font-body flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            {t('gameRoom.ai')}
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

                {currentPlayer?.isHost ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={addAiPlayer}
                      disabled={players.length >= 6 || players.filter(p => p.isAi).length >= 5 || isAddingAI}
                    >
                      <Bot className="w-5 h-5" />
                      {isAddingAI ? t('gameRoom.addingAi') : t('gameRoom.addAiPlayer')}
                    </Button>
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={startGame}
                      disabled={players.length < 2}
                    >
                      <Play className="w-5 h-5" />
                      {t('gameRoom.startGame')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center font-body text-muted-foreground">
                      {t('gameRoom.waitingForHost')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-center">{t('gameRoom.scanToJoin')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={getJoinUrl()} size={256} level="H" />
              </div>
              <p className="font-body text-sm text-muted-foreground text-center">
                {t('gameRoom.scanQrDescription')}
              </p>
              <p className="font-body text-xs text-muted-foreground text-center max-w-xs">
                {t('gameRoom.roomCodeLabel')} <span className="font-semibold">{roomCode}</span>
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('gameRoom.confirmLeaveTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('gameRoom.confirmLeaveDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('gameRoom.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLeaveRoom} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('gameRoom.leave')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
        currentPlayer={currentPlayer}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  // Game finished
  if (gameRoom.game_phase === 'finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-yellow)/.1)] to-[hsl(var(--knowsy-purple)/.1)]">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-2 border-[hsl(var(--knowsy-yellow))]">
              <CardHeader>
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="font-heading text-4xl mb-4">{t('gameRoom.gameOver')}</CardTitle>
                <CardDescription className="text-xl">
                  <span className="font-heading text-[hsl(var(--knowsy-blue))] text-2xl">{winner.name}</span>
                  <br />
                  {t('gameRoom.winsWithPoints', { score: winner.score })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-heading text-xl mb-4">{t('gameRoom.finalScores')}</h3>
                  {sortedPlayers.map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-2xl text-muted-foreground w-8">
                          {idx + 1}.
                        </span>
                        <span className="font-body font-medium">{player.name}</span>
                      </div>
                      <span className="font-heading text-xl text-[hsl(var(--knowsy-blue))]">
                        {player.score} {t('gameRoom.pointsAbbrev')}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/play')}
                >
                  {t('gameRoom.backToLobby')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default GameRoom;
