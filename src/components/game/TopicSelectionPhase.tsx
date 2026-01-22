import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { NavigateFunction } from "react-router-dom";
import { loadOrgTranslations } from "@/i18n/config";
import { tOrg } from "@/utils/translation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { List, GripVertical, Check, Bot, Plus, Image as ImageIcon, Upload, X } from "lucide-react";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import Header from "@/components/Header";
import { PlayerList } from "./PlayerList";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

interface Topic {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
  organizationName?: string;
}

interface TopicItem {
  id: string;
  name: string;
  topic_id: string;
  image_url?: string | null;
}

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isAi: boolean;
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
  players: Player[];
  currentRound: number;
  isHost: boolean;
  organization?: Organization | null;
  navigate: NavigateFunction;
  onLeaveRoom: () => Promise<void>;
}

function SortableItem({ id, name, imageUrl, isMobile }: { id: string; name: string; imageUrl?: string | null; isMobile?: boolean }) {
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
      className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted rounded-lg border-2 border-transparent hover:border-[hsl(var(--knowsy-blue))] cursor-move ${isMobile ? 'touch-none' : ''}`}
    >
      <GripVertical className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground shrink-0" />
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
      <span className="font-body text-sm sm:text-base flex-1 break-words min-w-0">{name}</span>
    </div>
  );
}

export function TopicSelectionPhase({ roomId, currentPlayer, players, currentRound, isHost, organization, navigate, onLeaveRoom, fontFamily }: Props & { fontFamily?: string }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1280);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Guard against null currentPlayer
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)]">
        {organization ? <OrganizationHeader organization={organization} showStoreLinks={false} /> : <Header />}
        <main className="container mx-auto px-4 pt-32 pb-20">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">{tOrg('org.gameRoom.loadingPlayerData', 'Loading player data...', organization?.id, organization?.slug)}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [availableItems, setAvailableItems] = useState<TopicItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<TopicItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [playersReady, setPlayersReady] = useState<string[]>([]);
  const [customItemInput, setCustomItemInput] = useState("");
  const [customItemImage, setCustomItemImage] = useState<File | null>(null);
  const [customItemImagePreview, setCustomItemImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [useKnowsyTopics, setUseKnowsyTopics] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(150); // 2:30 in seconds
  const itemSelectionRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false); // Lock to prevent multiple VIP selections
  const hasTimedOutRef = useRef(false); // Lock to prevent multiple timeout notifications
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [playerLeftNotification, setPlayerLeftNotification] = useState<{ playerName: string } | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  //const [hasTimedOut, setHasTimedOut] = useState(false);
  //const [reminderShown, setReminderShown] = useState(false);
  //const [timedOutPlayerIds, setTimedOutPlayerIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const initialize = async () => {
      const orgSettings = await loadOrganizationSettings();
      await loadTopics(orgSettings.organizationId, orgSettings.useKnowsyTopics);
      // Load organization-specific translations if applicable
      if (organization) {
        await loadOrgTranslations(organization.id, organization.slug, i18n.language);
      }
      checkSubmissionStatus();
    };

    initialize();

    const channel = supabase
      .channel(`selections-${roomId}-${currentRound}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_selections',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('New selection inserted:', payload);
          checkSubmissionStatus();
        }
      )
      .subscribe((status) => {
        console.log('Selection channel status:', status);
      });

    // Listen for inactivity kick broadcasts to notify other players
    const kickChannel = supabase
      .channel(`inactivity-kick-${roomId}`)
      .on('broadcast', { event: 'player_kicked_inactivity' }, (payload) => {
        const kickedPlayerName = payload.payload?.playerName;
        if (kickedPlayerName && kickedPlayerName !== currentPlayer?.name) {
          toast({
            title: t('topicSelection.playerRemovedInactivity', { name: kickedPlayerName }),
            description: t('topicSelection.playerRemovedInactivityDescription'),
            variant: "default"
          });
        }
      })
      .subscribe();

    // Polling fallback - check selection status every 2 seconds
    const pollInterval = setInterval(() => {
      checkSubmissionStatus();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(kickChannel);
      clearInterval(pollInterval);
    };
  }, [roomId, currentRound, currentPlayer?.name, organization, i18n.language]);

  // Timer countdown effect
  useEffect(() => {
    if (hasSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasSubmitted]);

  // Warning effect when time is running low
  useEffect(() => {
    if (hasSubmitted) return;

    if (timeRemaining <= 30 && timeRemaining > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [timeRemaining, hasSubmitted]);

  // Separate effect to trigger kick when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !hasSubmitted && !submitting) {
      console.log('Timer reached 0, kicking inactive player');
      handleTimeoutKick();
    }
  }, [timeRemaining, hasSubmitted, submitting]);

  const loadOrganizationSettings = async () => {
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('organization_id, organizations(use_knowsy_topics, name)')
      .eq('id', roomId)
      .maybeSingle();

    let orgId = null;
    let useKnowsy = true;

    if (roomData?.organization_id) {
      orgId = roomData.organization_id;
      const orgData = roomData.organizations as any;
      useKnowsy = orgData?.use_knowsy_topics ?? true;

      setOrganizationId(orgId);
      setUseKnowsyTopics(useKnowsy);
    }

    return { organizationId: orgId, useKnowsyTopics: useKnowsy };
  };

  const loadTopics = async (orgId: string | null = organizationId, useKnowsy: boolean = useKnowsyTopics) => {
    let allTopics: Topic[] = [];

    // Load Knowsy topics if enabled or no organization
    if (!orgId || useKnowsy) {
      const { data: knowsyTopics, error: knowsyError } = await supabase
        .from('topics')
        .select('*')
        .order('category', { ascending: true });

      if (knowsyError) {
        toast({
          title: t('topicSelection.errorLoadingKnowsyTopics'),
          description: knowsyError.message,
          variant: "destructive"
        });
      } else if (knowsyTopics) {
        allTopics = [...knowsyTopics.map(t => ({ ...t, isCustom: false }))];
      }
    }

    // Load custom topics if organization exists
    if (orgId) {
      const { data: customTopics, error: customError } = await supabase
        .from('custom_topics')
        .select('*, organizations(name)')
        .eq('organization_id', orgId)
        .order('category', { ascending: true });

      if (customError) {
        toast({
          title: t('topicSelection.errorLoadingCustomTopics'),
          description: customError.message,
          variant: "destructive"
        });
      } else if (customTopics) {
        const customTopicsFormatted = customTopics.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          isCustom: true,
          organizationName: (t.organizations as any)?.name
        }));
        allTopics = [...allTopics, ...customTopicsFormatted];
      }
    }

    setTopics(allTopics);
  };

  const checkSubmissionStatus = async () => {
    const { data } = await supabase
      .from('player_selections')
      .select('player_id, players(name)')
      .eq('room_id', roomId)
      .eq('round', currentRound);

    console.log('Checking submission status:', data);

    if (data) {
      const ready = data.map(s => (s.players as any).name);
      setPlayersReady(ready);

      const hasPlayerSubmitted = data.some(s => s.player_id === currentPlayer.id);
      setHasSubmitted(hasPlayerSubmitted);

      // Check if all players are ready
      await checkIfAllReady();
    }
  };

  const handleTopicSelect = async (topic: Topic) => {
    // Toggle selection on mobile/tablet if clicking the same topic
    if (isSmallScreen && selectedTopic?.id === topic.id) {
      setSelectedTopic(null);
      setAvailableItems([]);
      setSelectedItems([]);
      return;
    }

    setSelectedTopic(topic);

    if (topic.isCustom) {
      // Load custom topic items
      const { data, error } = await supabase
        .from('custom_topic_items')
        .select('id, name, custom_topic_id, image_url')
        .eq('custom_topic_id', topic.id);

      if (error) {
        toast({
          title: "Error loading items",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Format to match TopicItem interface
      const formattedItems = data.map(item => ({
        id: item.id,
        name: item.name,
        topic_id: item.custom_topic_id,
        image_url: item.image_url
      }));

      setAvailableItems(formattedItems);
    } else {
      // Load Knowsy topic items
      const { data, error } = await supabase
        .from('topic_items')
        .select('*')
        .eq('topic_id', topic.id);

      if (error) {
        toast({
          title: t('topicSelection.errorLoadingItems'),
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setAvailableItems(data);
    }

    setSelectedItems([]);

    // Scroll to item selection area on desktop
    if (!isMobile && itemSelectionRef.current) {
      setTimeout(() => {
        itemSelectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  const handleItemToggle = (item: TopicItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 5) {
      setSelectedItems([...selectedItems, item]);
    } else {
      toast({
        title: t('topicSelection.maximumReached'),
        description: t('topicSelection.maxItemsMessage'),
        variant: "destructive"
      });
    }
  };

  const handleCustomItemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomItemImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomItemImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomItemImage = () => {
    setCustomItemImage(null);
    setCustomItemImagePreview(null);
  };

  const handleAddCustomItem = async () => {
    const trimmedInput = customItemInput.trim();

    if (!trimmedInput) {
      toast({
        title: t('topicSelection.emptyInput'),
        description: t('topicSelection.enterItemName'),
        variant: "destructive"
      });
      return;
    }

    if (selectedItems.length >= 5) {
      toast({
        title: t('topicSelection.maximumReached'),
        description: t('topicSelection.maxItemsMessage'),
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    let imageUrl: string | null = null;

    try {
      // Upload image if provided
      if (customItemImage) {
        const fileExt = customItemImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `game-custom-items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('topic-images')
          .upload(filePath, customItemImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('topic-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Create a custom item with a unique ID
      const customItem: TopicItem = {
        id: `custom-${Date.now()}-${Math.random()}`,
        name: trimmedInput,
        topic_id: selectedTopic?.id || '',
        image_url: imageUrl
      };

      setSelectedItems([...selectedItems, customItem]);
      setCustomItemInput("");
      setCustomItemImage(null);
      setCustomItemImagePreview(null);

      toast({
        title: t('topicSelection.customItemAdded'),
        description: t('topicSelection.customItemAddedDescription', { name: trimmedInput }),
      });
    } catch (error: any) {
      toast({
        title: t('topicSelection.errorUploadingImage'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleTimeoutKick = async () => {
    if (hasSubmitted || submitting || hasTimedOutRef.current) {
      console.log('Timeout kick cancelled: already submitted, submitting, or already timed out');
      return;
    }

    console.log('Kicking player due to timeout - no topic selection');
    hasTimedOutRef.current = true; // Ensure lock is set
    setSubmitting(true);

    try {
      // Broadcast to other players that this player is being kicked due to inactivity
      const kickChannel = supabase.channel(`inactivity-kick-${roomId}`);
      await kickChannel.subscribe();
      await kickChannel.send({
        type: 'broadcast',
        event: 'player_kicked_inactivity',
        payload: { playerName: currentPlayer.name }
      });
      supabase.removeChannel(kickChannel);

      // Kick the current player
      const { data: remainingCount, error } = await supabase
        .rpc('kick_inactive_player', {
          p_room_id: roomId,
          p_player_id: currentPlayer.id
        });

      if (error) {
        console.error('Error kicking player:', error);
        // Don't throw here - show user-friendly message instead
      }

      // Always show the user-friendly kick message
      toast({
        title: tOrg('org.guessingPhase.removedDueToInactivity', 'You were removed from the game due to inactivity.', organization?.id, organization?.slug),
        variant: "destructive"
      });

      // If only 1 or fewer total players remain, end the game
      // Fetch total player count since remainingCount only counts humans
      const { data: allPlayersData, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', roomId);

      if (!playersError && allPlayersData && allPlayersData.length <= 1) {
        console.log('Not enough players remaining, ending game early');
        await supabase.rpc('end_game_early', { p_room_id: roomId });
      }

      // Navigate the kicked player back to play page
      if (organization && organization.slug) {
        navigate(`/org/${organization.slug}/play`);
      } else {
        navigate('/play');
      }
    } catch (error: any) {
      console.error('Error in timeout kick:', error);
      toast({
        title: tOrg('org.gameRoom.errorKickingPlayer', 'Error kicking player', organization?.id, organization?.slug),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTopic || selectedItems.length !== 5) {
      toast({
        title: t('topicSelection.incompleteSelection'),
        description: t('topicSelection.selectTopicAndItems'),
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // For ordered_items, store both ID and name for custom items
      const orderedItemsData = selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url || null,
        isCustom: item.id.startsWith('custom-') || selectedTopic.isCustom
      }));

      const { error } = await supabase
        .from('player_selections')
        .insert({
          player_id: currentPlayer.id,
          room_id: roomId,
          round: currentRound,
          topic_id: selectedTopic.id,
          ordered_items: orderedItemsData
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: t('topicSelection.selectionSubmitted'),
        description: t('topicSelection.waitingForOthers'),
      });

      // Re-check status after submission
      await checkSubmissionStatus();
    } catch (error: any) {
      toast({
        title: t('topicSelection.errorSubmittingSelection'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const checkIfAllReady = async () => {
    console.log('checkIfAllReady called, isHost:', isHost, 'players.length:', players.length);

    // Fetch current players (may have changed due to kicks)
    const { data: currentPlayers, error: playersError } = await supabase
      .from('players')
      .select('id, is_host')
      .eq('room_id', roomId);

    if (playersError || !currentPlayers) {
      console.error('Error fetching current players:', playersError);
      return;
    }

    const playerCount = currentPlayers.length;

    // Check if current player is the host (fetch fresh from DB, not stale prop)
    const currentPlayerFromDB = currentPlayers.find(p => p.id === currentPlayer?.id);
    const isCurrentPlayerHost = currentPlayerFromDB?.is_host || false;

    // If only 1 or fewer players, end the game
    if (playerCount <= 1) {
      console.log('Not enough players remaining, ending game early');
      if (isCurrentPlayerHost) {
        await supabase.rpc('end_game_early', { p_room_id: roomId });
      }
      return;
    }

    const { count, error: countError } = await supabase
      .from('player_selections')
      .select('player_id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('round', currentRound);

    if (countError) {
      console.error('Error checking selection count:', countError);
      return;
    }

    console.log(`Selection check: ${count} of ${playerCount} players ready, isCurrentPlayerHost: ${isCurrentPlayerHost}`);

    if (count !== null && playerCount > 0 && count >= playerCount) {
      // All players have submitted their selections
      console.log('All players ready condition met!');
      if (isCurrentPlayerHost) {
        console.log('Host is selecting VIP and transitioning...');
        // Move to guessing phase and select random VIP
        await selectRandomVIP();
      } else {
        console.log('Current player is not host, waiting for host to transition');
      }
    } else {
      console.log('Not all ready yet:', { count, playerCount, hasPlayers: playerCount > 0 });
    }
  };

  const selectRandomVIP = useCallback(async () => {
    // Prevent multiple concurrent VIP selections
    if (isTransitioningRef.current) {
      console.log('VIP selection already in progress, skipping...');
      return;
    }

    isTransitioningRef.current = true;

    try {
      // Double-check the current game phase to avoid race conditions
      const { data: currentRoom } = await supabase
        .from('game_rooms')
        .select('game_phase')
        .eq('id', roomId)
        .maybeSingle();

      if (currentRoom?.game_phase !== 'topic_selection') {
        console.log('Game phase already changed, skipping VIP selection');
        return;
      }

      // Fetch current players from database (not stale prop) who have submitted their selection
      // This ensures we only select VIP from players who actually have a valid selection
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('player_selections')
        .select('player_id, players!inner(id, name)')
        .eq('room_id', roomId)
        .eq('round', currentRound);

      if (selectionsError) {
        console.error('Error fetching player selections:', selectionsError);
        throw selectionsError;
      }

      if (!selectionsData || selectionsData.length === 0) {
        console.error('No players with valid selections found');
        toast({
          title: t('topicSelection.errorTransitioningToGuessing'),
          description: 'No valid player selections found.',
          variant: "destructive"
        });
        return;
      }

      // Get player IDs who have submitted selections
      const validPlayerIds = selectionsData.map(s => s.player_id);

      // Select random VIP from players who have submitted
      const randomVIPId = validPlayerIds[Math.floor(Math.random() * validPlayerIds.length)];
      const randomVIPData = selectionsData.find(s => s.player_id === randomVIPId);

      console.log('Selecting VIP:', (randomVIPData?.players as any)?.name || randomVIPId, 'and transitioning to guessing phase');

      const { error } = await supabase
        .from('game_rooms')
        .update({
          game_phase: 'guessing',
          current_vip_id: randomVIPId
        })
        .eq('id', roomId);

      if (error) {
        console.error('Error updating game phase:', error);
        throw error;
      }

      console.log('Successfully updated to guessing phase');
    } catch (error: any) {
      console.error('Error in selectRandomVIP:', error);
      toast({
        title: t('topicSelection.errorTransitioningToGuessing'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      // Keep lock for a short time to prevent immediate re-triggers
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1000);
    }
  }, [roomId, currentRound, t, toast]);

  const categoryColors: Record<string, string> = {
    'Food': 'hsl(var(--knowsy-red))',
    'Travel': 'hsl(var(--knowsy-blue))',
    'Entertainment': 'hsl(var(--knowsy-purple))',
    'Technology': 'hsl(var(--knowsy-yellow))',
    'Sports': 'hsl(var(--knowsy-blue))',
    'Lifestyle': 'hsl(var(--knowsy-purple))'
  };

  const groupedTopics = topics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  const itemSelectionContent = selectedTopic ? (
    <>
      <div className="pb-3 sm:pb-4">
        <h3 className="font-heading text-base sm:text-lg">{t('topicSelection.orderYourLikeList')}</h3>
        <p className="font-body text-xs sm:text-sm text-muted-foreground">
          {selectedItems.length < 5
            ? t('topicSelection.selectMoreItems', { count: 5 - selectedItems.length })
            : t('topicSelection.dragToOrder')
          }
        </p>
      </div>
      {selectedItems.length === 5 ? (
        <div className="space-y-2 sm:space-y-3">
          <h4 className="font-body font-medium text-xs sm:text-sm text-muted-foreground">
            {t('topicSelection.yourOrderedList')}
          </h4>
          <DndContext
            sensors={sensors}
            collisionDetection={isMobile ? closestCenter : closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedItems.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {selectedItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="font-heading text-base sm:text-lg text-muted-foreground w-5 sm:w-6 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <SortableItem id={item.id} name={tOrg(`topics.${selectedTopic?.id}.items.${item.id}`, item.name, organization?.id, organization?.slug)} imageUrl={item.image_url} isMobile={isMobile} />
                  </div>
                </div>
              ))}
            </SortableContext>
          </DndContext>
          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t('topicSelection.submitting') : t('topicSelection.submitSelection')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <h4 className="font-body font-medium text-xs sm:text-sm text-muted-foreground">
            {t('topicSelection.selectItems', { selected: selectedItems.length })}
          </h4>

          {/* Custom item input */}
          <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <p className="font-body text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              {t('topicSelection.addCustomItem')}
            </p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t('topicSelection.typeCustomItemName')}
                  value={customItemInput}
                  onChange={(e) => setCustomItemInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!uploadingImage) {
                        handleAddCustomItem();
                      }
                    }
                  }}
                  className="font-body text-sm"
                  maxLength={50}
                />
                <Button
                  onClick={handleAddCustomItem}
                  disabled={!customItemInput.trim() || selectedItems.length >= 5 || uploadingImage}
                  size="icon"
                  className="shrink-0"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Image upload */}
              <div className="flex items-center gap-2">
                {customItemImagePreview ? (
                  <div className="relative">
                    <img
                      src={customItemImagePreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border-2 border-border"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveCustomItemImage}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomItemImageChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 bg-background border-2 border-muted-foreground/20 rounded hover:border-[hsl(var(--knowsy-blue))] transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="font-body text-xs">{t('topicSelection.addImageOptional')}</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* All items (predefined + custom) with selection indicators */}
          <div className="space-y-2">
            {/* Show custom items first if any are selected */}
            {selectedItems.filter(item => item.id.startsWith('custom-')).map(item => {
              const isSelected = true; // Already in selectedItems
              return (
                <Button
                  key={item.id}
                  variant="default"
                  className="w-full justify-between font-body text-sm sm:text-base h-auto py-2 sm:py-2.5 px-3 sm:px-4"
                  onClick={() => handleItemToggle(item)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Check className="w-4 h-4 shrink-0" />
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className="break-words text-left flex-1">{tOrg(`topics.${selectedTopic?.id}.items.${item.id}`, item.name, organization?.id, organization?.slug)}</span>
                  </div>
                  {/* <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                    Custom
                  </Badge> */}
                </Button>
              );
            })}

            {/* Predefined items */}
            {availableItems.map(item => {
              const isSelected = selectedItems.find(i => i.id === item.id);
              return (
                <Button
                  key={item.id}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start font-body text-sm sm:text-base h-auto py-2 sm:py-2.5 px-3 sm:px-4 gap-2"
                  onClick={() => handleItemToggle(item)}
                  disabled={!isSelected && selectedItems.length >= 5}
                >
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={tOrg(`topics.${selectedTopic.id}.items.${item.id}`, item.name, organization?.id, organization?.slug)}
                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <span className="break-words text-left flex-1">{tOrg(`topics.${selectedTopic.id}.items.${item.id}`, item.name, organization?.id, organization?.slug)}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  ) : (
    <div className="text-center py-8 sm:py-12 text-muted-foreground font-body text-sm sm:text-base">
      {t('topicSelection.pleaseSelectTopic')}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)]" style={{ fontFamily: organization?.font_family || fontFamily }}>
      {organization ? <OrganizationHeader organization={organization} showStoreLinks={false} /> : <Header />}
      <main className="container mx-auto px-3 sm:px-4 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Progress indicator */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="font-heading text-base sm:text-lg mb-1 sm:mb-2">{t('topicSelection.roundTopicSelection', { round: currentRound })}</h3>
                  <p className="font-body text-xs sm:text-sm text-muted-foreground">
                    {t('topicSelection.playersReady', { ready: playersReady.length, total: players.length })}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`font-heading text-xl sm:text-2xl ${timeRemaining <= 30 ? 'text-[hsl(var(--knowsy-red))] animate-pulse' : 'text-[hsl(var(--knowsy-blue))]'}`}>
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">{t('topicSelection.timeLeft')}</p>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t">
                <PlayerList
                  players={players}
                  readyPlayers={playersReady}
                  currentPlayerId={currentPlayer.id}
                />
              </div>
            </CardContent>
          </Card>

          {showWarning && !hasSubmitted && (
            <div className="text-center text-red-500 font-semibold p-2 bg-red-50 rounded-lg border border-red-200 mb-4">
              {t('topicSelection.timeRunningOut')}
            </div>
          )}

         {/* Exit Button */}
         <div className="fixed top-20 right-4 z-40">
           <Button
             variant="outline"
             size="sm"
             className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors w-24 px-1 h-7 text-xs"
             onClick={() => setShowLeaveConfirmation(true)}
           >
             <LogOut className="w-3 h-3 mr-1" />
             {tOrg('org.gameRoom.leaveGame', 'Exit Game', organization?.id, organization?.slug)}
           </Button>
         </div>

          {hasSubmitted ? (
            <Card className="border-2 border-[hsl(var(--knowsy-blue))]">
              <CardHeader className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <CardTitle className="font-heading text-xl sm:text-2xl md:text-3xl">{t('topicSelection.selectionComplete')}</CardTitle>
                <CardDescription className="font-body text-sm sm:text-base">
                  {t('topicSelection.waitingForOthersSelections')}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Topic Selection */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="font-heading flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('topicSelection.selectTopic')}
                  </CardTitle>
                  <CardDescription className="font-body text-xs sm:text-sm">
                    {t('topicSelection.chooseTopicDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {Object.entries(groupedTopics).map(([category, categoryTopics]) => (
                    <div key={category}>
                      <Badge
                        className="mb-2 sm:mb-3 text-xs"
                        style={{ backgroundColor: categoryColors[category] || 'hsl(var(--primary))' }}
                      >
                        {tOrg(`org.categories.${category}`, category, organization?.id, organization?.slug)}
                      </Badge>
                      <div className="space-y-2">
                        {categoryTopics.map(topic => (
                          <div key={topic.id}>
                            <Button
                              variant={selectedTopic?.id === topic.id ? "default" : "outline"}
                              className="w-full justify-start font-body text-sm sm:text-base h-auto py-2 sm:py-2.5 px-3 sm:px-4"
                              onClick={() => handleTopicSelect(topic)}
                            >
                              <span className="flex-1 text-left break-words">{tOrg(`topics.${topic.id}.name`, topic.name, organization?.id, organization?.slug)}</span>
                              {/* {topic.isCustom && (
                                <Badge variant="secondary" className="ml-2 text-xs shrink-0">
                                  {t('topicSelection.custom')}
                                </Badge>
                              )} */}
                            </Button>
                            {isSmallScreen && selectedTopic?.id === topic.id && (
                              <div className="mt-4 ml-4 p-4 bg-card border rounded-lg space-y-3 sm:space-y-4">
                                {itemSelectionContent}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Item Selection and Ordering - Only show on desktop */}
              {!isSmallScreen && (
                <Card ref={itemSelectionRef} className="overflow-hidden">
                  <CardContent className="space-y-3 sm:space-y-4">
                    {itemSelectionContent}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Leave Game Confirmation Dialog */}
      <AlertDialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tOrg('org.gameRoom.confirmLeaveTitle', 'Confirm Leave?', organization?.id, organization?.slug)}</AlertDialogTitle>
            <AlertDialogDescription>
              {tOrg('org.gameRoom.confirmLeaveDescription', 'Are you sure you want to leave the game? You will lose your progress.', organization?.id, organization?.slug)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tOrg('org.gameRoom.cancel', 'Cancel', organization?.id, organization?.slug)}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLeaveConfirmation(false);
                onLeaveRoom();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tOrg('org.gameRoom.leave', 'Leave', organization?.id, organization?.slug)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}