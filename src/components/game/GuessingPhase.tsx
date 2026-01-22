import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { NavigateFunction } from "react-router-dom";
import { loadOrgTranslations } from "@/i18n/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Target, Check, GripVertical, Image as ImageIcon, LogOut } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { tOrg } from "@/utils/translation";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import Header from "@/components/Header";
import { PlayerList } from "./PlayerList";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isAi: boolean;
}

interface TopicItem {
  id: string;
  name: string;
  image_url?: string | null;
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
  currentPlayer: Player | null;
  vipPlayer: Player | null;
  players: Player[];
  currentRound: number;
  isHost: boolean;
  organization?: Organization | null;
  navigate: NavigateFunction;
  onLeaveRoom: () => Promise<void>;
}

function SortableItem({ id, name, imageUrl }: { id: string; name: string; imageUrl?: string | null }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 p-4 bg-muted rounded-lg border-2 border-transparent hover:border-[hsl(var(--knowsy-purple))] cursor-move touch-none"
    >
      <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded shrink-0"
        />
      ) : (
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/40" />
        </div>
      )}
      <span className="font-body flex-1">{name}</span>
    </div>
  );
}

export function GuessingPhase({ roomId, currentPlayer, vipPlayer, players, currentRound, isHost, organization, navigate, onLeaveRoom, fontFamily }: Props & { fontFamily?: string }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [vipTopic, setVipTopic] = useState<string>("");
  const [vipTopicId, setVipTopicId] = useState<string>("");
  const [vipItems, setVipItems] = useState<TopicItem[]>([]);
  const [guessedOrder, setGuessedOrder] = useState<TopicItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [playersReady, setPlayersReady] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1:00 in seconds
  const [showWarning, setShowWarning] = useState(false);
  const isTransitioningRef = useRef(false); // Lock to prevent multiple phase transitions
  const hasLoadedVIPSelectionRef = useRef(false); // Lock to prevent reloading VIP selection
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showPlayerLeftDialog, setShowPlayerLeftDialog] = useState(false);
  const [playerLeftMessage, setPlayerLeftMessage] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isVIP = vipPlayer ? currentPlayer?.id === vipPlayer.id : false;
  const translatedVipTopic = tOrg(`topics.${vipTopicId}.name`, vipTopic, organization?.id, organization?.slug);

  useEffect(() => {
    if (organization) {
      loadOrgTranslations(organization.id, organization.slug, i18n.language);
    }
  }, [organization, i18n.language]);


  useEffect(() => {
    if (!currentPlayer || !vipPlayer) return;

    // Only load VIP selection once to prevent resetting user's reordering
    if (!hasLoadedVIPSelectionRef.current) {
      hasLoadedVIPSelectionRef.current = true;
      loadVIPSelection();
    }
    checkGuessStatus();

    const channel = supabase
      .channel(`guesses-${roomId}-${currentRound}-${vipPlayer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_guesses',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          console.log('New guess inserted:', payload);
          await checkGuessStatus();
          await checkIfAllGuessed();
        }
      )
      .subscribe((status) => {
        console.log('Guess channel status:', status);
      });

    // Add polling as a fallback to check guess status every 2 seconds
    const pollInterval = setInterval(async () => {
      await checkGuessStatus();
      await checkIfAllGuessed();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [roomId, currentRound, vipPlayer?.id]);

  // Timer countdown effect (only for non-VIP players)
  useEffect(() => {
    if (hasSubmitted || isVIP) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasSubmitted, isVIP]);

  // Warning effect when time is running low
  useEffect(() => {
    if (hasSubmitted || isVIP) return;

    if (timeRemaining <= 15 && timeRemaining > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [timeRemaining, hasSubmitted, isVIP]);

  // Separate effect to auto-submit when timer reaches 0
  useEffect(() => {
    const autoSubmit = async () => {
      if (timeRemaining === 0 && !hasSubmitted && !submitting && !isVIP) {
        console.log('Guessing timer reached 0, auto-submitting guess');
        await handleSubmitGuess();
      }
    };

    autoSubmit();
  }, [timeRemaining, hasSubmitted, submitting, isVIP]);

  const loadVIPSelection = async () => {
    console.log('Loading VIP selection for:', { vipPlayerId: vipPlayer.id, roomId, currentRound });

    const { data: selection, error } = await supabase
      .from('player_selections')
      .select('*')
      .eq('player_id', vipPlayer.id)
      .eq('room_id', roomId)
      .eq('round', currentRound)
      .maybeSingle();

    console.log('VIP selection loaded:', selection, 'error:', error);

    if (error || !selection) {
      console.error('Error loading VIP selection:', error);
      toast({
        title: t('guessingPhase.errorLoadingVipSelection'),
        description: error?.message || t('guessingPhase.selectionNotFound'),
        variant: "destructive"
      });
      return;
    }

    // Fetch topic name from either topics or custom_topics
    let topicName = "Unknown Topic";
    const { data: knowsyTopic } = await supabase
      .from('topics')
      .select('name')
      .eq('id', selection.topic_id)
      .maybeSingle();

    if (knowsyTopic) {
      topicName = knowsyTopic.name;
    } else {
      const { data: customTopic } = await supabase
        .from('custom_topics')
        .select('name')
        .eq('id', selection.topic_id)
        .maybeSingle();

      if (customTopic) {
        topicName = customTopic.name;
      }
    }

    setVipTopic(topicName);
    setVipTopicId(selection.topic_id);

    // Handle ordered items which can be strings (old format) or objects with id/name/isCustom
    const orderedItems = selection.ordered_items as any[];
    console.log('Ordered items from selection:', orderedItems);

    if (!orderedItems || orderedItems.length === 0) {
      console.error('No item data found in selection');
      toast({
        title: t('guessingPhase.error'),
        description: t('guessingPhase.noItemsFound'),
        variant: "destructive"
      });
      return;
    }

    // Separate custom items from database items
    const customItems: TopicItem[] = [];
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

    console.log('Custom items:', customItems, 'DB item IDs:', dbItemIds, 'Custom DB item IDs:', customDbItemIds);

    // Load database items (Knowsy topics)
    let dbItems: TopicItem[] = [];
    if (dbItemIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('topic_items')
        .select('*')
        .in('id', dbItemIds);

      if (itemsError) {
        console.error('Error loading items:', itemsError);
        toast({
          title: t('guessingPhase.errorLoadingItems'),
          description: itemsError.message,
          variant: "destructive"
        });
        return;
      }

      dbItems = items || [];
    }

    // Load custom database items (organization custom topics)
    let customDbItems: TopicItem[] = [];
    if (customDbItemIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('custom_topic_items')
        .select('id, name, image_url')
        .in('id', customDbItemIds);

      if (itemsError) {
        console.error('Error loading custom items:', itemsError);
        toast({
          title: t('guessingPhase.errorLoadingCustomItems'),
          description: itemsError.message,
          variant: "destructive"
        });
        return;
      }

      customDbItems = items?.map(item => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url
      })) || [];
    }

    // Combine all items
    const allItems = [...customItems, ...dbItems, ...customDbItems];
    console.log('All items combined:', allItems);

    if (allItems.length === 0) {
      toast({
        title: t('guessingPhase.error'),
        description: t('guessingPhase.noItemsFound'),
        variant: "destructive"
      });
      return;
    }

    // Set items in VIP's order for non-VIP players
    console.log('Setting items in order:', allItems);
    setVipItems(allItems);
    setGuessedOrder(allItems);
  };

  const checkGuessStatus = async () => {
    const { data, error } = await supabase
      .from('player_guesses')
      .select('player_id, players!player_guesses_player_id_fkey(name)')
      .eq('room_id', roomId)
      .eq('round', currentRound)
      .eq('vip_player_id', vipPlayer.id);

    console.log('Checking guess status:', data, error);

    if (data) {
      const ready = data.map(g => (g.players as any).name);
      setPlayersReady(ready);

      const hasPlayerGuessed = data.some(g => g.player_id === currentPlayer.id);
      setHasSubmitted(hasPlayerGuessed);

      // Check if all players have guessed
      await checkIfAllGuessed();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setGuessedOrder((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };




  const handleSubmitGuess = async () => {
    // Safety check: VIP should never be able to guess
    if (currentPlayer.id === vipPlayer.id) {
      toast({
        title: tOrg('org.guessingPhase.cannotSubmitGuess', 'Cannot Submit Guess', organization?.id, organization?.slug),
        description: tOrg('org.guessingPhase.vipCannotGuess', 'VIP cannot guess', organization?.id, organization?.slug),
        variant: "destructive"
      });
      return;
    }

    if (guessedOrder.length !== 5) {
      toast({
        title: t('guessingPhase.incompleteGuess'),
        description: t('guessingPhase.orderAllItems'),
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get VIP's actual order
      const { data: vipSelection } = await supabase
        .from('player_selections')
        .select('ordered_items')
        .eq('player_id', vipPlayer.id)
        .eq('room_id', roomId)
        .eq('round', currentRound)
        .maybeSingle();

      if (!vipSelection) throw new Error("VIP selection not found");

      // Extract IDs from ordered_items (could be objects or strings)
      const orderedItems = vipSelection.ordered_items as any[];
      const vipOrder = orderedItems.map(item => typeof item === 'string' ? item : item.id);
      const playerGuess = guessedOrder.map(i => i.id);

      // Calculate score based on new scoring mechanism
      let score = 0;
      let correctCount = 0;

      for (let i = 0; i < 5; i++) {
        if (vipOrder[i] === playerGuess[i]) {
          correctCount++;
          if (i === 0) {
            score += 2; // Favorite (1st position)
          } else if (i === 4) {
            score += 2; // Least favorite (5th position)
          } else {
            score += 1; // 2nd, 3rd, 4th positions
          }
        }
      }

      // Bonus for all correct
      if (correctCount === 5) {
        score += 3;
      }

      // Penalty for none correct
      if (correctCount === 0) {
        score -= 1;
      }

      const { error } = await supabase
        .from('player_guesses')
        .insert({
          player_id: currentPlayer.id,
          room_id: roomId,
          round: currentRound,
          vip_player_id: vipPlayer.id,
          guessed_order: playerGuess,
          score: score
        });

      if (error) throw error;

      // Update player score - fetch current score first to avoid stale data
      const { data: playerData } = await supabase
        .from('players')
        .select('score')
        .eq('id', currentPlayer.id)
        .maybeSingle();

      const currentScore = playerData?.score || 0;

      await supabase
        .from('players')
        .update({ score: currentScore + score })
        .eq('id', currentPlayer.id);

      setHasSubmitted(true);
      toast({
        title: tOrg('org.guessingPhase.guessSubmitted', 'Guess submitted', organization?.id, organization?.slug),
        description: tOrg('org.guessingPhase.earnedPoints', 'Earned points: {{score}}', organization?.id, organization?.slug).replace('{{score}}', score.toString()),
      });

      // Trigger check after submission
      await checkIfAllGuessed();
    } catch (error: any) {
      toast({
        title: tOrg('org.guessingPhase.errorSubmittingGuess', 'Error submitting guess', organization?.id, organization?.slug),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const checkIfAllGuessed = useCallback(async () => {
    // Prevent multiple concurrent phase transitions
    if (isTransitioningRef.current) {
      console.log('Phase transition already in progress, skipping...');
      return;
    }

    // Fetch current players (may have changed due to kicks)
    const { data: currentPlayers, error: playersError } = await supabase
      .from('players')
      .select('id')
      .eq('room_id', roomId);

    if (playersError || !currentPlayers) {
      console.error('Error fetching current players:', playersError);
      return;
    }

    const playerCount = currentPlayers.length;

    // If only 1 or fewer players, end the game
    if (playerCount <= 1) {
      console.log('Not enough players remaining, ending game early');
      if (isHost) {
        await supabase.rpc('end_game_early', { p_room_id: roomId });
      }
      return;
    }

    const guessingPlayers = currentPlayers.filter(p => p.id !== vipPlayer.id);
    const { count, error } = await supabase
      .from('player_guesses')
      .select('player_id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('round', currentRound)
      .eq('vip_player_id', vipPlayer.id);

    console.log(`Guess check: ${count} of ${guessingPlayers.length} players guessed, isHost: ${isHost}`, error);

    if (count !== null && guessingPlayers.length > 0 && count >= guessingPlayers.length) {
      console.log('All players have guessed!');
      if (isHost) {
        // Set lock before transitioning
        isTransitioningRef.current = true;

        try {
          // Double-check the current game phase to avoid race conditions
          const { data: currentRoom } = await supabase
            .from('game_rooms')
            .select('game_phase')
            .eq('id', roomId)
            .maybeSingle();

          if (currentRoom?.game_phase !== 'guessing') {
            console.log('Game phase already changed, skipping transition to scoring');
            return;
          }

          console.log('Host transitioning to scoring phase');
          // Move to scoring phase
          await supabase
            .from('game_rooms')
            .update({ game_phase: 'scoring' })
            .eq('id', roomId);
        } finally {
          // Keep lock for a short time to prevent immediate re-triggers
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1000);
        }
      } else {
        console.log('Waiting for host to transition to scoring');
      }
    }
  }, [roomId, currentRound, vipPlayer.id, isHost]);

  // Guard against null currentPlayer or vipPlayer
  if (!currentPlayer || !vipPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)]">
        {organization ? <OrganizationHeader organization={organization} showStoreLinks={false} /> : <Header />}
        {/* Exit Button */}
        <div className="fixed top-20 right-4 z-40">
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors w-24 px-1 h-7 text-xs"
            onClick={() => setShowLeaveConfirmation(true)}
          >
            <LogOut className="w-4 h-4 mr-1" />
            {tOrg('org.gameRoom.leaveGame', 'Exit Game', organization?.id, organization?.slug)}
          </Button>
        </div>
        <main className="container mx-auto px-4 pt-32 pb-20">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{t('guessingPhase.loadingGameData')}</p>
            </CardContent>
          </Card>
        </main>
        <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tOrg('org.gameRoom.confirmLeaveTitle', 'Confirm Leave?', organization?.id, organization?.slug)}</AlertDialogTitle>
              <AlertDialogDescription>{tOrg('org.gameRoom.confirmLeaveDescription', 'Are you sure you want to leave the game? You will lose your progress.', organization?.id, organization?.slug)}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tOrg('org.gameRoom.cancel', 'Cancel', organization?.id, organization?.slug)}</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setShowLeaveConfirmation(false); onLeaveRoom(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {tOrg('org.gameRoom.leave', 'Leave', organization?.id, organization?.slug)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (isVIP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-yellow)/.1)] to-[hsl(var(--knowsy-purple)/.1)]" style={{ fontFamily }}>
        {organization ? <OrganizationHeader organization={organization} showStoreLinks={false} /> : <Header />}
        <main className="container mx-auto px-4 pt-32 pb-20">
          {/* Exit Button */}
          <div className="fixed top-20 right-4 z-40">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors w-24 px-1 h-7 text-xs"
              onClick={() => setShowLeaveConfirmation(true)}
            >
              <LogOut className="w-4 h-4 mr-1" />
              {tOrg('org.gameRoom.leaveGame', 'Exit Game', organization?.id, organization?.slug)}
            </Button>
          </div>
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-[hsl(var(--knowsy-yellow))]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-heading text-3xl">{tOrg('org.guessingPhase.youAreVip', 'You are the VIP', organization?.id, organization?.slug)}</CardTitle>
                <CardDescription className="font-body text-lg">
                  {t('guessingPhase.othersGuessing', { topic: translatedVipTopic })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="font-body text-muted-foreground mb-6">
                    {t('guessingPhase.playersGuessed', { ready: playersReady.length, total: players.filter(p => p.id !== vipPlayer.id).length })}
                  </p>

                  <div className="flex justify-center mb-6">
                    <PlayerList
                      players={players}
                      readyPlayers={playersReady}
                      vipPlayerId={vipPlayer.id}
                      currentPlayerId={currentPlayer.id}
                    />
                  </div>

                  <div className="animate-pulse text-4xl">⏳</div>
                  <p className="font-body text-sm text-muted-foreground mt-4">
                    {tOrg('org.guessingPhase.waitingForOthersGuess', 'Waiting for others to guess your preferences...', organization?.id, organization?.slug)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Leave Game Confirmation Dialog */}
        <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('org.gameRoom.confirmLeaveTitle', { defaultValue: 'Confirm Leave?' })}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('org.gameRoom.confirmLeaveDescription', { defaultValue: 'Are you sure you want to leave the game? You will lose your progress.' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('org.gameRoom.cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowLeaveConfirmation(false);
                  onLeaveRoom();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('org.gameRoom.leave', { defaultValue: 'Leave' })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-purple)/.1)] to-[hsl(var(--knowsy-blue)/.1)]" style={{ fontFamily: organization?.font_family || fontFamily }}>
      {organization ? <OrganizationHeader organization={organization} showStoreLinks={false} /> : <Header />}
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          {/* VIP Info */}
          <Card className="mb-6 border-2 border-[hsl(var(--knowsy-yellow))]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg">{tOrg('org.guessingPhase.currentVip', 'Current VIP:', organization?.id, organization?.slug)} {vipPlayer.name}</h3>
                    <p className="font-body text-sm text-muted-foreground">{tOrg('org.guessingPhase.topicLabel', 'Topic:', organization?.id, organization?.slug)} {translatedVipTopic}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-heading text-2xl mb-1 ${timeRemaining <= 20 ? 'text-[hsl(var(--knowsy-red))] animate-pulse' : 'text-[hsl(var(--knowsy-blue))]'}`}>
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {tOrg('org.guessingPhase.guessedCount', '{{ready}} of {{total}} have guessed', organization?.id, organization?.slug).replace('{{ready}}', playersReady.length.toString()).replace('{{total}}', players.filter(p => p.id !== vipPlayer.id).length.toString())}
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t">
                <PlayerList
                  players={players}
                  readyPlayers={playersReady}
                  vipPlayerId={vipPlayer.id}
                  currentPlayerId={currentPlayer.id}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exit Button */}
          <div className="fixed top-20 right-4 z-40">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors w-24 px-1 h-7 text-xs"
              onClick={() => setShowLeaveConfirmation(true)}
            >
              <LogOut className="w-4 h-4 mr-1" />
              {tOrg('org.gameRoom.leaveGame', 'Exit Game', organization?.id, organization?.slug)}
            </Button>
          </div>

          {hasSubmitted ? (
            <Card className="border-2 border-[hsl(var(--knowsy-blue))]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="font-heading text-3xl">{tOrg('org.guessingPhase.guessSubmitted', 'Guess submitted!', organization?.id, organization?.slug)}</CardTitle>
                <CardDescription className="font-body">
                  {tOrg('org.guessingPhase.waitingForOthersSubmit', 'Waiting for other players to submit their guesses...', organization?.id, organization?.slug)}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  {t('guessingPhase.guessOrder', { name: translatedVipTopic })}
                </CardTitle>
                <CardDescription className="font-body">
                  {tOrg('org.guessingPhase.dragToMatch', 'Drag items to match what you think is preference order (Top = Most Liked)', organization?.id, organization?.slug).replace('{{name}}', vipPlayer.name)}
                  <br />
                  <span className="text-xs">{t('guessingPhase.topMostLiked')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {showWarning && (
                  <div className="text-center text-red-500 font-semibold p-2 bg-red-50 rounded-lg border border-red-200">
                    {tOrg('org.guessingPhase.timeRunningOut', 'Time is running out! Please submit your guess.', organization?.id, organization?.slug)}
                  </div>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={guessedOrder.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {guessedOrder.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="font-heading text-xl text-muted-foreground w-8">
                          {idx + 1}.
                        </span>
                        <div className="flex-1">
                          <SortableItem id={item.id} name={tOrg(`topics.${vipTopicId}.items.${item.id}`, item.name, organization?.id, organization?.slug)} imageUrl={item.image_url} />
                        </div>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleSubmitGuess}
                  disabled={submitting}
                >
                  {submitting ? tOrg('org.guessingPhase.submitting', 'Submitting', organization?.id, organization?.slug) : tOrg('org.guessingPhase.submitGuess', 'Submit Guess', organization?.id, organization?.slug)}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tOrg('org.gameRoom.confirmLeaveTitle', 'Confirm Leave?', organization?.id, organization?.slug)}</AlertDialogTitle>
            <AlertDialogDescription>{tOrg('org.gameRoom.confirmLeaveDescription', 'Are you sure you want to leave the game? You will lose your progress.', organization?.id, organization?.slug)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tOrg('org.gameRoom.cancel', 'Cancel', organization?.id, organization?.slug)}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowLeaveConfirmation(false); onLeaveRoom(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {tOrg('org.gameRoom.leave', 'Leave', organization?.id, organization?.slug)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
