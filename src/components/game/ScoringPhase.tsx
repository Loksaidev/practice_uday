import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, ArrowRight, Image as ImageIcon, ChevronDown, ChevronUp, XCircle, LogOut } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { tOrg } from "@/utils/translation";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import Header from "@/components/Header";
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
}
interface GuessResult {
  player_name: string;
  score: number;
  guessed_order: string[];
  isVip?: boolean;
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
interface Props {
  roomId: string;
  gameRoom: GameRoom;
  players: Player[];
  isHost: boolean;
  organization?: Organization | null;
  currentPlayer?: Player | null;
  onLeaveRoom: () => Promise<void>;
}
export function ScoringPhase({
  roomId,
  gameRoom,
  players,
  isHost,
  organization,
  currentPlayer,
  onLeaveRoom,
  fontFamily
}: Props & { fontFamily?: string }) {
  const { t } = useTranslation();
  const {
    toast
  } = useToast();
  const [roundResults, setRoundResults] = useState<GuessResult[]>([]);
  const [vipSelection, setVipSelection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>(players);
  const [allVIPsDone, setAllVIPsDone] = useState(false);
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  const isTransitioningRef = useRef(false); // Lock to prevent multiple phase transitions
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  useEffect(() => {
    loadRoundResults();
    loadCurrentPlayers();
    checkAllVIPsDone();

    // Set up real-time subscription for player score updates
    const playersChannel = supabase
      .channel(`players-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log('Player scores updated, reloading standings');
          loadCurrentPlayers();
        }
      )
      .subscribe();

    // Set up real-time subscription for player deletions (when someone leaves)
    const playersDeleteChannel = supabase
      .channel(`players-delete-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Player left the game:', payload.old);
          const leftPlayer = payload.old as any;
          const playerName = leftPlayer.name || "A player";
          const playerScore = leftPlayer.score || 0;
          toast({
            title: t('scoringPhase.playerLeft', 'Player Left'),
            description: t('scoringPhase.playerLeftMessage', { name: playerName, score: playerScore, defaultValue: `${playerName} has left the game with ${playerScore} points. The game continues with remaining players.` }),
            variant: "default"
          });
          loadCurrentPlayers();
        }
      )
      .subscribe();

    // Set up real-time subscription for new guesses
    const guessesChannel = supabase
      .channel(`guesses-${roomId}-${gameRoom.current_round}-${gameRoom.current_vip_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_guesses',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log('New guess submitted, reloading round results');
          loadRoundResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(playersDeleteChannel);
      supabase.removeChannel(guessesChannel);
    };
  }, [roomId]);

  const loadCurrentPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false });

    if (error) {
      console.error('Error loading players:', error);
      return;
    }

    const playersList = data.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isHost: p.is_host,
      isAi: p.is_ai || false
    }));

    setCurrentPlayers(playersList);
  };

  const checkAllVIPsDone = async () => {
    // Check who has already been VIP this round
    const { data: previousVIPs } = await supabase
      .from('player_guesses')
      .select('vip_player_id')
      .eq('room_id', roomId)
      .eq('round', gameRoom.current_round);

    const vipIds = previousVIPs?.map(g => g.vip_player_id) || [];
    vipIds.push(gameRoom.current_vip_id!);
    const uniqueVipIds = [...new Set(vipIds)];

    // All VIPs are done if unique VIP count equals player count
    setAllVIPsDone(uniqueVipIds.length >= players.length);
  };
  const loadRoundResults = async () => {
    try {
      // Load VIP's selection
      const {
        data: vipData,
        error: vipError
      } = await supabase.from('player_selections').select('*').eq('player_id', gameRoom.current_vip_id).eq('room_id', roomId).eq('round', gameRoom.current_round).maybeSingle();
      if (vipError) throw vipError;

      // Fetch topic name from either topics or custom_topics
      let topicName = "Unknown Topic";
      if (vipData) {
        const { data: knowsyTopic } = await supabase
          .from('topics')
          .select('name')
          .eq('id', vipData.topic_id)
          .maybeSingle();

        if (knowsyTopic) {
          topicName = knowsyTopic.name;
        } else {
          const { data: customTopic } = await supabase
            .from('custom_topics')
            .select('name')
            .eq('id', vipData.topic_id)
            .maybeSingle();

          if (customTopic) {
            topicName = customTopic.name;
          }
        }
      }

      // Load items for VIP's selection
      const orderedItems = vipData.ordered_items as any[];

      // Process ordered items to get full item details (similar to GuessingPhase)
      const customItems: any[] = [];
      const dbItemIds: string[] = [];
      const customDbItemIds: string[] = [];

      orderedItems.forEach(item => {
        if (typeof item === 'string') {
          // Old format - just IDs
          dbItemIds.push(item);
        } else if (item.isCustom) {
          // Custom item - check if it has a real DB ID or is a text-only custom item
          if (item.id.startsWith('custom-')) {
            // Text-only custom item (no DB record)
            customItems.push({
              id: item.id,
              name: item.name,
              image_url: item.image_url || null
            });
          } else {
            // Custom item with DB record in custom_topic_items
            customDbItemIds.push(item.id);
          }
        } else {
          // Database item from topic_items
          dbItemIds.push(item.id);
        }
      });

      // Load database items (Knowsy topics)
      let dbItems: any[] = [];
      if (dbItemIds.length > 0) {
        const { data: items } = await supabase
          .from('topic_items')
          .select('*')
          .in('id', dbItemIds);

        dbItems = items || [];
      }

      // Load custom database items (organization custom topics)
      let customDbItems: any[] = [];
      if (customDbItemIds.length > 0) {
        const { data: items } = await supabase
          .from('custom_topic_items')
          .select('id, name, image_url')
          .in('id', customDbItemIds);

        customDbItems = items?.map(item => ({
          id: item.id,
          name: item.name,
          image_url: item.image_url
        })) || [];
      }

      // Combine all items in the correct order
      const allItems: any[] = [];
      orderedItems.forEach(item => {
        if (typeof item === 'string') {
          // Old format - find by ID
          const found = dbItems.find(dbItem => dbItem.id === item);
          if (found) allItems.push(found);
        } else if (item.isCustom) {
          if (item.id.startsWith('custom-')) {
            // Text-only custom item
            const found = customItems.find(c => c.id === item.id);
            if (found) allItems.push(found);
          } else {
            // Custom DB item
            const found = customDbItems.find(c => c.id === item.id);
            if (found) allItems.push(found);
          }
        } else {
          // Database item
          const found = dbItems.find(dbItem => dbItem.id === item.id);
          if (found) allItems.push(found);
        }
      });

      setVipSelection({
        ...vipData,
        items: allItems,
        topicName: topicName
      });

      // Load all guesses for this round
      const {
        data: guesses,
        error: guessError
      } = await supabase.from('player_guesses').select(`
          *,
          players!player_guesses_player_id_fkey (name)
        `).eq('room_id', roomId).eq('round', gameRoom.current_round).eq('vip_player_id', gameRoom.current_vip_id).order('score', {
        ascending: false
      });
      if (guessError) {
        console.error('Error loading guesses:', guessError);
        throw guessError;
      }
      const results = guesses.map(g => ({
        player_name: (g.players as any).name,
        score: g.score,
        guessed_order: g.guessed_order as string[],
        isVip: false
      }));

      // Add the VIP to results with 0 points
      const vipPlayerData = players.find(p => p.id === gameRoom.current_vip_id);
      if (vipPlayerData) {
        results.push({
          player_name: vipPlayerData.name,
          score: 0,
          guessed_order: [],
          isVip: true
        });
      }

      setRoundResults(results);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: t('scoringPhase.errorLoadingResults'),
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const handleNextVIP = useCallback(async () => {
    // Prevent multiple concurrent phase transitions
    if (isTransitioningRef.current) {
      console.log('Phase transition already in progress, skipping...');
      return;
    }

    isTransitioningRef.current = true;

    console.log('Next VIP button clicked!');
    console.log('Current game state:', {
      vipsCompleted: gameRoom.vips_completed,
      currentRound: gameRoom.current_round,
      totalRounds: gameRoom.total_rounds,
      currentVipId: gameRoom.current_vip_id
    });

    try {
      // Fetch fresh player data from database
      const { data: freshPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) throw playersError;

      console.log('Fresh players loaded:', freshPlayers.length);

      const allPlayers = freshPlayers.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isHost: p.is_host,
        isAi: p.is_ai || false
      }));

      // Check who has already been VIP this round by looking at actual history
      const { data: previousVIPs, error: vipsError } = await supabase
        .from('player_guesses')
        .select('vip_player_id')
        .eq('room_id', roomId)
        .eq('round', gameRoom.current_round);

      if (vipsError) {
        console.error('Error fetching previous VIPs:', vipsError);
        throw vipsError;
      }

      const vipIds = previousVIPs?.map(g => g.vip_player_id) || [];
      vipIds.push(gameRoom.current_vip_id!); // Add current VIP
      const uniqueVipIds = [...new Set(vipIds)]; // Remove duplicates

      console.log('Unique VIPs this round:', uniqueVipIds.length, 'out of', allPlayers.length);
      console.log('All players:', allPlayers.map(p => ({ id: p.id, name: p.name })));
      console.log('Players who have been VIP:', uniqueVipIds);

      const vipsCompleted = uniqueVipIds.length;

      // Check if all players have been VIP by comparing actual history
      if (vipsCompleted >= allPlayers.length) {
        console.log('All players have been VIP this round');
        // Check if we should start a new round or end the game
        if (gameRoom.current_round >= gameRoom.total_rounds) {
          // Game over
          console.log('Game over! Transitioning to finished phase');

          // Get the winner (player with highest score)
          const sortedPlayers = [...allPlayers].sort((a, b) => b.score - a.score);
          const winner = sortedPlayers[0];

          // Get game room details for history
          const { data: roomData } = await supabase
            .from('game_rooms')
            .select('join_code, host_name, created_at')
            .eq('id', roomId)
            .maybeSingle();

          // Save game to history
          if (roomData) {
            await supabase.from('game_history').insert({
              join_code: roomData.join_code,
              host_name: roomData.host_name,
              winner_name: winner.name,
              total_rounds: gameRoom.total_rounds,
              started_at: roomData.created_at,
              finished_at: new Date().toISOString()
            });
          }

          const { error: updateError } = await supabase.from('game_rooms').update({
            game_phase: 'finished'
          }).eq('id', roomId);

          if (updateError) {
            console.error('Error updating game phase to finished:', updateError);
            throw updateError;
          }

          toast({
            title: t('scoringPhase.gameComplete'),
            description: t('scoringPhase.checkFinalScores')
          });
        } else {
          // Start new round
          console.log('Starting new round:', gameRoom.current_round + 1);
          const { error: updateError } = await supabase.from('game_rooms').update({
            game_phase: 'topic_selection',
            current_round: gameRoom.current_round + 1,
            current_vip_id: null,
            vips_completed: 0
          }).eq('id', roomId);

          if (updateError) {
            console.error('Error starting new round:', updateError);
            throw updateError;
          }

          toast({
            title: tOrg('org.scoringPhase.newRoundStarting', 'New round starting', organization?.id, organization?.slug),
            description: tOrg('org.scoringPhase.roundBegins', 'Round {{round}} begins now', organization?.id, organization?.slug).replace('{{round}}', (gameRoom.current_round + 1).toString())
          });
        }
      } else {
        // Select next VIP (someone who hasn't been VIP yet this round)
        console.log('Selecting next VIP...');

        const nextVIP = allPlayers.find(p => !uniqueVipIds.includes(p.id));
        console.log('Next VIP found:', nextVIP);

        if (nextVIP) {
          console.log('Updating game room with next VIP:', nextVIP.name);
          const { error: updateError } = await supabase.from('game_rooms').update({
            game_phase: 'guessing',
            current_vip_id: nextVIP.id,
            vips_completed: vipsCompleted
          }).eq('id', roomId);

          if (updateError) {
            console.error('Error updating game room:', updateError);
            throw updateError;
          }

          console.log('Successfully transitioned to guessing phase');
          toast({
            title: tOrg('org.scoringPhase.nextVipSelected', 'Next VIP selected', organization?.id, organization?.slug),
            description: tOrg('org.scoringPhase.isNowVip', '{{name}} is now VIP', organization?.id, organization?.slug).replace('{{name}}', nextVIP.name)
          });
        } else {
          console.error('No next VIP found!');
          throw new Error('Could not find next VIP');
        }
      }
    } catch (error: any) {
      toast({
        title: t('scoringPhase.errorProgressingGame'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      // Keep lock for a short time to prevent immediate re-triggers
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1000);
    }
  }, [gameRoom, roomId, players, t, toast]);

  const togglePlayerExpanded = (playerName: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerName)) {
        newSet.delete(playerName);
      } else {
        newSet.add(playerName);
      }
      return newSet;
    });
  };

  // Handler for VIP to continue to next round
  const handleContinueGame = useCallback(async () => {
    if (isTransitioningRef.current) {
      console.log('Phase transition already in progress, skipping...');
      return;
    }

    isTransitioningRef.current = true;

    try {
      console.log('VIP continuing to next round');

      // Start new round
      const { error: updateError } = await supabase.from('game_rooms').update({
        game_phase: 'topic_selection',
        current_round: gameRoom.current_round + 1,
        current_vip_id: null,
        vips_completed: 0
      }).eq('id', roomId);

      if (updateError) {
        console.error('Error starting new round:', updateError);
        throw updateError;
      }

      toast({
        title: t('scoringPhase.newRoundStarting'),
        description: t('scoringPhase.roundBegins', { round: gameRoom.current_round + 1 })
      });
    } catch (error: any) {
      toast({
        title: t('scoringPhase.errorProgressingGame'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1000);
    }
  }, [gameRoom, roomId, t, toast]);

  // Handler for VIP to end the game
  const handleEndGame = useCallback(async () => {
    if (isTransitioningRef.current) {
      console.log('Phase transition already in progress, skipping...');
      return;
    }

    isTransitioningRef.current = true;

    try {
      console.log('VIP ending the game');

      // Get fresh player data for game history
      const { data: freshPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('score', { ascending: false });

      const sortedPlayers = freshPlayers || [];
      const winner = sortedPlayers[0];

      // Get game room details for history
      const { data: roomData } = await supabase
        .from('game_rooms')
        .select('join_code, host_name, created_at')
        .eq('id', roomId)
        .maybeSingle();

      // Save game to history
      if (roomData && winner) {
        await supabase.from('game_history').insert({
          join_code: roomData.join_code,
          host_name: roomData.host_name,
          winner_name: winner.name,
          total_rounds: gameRoom.current_round,
          started_at: roomData.created_at,
          finished_at: new Date().toISOString()
        });
      }

      const { error: updateError } = await supabase.from('game_rooms').update({
        game_phase: 'finished'
      }).eq('id', roomId);

      if (updateError) {
        console.error('Error ending game:', updateError);
        throw updateError;
      }

      toast({
        title: t('scoringPhase.gameComplete'),
        description: t('scoringPhase.checkFinalScores')
      });
    } catch (error: any) {
      toast({
        title: t('scoringPhase.errorProgressingGame'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1000);
    }
  }, [gameRoom, roomId, t, toast]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(var(--knowsy-purple)/.1)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--knowsy-blue))] mx-auto mb-4"></div>
        <p className="font-body text-muted-foreground">{t('scoringPhase.loadingResults')}</p>
      </div>
    </div>;
  }

  // Use fresh data from currentPlayers to determine host status (handles host migration)
  const currentPlayerFromList = currentPlayers.find(p => p.id === currentPlayer?.id);
  const isCurrentPlayerHost = currentPlayerFromList?.isHost || isHost;

  const vipPlayer = players.find(p => p.id === gameRoom.current_vip_id);
  return <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-yellow)/.1)] to-[hsl(var(--knowsy-purple)/.1)]" style={{ fontFamily: organization?.font_family || fontFamily }}>
    {organization ? <OrganizationHeader organization={organization} showStoreLinks={false} /> : <Header />}
    <main className="container mx-auto px-4 pt-32 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* VIP's Actual Order */}
        <Card className="border-2 border-[hsl(var(--knowsy-yellow))]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl flex items-center gap-2">
              <Crown className="w-6 h-6 text-[hsl(var(--knowsy-yellow))]" />
              {tOrg('org.scoringPhase.actualOrder', 'Actual Order', organization?.id, organization?.slug)} {vipPlayer?.name}
            </CardTitle>
            <CardDescription className="font-body">
              {t('scoringPhase.topicLabel', { topic: tOrg(`topics.${vipSelection.topic_id}.name`, vipSelection.topicName, organization?.id, organization?.slug) })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vipSelection?.items?.map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="font-heading text-xl text-[hsl(var(--knowsy-yellow))] w-8">
                    {idx + 1}.
                  </span>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={tOrg(`topics.${vipSelection.topic_id}.items.${item.id}`, item.name, organization?.id, organization?.slug)}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <span className="font-body">{tOrg(`topics.${vipSelection.topic_id}.items.${item.id}`, item.name, organization?.id, organization?.slug)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exit Button */}
        <div className="fixed top-16 right-4 z-40">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors w-24 px-1 h-7 text-xs"
            onClick={() => setShowLeaveConfirmation(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {tOrg('org.scoringPhase.exitGame', 'Exit Game', organization?.id, organization?.slug)}
          </Button>
        </div>

        {/* Player Results with Collapsible Guess Lists */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[hsl(var(--knowsy-blue))]" />
              {tOrg('org.scoringPhase.roundResults', 'Round Results', organization?.id, organization?.slug)}
            </CardTitle>
            <CardDescription className="font-body">
              {tOrg('org.scoringPhase.pointsEarned', 'Points earned this round', organization?.id, organization?.slug)} - {tOrg('org.scoringPhase.clickToViewGuess', 'Click on a player to view their guess', organization?.id, organization?.slug)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roundResults.map((result, idx) => {
              const isExpanded = expandedPlayers.has(result.player_name);
              const hasGuess = !result.isVip && result.guessed_order && result.guessed_order.length > 0;

              return (
                <div key={idx} className="rounded-lg overflow-hidden">
                  {/* Player Header Row - Clickable */}
                  <div
                    className={`flex items-center justify-between p-4 bg-muted ${hasGuess ? 'cursor-pointer hover:bg-muted/80 transition-colors' : ''}`}
                    onClick={() => hasGuess && togglePlayerExpanded(result.player_name)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-2xl text-muted-foreground w-8">
                        {idx + 1}.
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-body font-medium">{result.player_name}</span>
                        {result.isVip && (
                          <span className="text-xs bg-[hsl(var(--knowsy-yellow)/.2)] text-[hsl(var(--knowsy-yellow))] px-2 py-1 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {t('scoringPhase.vip')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-xl text-[hsl(var(--knowsy-blue))]">
                        {result.isVip ? t('scoringPhase.zeroPtsVip') : t('scoringPhase.points', { score: result.score })}
                      </span>
                      {hasGuess && (
                        isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>

                  {/* Collapsible Guess List */}
                  {isExpanded && hasGuess && (
                    <div className="bg-muted/50 border-t border-border p-4 space-y-2">
                      <p className="text-sm text-muted-foreground mb-3 font-body">
                        {tOrg('org.scoringPhase.guessedOrder', 'Guessed order:', organization?.id, organization?.slug)} {result.player_name}
                      </p>
                      {result.guessed_order.map((itemId, itemIdx) => {
                        // Find the matching item from VIP selection by ID to get name and image
                        const vipItem = vipSelection?.items?.find((item: any) => item.id === itemId);
                        const itemName = vipItem?.name || itemId;
                        const translatedItemName = tOrg(`topics.${vipSelection.topic_id}.items.${itemId}`, itemName, organization?.id, organization?.slug);

                        // Scoring logic for each guessed item
                        const correctItemId = vipSelection.items[itemIdx].id;
                        const isCorrect = itemId === correctItemId;
                        let scoreDisplay = '';
                        if (isCorrect) {
                          // Bonus scoring: first and last correct guesses get +2
                          if (itemIdx === 0 || itemIdx === 4) {
                            scoreDisplay = '+2';
                          } else {
                            scoreDisplay = '+1';
                          }
                        } else {
                          scoreDisplay = '';
                        }

                        return (
                          <div key={itemIdx} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-heading text-lg text-[hsl(var(--knowsy-blue))] w-6">
                                {itemIdx + 1}.
                              </span>
                              {vipItem?.image_url ? (
                                <img
                                  src={vipItem.image_url}
                                  alt={translatedItemName}
                                  className="w-8 h-8 object-cover rounded shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                                </div>
                              )}
                              <span className="font-body text-sm">{translatedItemName}</span>
                            </div>
                            {scoreDisplay && (
                              <span className={`font-heading text-lg ${isCorrect ? 'text-[hsl(var(--knowsy-blue))]' : 'text-red-500'}`}>
                                {scoreDisplay}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Current Standings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">{tOrg('org.scoringPhase.currentStandings', 'Current Standings', organization?.id, organization?.slug)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentPlayers.map((player, idx) => <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-heading text-lg text-muted-foreground w-6">
                  {idx + 1}.
                </span>
                <span className="font-body">{player.name}</span>
              </div>
              <span className="font-heading text-lg text-[hsl(var(--knowsy-purple))]">
                {player.score} pts
              </span>
            </div>)}
          </CardContent>
        </Card>

        {/* When all VIPs are done, Host gets Continue/End Game buttons */}
        {allVIPsDone && isCurrentPlayerHost && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="hero" size="lg" className="flex-1" onClick={handleContinueGame}>
              {tOrg('org.scoringPhase.continueGame', 'Continue', organization?.id, organization?.slug)}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleEndGame}>
              <XCircle className="w-5 h-5 mr-2" />
              {tOrg('org.scoringPhase.endGame', 'End Game', organization?.id, organization?.slug)}
            </Button>
          </div>
        )}

        {/* When not all VIPs are done, Host gets Next VIP button */}
        {!allVIPsDone && isCurrentPlayerHost && (
          <Button variant="hero" size="lg" className="w-full" onClick={handleNextVIP}>
            {tOrg('org.scoringPhase.nextVip', 'Next VIP', organization?.id, organization?.slug)}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}

        {/* Non-Host players wait */}
        {!isCurrentPlayerHost && (
          <div className="text-center font-body text-muted-foreground">
            {tOrg('org.scoringPhase.waitingForHost', 'Waiting for host to continue...', organization?.id, organization?.slug)}
          </div>
        )}
      </div>
    </main>

    {/* Leave Game Confirmation Dialog */}
    <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tOrg('org.scoringPhase.leaveGameTitle', 'Leave Game', organization?.id, organization?.slug)}</AlertDialogTitle>
          <AlertDialogDescription>
            {tOrg('org.scoringPhase.leaveGameMessage', 'Are you sure you want to leave the game? Other players will be notified and the game will continue with remaining players.', organization?.id, organization?.slug)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tOrg('org.common.cancel', 'Cancel', organization?.id, organization?.slug)}</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              setShowLeaveConfirmation(false);
              await onLeaveRoom();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {tOrg('org.scoringPhase.leaveGame', 'Leave Game', organization?.id, organization?.slug)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}