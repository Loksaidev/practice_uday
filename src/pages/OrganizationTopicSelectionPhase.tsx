import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { tOrg } from "@/utils/translation";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { List, GripVertical, Check, Bot, Plus, Image as ImageIcon, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  require_login: boolean;
}

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

function SortableItem({ id, name, imageUrl, isMobile, fontFamily }: { id: string; name: string; imageUrl?: string | null; isMobile?: boolean; fontFamily?: string }) {
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
      <span className="text-sm sm:text-base flex-1 break-words min-w-0" style={{ fontFamily: fontFamily }}>{name}</span>
    </div>
  );
}

const OrganizationTopicSelectionPhase = () => {
  const { t } = useTranslation();
  const { slug, roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const playerName = searchParams.get("name") || "Player";

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

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
          title: "Organization not found",
          variant: "destructive"
        });
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
    };

    loadOrganization();
  }, [slug, toast]);

  useEffect(() => {
    if (!roomCode || !organization) return;

    const initialize = async () => {
      await loadCurrentPlayer();
      await loadOrganizationSettings();
      await loadTopics(organizationId, useKnowsyTopics);
      checkSubmissionStatus();
    };

    initialize();

    const channel = supabase
      .channel(`selections-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_selections',
          filter: `room_id=eq.${roomCode}`
        },
        (payload) => {
          console.log('New selection inserted:', payload);
          checkSubmissionStatus();
        }
      )
      .subscribe((status) => {
        console.log('Selection channel status:', status);
      });

    // Polling fallback
    const pollInterval = setInterval(() => {
      checkSubmissionStatus();
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [roomCode, organization]);

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

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !hasSubmitted && !submitting) {
      console.log('Timer reached 0, triggering auto-submit');
      handleAutoSubmit();
    }
  }, [timeRemaining, hasSubmitted, submitting]);

  const loadCurrentPlayer = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomCode)
      .eq('name', playerName)
      .maybeSingle();

    if (error) {
      console.error('Error loading current player:', error);
      return;
    }

    if (data) {
      setCurrentPlayer({
        id: data.id,
        name: data.name,
        score: data.score,
        isHost: data.is_host,
        isAi: data.is_ai || false
      });
    }
  };

  const loadOrganizationSettings = async () => {
    const { data: roomData } = await supabase
      .from('game_rooms')
      .select('organization_id, organizations(use_knowsy_topics, name)')
      .eq('join_code', roomCode)
      .maybeSingle();

    if (roomData?.organization_id) {
      setOrganizationId(roomData.organization_id);
      const orgData = roomData.organizations as any;
      setUseKnowsyTopics(orgData?.use_knowsy_topics ?? true);
    }
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
          title: "Error loading Knowsy topics",
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
          title: "Error loading custom topics",
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
      .eq('room_id', roomCode)
      .eq('round', 1); // Assuming first round

    console.log('Checking submission status:', data);

    if (data) {
      const ready = data.map(s => (s.players as any).name);
      setPlayersReady(ready);

      if (currentPlayer) {
        const hasPlayerSubmitted = data.some(s => s.player_id === currentPlayer.id);
        setHasSubmitted(hasPlayerSubmitted);
      }
    }
  };

  const handleTopicSelect = async (topic: Topic) => {
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
          title: "Error loading items",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setAvailableItems(data);
    }

    setSelectedItems([]);
  };

  const handleItemToggle = (item: TopicItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 5) {
      setSelectedItems([...selectedItems, item]);
    } else {
      toast({
        title: "Maximum reached",
        description: "You can only select 5 items",
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
        title: "Empty input",
        description: "Please enter an item name",
        variant: "destructive"
      });
      return;
    }

    if (selectedItems.length >= 5) {
      toast({
        title: "Maximum reached",
        description: "You can only select 5 items",
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
        title: "Custom item added",
        description: `"${trimmedInput}" has been added to your selection`,
      });
    } catch (error: any) {
      toast({
        title: "Error uploading image",
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

  const handleAutoSubmit = async () => {
    if (hasSubmitted || submitting) {
      console.log('Auto-submit cancelled: already submitted or submitting');
      return;
    }

    console.log('Auto-submitting due to timeout');
    setSubmitting(true);

    try {
      let topicToSubmit = selectedTopic;
      let itemsToSubmit = selectedItems;

      // If no topic selected or not enough items, make random selection
      if (!topicToSubmit || itemsToSubmit.length < 5) {
        // Randomly select a topic
        const availableTopics = topics.length > 0 ? topics : [];
        if (availableTopics.length === 0) {
          console.error('No topics available for auto-submit');
          setSubmitting(false);
          return;
        }

        topicToSubmit = availableTopics[Math.floor(Math.random() * availableTopics.length)];

        // Load items for this topic
        let items: TopicItem[] = [];
        if (topicToSubmit.isCustom) {
          const { data } = await supabase
            .from('custom_topic_items')
            .select('id, name, custom_topic_id')
            .eq('custom_topic_id', topicToSubmit.id);

          items = data?.map(item => ({
            id: item.id,
            name: item.name,
            topic_id: item.custom_topic_id
          })) || [];
        } else {
          const { data } = await supabase
            .from('topic_items')
            .select('*')
            .eq('topic_id', topicToSubmit.id);

          items = data || [];
        }

        // Randomly select and shuffle 5 items
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        itemsToSubmit = shuffled.slice(0, 5);
      }

      if (itemsToSubmit.length < 5) {
        console.error('Not enough items for auto-submit');
        setSubmitting(false);
        return;
      }

      // Submit the selection
      const orderedItemsData = itemsToSubmit.map(item => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url || null,
        isCustom: item.id.startsWith('custom-') || topicToSubmit.isCustom
      }));

      const { error } = await supabase
        .from('player_selections')
        .insert({
          player_id: currentPlayer?.id,
          room_id: roomCode,
          round: 1,
          topic_id: topicToSubmit.id,
          ordered_items: orderedItemsData
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "Time's up!",
        description: "A random selection was made for you",
      });

      await checkSubmissionStatus();
    } catch (error: any) {
      console.error('Error in auto-submit:', error);
      toast({
        title: "Error submitting",
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
        title: "Incomplete selection",
        description: "Please select a topic and order exactly 5 items",
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
        isCustom: item.id.startsWith('custom-')
      }));

      const { error } = await supabase
        .from('player_selections')
        .insert({
          player_id: currentPlayer?.id,
          room_id: roomCode,
          round: 1,
          topic_id: selectedTopic.id,
          ordered_items: orderedItemsData
        });

      if (error) throw error;

      setHasSubmitted(true);
      toast({
        title: "Selection submitted!",
        description: "Waiting for other players...",
      });

      // Re-check status after submission
      await checkSubmissionStatus();
    } catch (error: any) {
      toast({
        title: "Error submitting selection",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !organization || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--knowsy-blue))] mx-auto mb-4"></div>
          <p className="font-body text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)]" style={{ fontFamily: organization.font_family }}>
      <OrganizationHeader organization={organization} />

      <main className="container mx-auto px-3 sm:px-4 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Progress indicator */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg mb-1 sm:mb-2" style={{ fontFamily: organization?.font_family }}>Round 1 - Topic Selection</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: organization?.font_family }}>
                    {playersReady.length} of {players.length} players ready
                  </p>
                </div>
                <div className="text-right">
                  <div className={`font-heading text-xl sm:text-2xl ${timeRemaining <= 30 ? 'text-[hsl(var(--knowsy-red))] animate-pulse' : 'text-[hsl(var(--knowsy-blue))]'}`}>
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                  </div>
                  <p className="font-body text-xs text-muted-foreground">Time left</p>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t">
                {/* Player list would go here */}
              </div>
            </CardContent>
          </Card>

          {hasSubmitted ? (
            <Card className="border-2 border-[hsl(var(--knowsy-blue))]">
              <CardHeader className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl" style={{ fontFamily: organization?.font_family }}>Selection Complete!</CardTitle>
                <CardDescription className="text-sm sm:text-base" style={{ fontFamily: organization?.font_family }}>
                  Waiting for other players to finish their selections...
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Topic Selection */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl" style={{ fontFamily: organization?.font_family }}>
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    Select a Topic
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm" style={{ fontFamily: organization?.font_family }}>
                    Choose a topic that interests you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {topics.map(topic => (
                    <Button
                      key={topic.id}
                      variant={selectedTopic?.id === topic.id ? "default" : "outline"}
                      className="w-full justify-start text-sm sm:text-base h-auto py-2 sm:py-2.5 px-3 sm:px-4"
                      style={{ fontFamily: organization?.font_family }}
                      onClick={() => handleTopicSelect(topic)}
                    >
                      <span className="flex-1 text-left break-words" style={{ fontFamily: organization?.font_family }}>{tOrg(`topics.${topic.id}.name`, topic.name, organization.id, organization.slug)}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Item Selection and Ordering */}
              <Card className="overflow-hidden">
                <CardContent className="space-y-3 sm:space-y-4">
                  {!selectedTopic ? (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base" style={{ fontFamily: organization?.font_family }}>
                      {t('topicSelection.pleaseSelectTopic')}
                    </div>
                  ) : (
                    <>
                      {selectedItems.length === 5 ? (
                        <div className="space-y-2 sm:space-y-3">
                          <h4 className="font-medium text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: organization?.font_family }}>
                            {t('topicSelection.yourOrderedList')}
                          </h4>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
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
                                    <SortableItem id={item.id} name={item.name} imageUrl={item.image_url} isMobile={isMobile} fontFamily={organization?.font_family} />
                                  </div>
                                </div>
                              ))}
                            </SortableContext>
                          </DndContext>
                          <Button
                            variant="hero"
                            size="lg"
                            className="w-full mt-6"
                            style={{ fontFamily: organization?.font_family }}
                            onClick={handleSubmit}
                            disabled={submitting}
                          >
                            <span>{submitting ? "Submitting..." : "Submit Selection"}</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-medium text-xs sm:text-sm text-muted-foreground" style={{ fontFamily: organization?.font_family }}>
                            {t('topicSelection.selectItems', { selected: selectedItems.length })}
                          </h4>

                          {/* Custom item input */}
                          <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3" style={{ fontFamily: organization?.font_family }}>
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
                                  className="text-sm"
                                  style={{ fontFamily: organization?.font_family }}
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
                                      <span className="text-xs" style={{ fontFamily: organization?.font_family }}>{t('topicSelection.addImageOptional')}</span>
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
                                  className="w-full justify-between text-sm sm:text-base h-auto py-2 sm:py-2.5 px-3 sm:px-4"
                                  style={{ fontFamily: organization?.font_family }}
                                  onClick={() => handleItemToggle(item)}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Check className="w-4 h-4 shrink-0" />
                                    {item.image_url ? (
                                      <img
                                        src={item.image_url}
                                        alt={tOrg(`topics.${selectedTopic.id}.items.${item.id}`, item.name, organization.id, organization.slug)}
                                        className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
                                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" />
                                      </div>
                                    )}
                                    <span className="break-words text-left flex-1" style={{ fontFamily: organization?.font_family }}>{tOrg(`topics.${selectedTopic.id}.items.${item.id}`, item.name, organization.id, organization.slug)}</span>
                                  </div>
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
                                  className="w-full justify-start text-sm sm:text-base h-auto py-2 sm:py-2.5 px-3 sm:px-4 gap-2"
                                  style={{ fontFamily: organization?.font_family }}
                                  onClick={() => handleItemToggle(item)}
                                  disabled={!isSelected && selectedItems.length >= 5}
                                >
                                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={tOrg(`topics.${selectedTopic.id}.items.${item.id}`, item.name, organization.id, organization.slug)}
                                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted-foreground/10 rounded flex items-center justify-center shrink-0">
                                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" />
                                    </div>
                                  )}
                                  <span className="break-words text-left flex-1" style={{ fontFamily: organization?.font_family }}>{tOrg(`topics.${selectedTopic.id}.items.${item.id}`, item.name, organization.id, organization.slug)}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <OrganizationFooter primaryColor={organization.primary_color} />
    </div>
  );
};

export default OrganizationTopicSelectionPhase;