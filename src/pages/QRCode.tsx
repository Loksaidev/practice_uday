import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { List, Image as ImageIcon, Loader2, ChevronDown, ChevronUp, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Topic {
  id: string;
  name: string;
  category: string;
}

interface TopicItem {
  id: string;
  name: string;
  topic_id: string;
  image_url?: string | null;
}

const STORAGE_KEYS = {
  LOCAL_TOPICS: 'knowsy_local_topics',
  LOCAL_ITEMS: 'knowsy_local_items',
  EDITED_ITEMS: 'knowsy_edited_items',
  DELETED_ITEMS: 'knowsy_deleted_items',
};

const QRCode = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicItems, setTopicItems] = useState<Record<string, TopicItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  
  // Selection states
  const [selectedItems, setSelectedItems] = useState<Record<string, Set<string>>>({});
  const [showSelectionCard, setShowSelectionCard] = useState(false);
  const [selectionCardFlipped, setSelectionCardFlipped] = useState(false);
  const [selectedTopicData, setSelectedTopicData] = useState<{
    topic: Topic;
    items: TopicItem[];
  } | null>(null);
  
  // Dialog states
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
  const [isResetChangesOpen, setIsResetChangesOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TopicItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const touchedRef = useRef(false);
  
  // Form states
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  
  const { toast } = useToast();

  const navigate = useNavigate();

  useEffect(() => {
    loadTopicsAndItems();
  }, []);

  // Helper functions for localStorage
  const getLocalTopics = (): Topic[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOCAL_TOPICS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const getLocalItems = (): TopicItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOCAL_ITEMS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const getEditedItems = (): Record<string, Partial<TopicItem>> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EDITED_ITEMS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const getDeletedItems = (): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DELETED_ITEMS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalTopics = (topics: Topic[]) => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_TOPICS, JSON.stringify(topics));
  };

  const saveLocalItems = (items: TopicItem[]) => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_ITEMS, JSON.stringify(items));
  };

  const saveEditedItems = (edited: Record<string, Partial<TopicItem>>) => {
    localStorage.setItem(STORAGE_KEYS.EDITED_ITEMS, JSON.stringify(edited));
  };

  const saveDeletedItems = (deleted: string[]) => {
    localStorage.setItem(STORAGE_KEYS.DELETED_ITEMS, JSON.stringify(deleted));
  };

  const loadTopicsAndItems = async () => {
    try {
      // Load all Knowsy topics from database
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (topicsError) throw topicsError;

      // Load all topic items from database
      const { data: itemsData, error: itemsError } = await supabase
        .from('topic_items')
        .select('*')
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;

      // Get local data from localStorage
      const localTopics = getLocalTopics();
      const localItems = getLocalItems();
      const editedItems = getEditedItems();
      const deletedItemIds = getDeletedItems();

      // Merge database topics with local topics
      const allTopics = [...(topicsData || []), ...localTopics];
      setTopics(allTopics);

      // Group items by topic_id and apply local modifications
      const itemsByTopic: Record<string, TopicItem[]> = {};
      
      // Process database items
      itemsData?.forEach((item) => {
        // Skip deleted items
        if (deletedItemIds.includes(item.id)) {
          return;
        }

        if (!itemsByTopic[item.topic_id]) {
          itemsByTopic[item.topic_id] = [];
        }

        // Apply edits if any
        const editedData = editedItems[item.id];
        const finalItem = editedData ? { ...item, ...editedData } : item;
        
        itemsByTopic[item.topic_id].push(finalItem);
      });

      // Add local items
      localItems.forEach((item) => {
        if (!itemsByTopic[item.topic_id]) {
          itemsByTopic[item.topic_id] = [];
        }
        itemsByTopic[item.topic_id].push(item);
      });

      setTopicItems(itemsByTopic);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors: Record<string, string> = {
    'Food': 'hsl(var(--knowsy-red))',
    'Travel': 'hsl(var(--knowsy-blue))',
    'Entertainment': 'hsl(var(--knowsy-purple))',
    'Technology': 'hsl(var(--knowsy-yellow))',
    'Sports': 'hsl(var(--knowsy-blue))',
    'Lifestyle': 'hsl(var(--knowsy-purple))'
  };

  const categories = ['all', ...Array.from(new Set(topics.map(t => t.category)))];
  const filteredTopics = selectedCategory === 'all' 
    ? topics 
    : topics.filter(t => t.category === selectedCategory);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const handleCreateTopic = () => {
    if (!newTopicName.trim() || !newTopicCategory.trim()) {
      toast({
        title: "Error",
        description: "Please provide both name and category",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Create new topic locally
    const newTopic: Topic = {
      id: `local-topic-${Date.now()}`,
      name: newTopicName.trim(),
      category: newTopicCategory.trim(),
    };

    // Update state
    setTopics(prev => {
      const updated = [...prev, newTopic];
      // Save to localStorage (only local topics)
      const localTopics = getLocalTopics();
      saveLocalTopics([...localTopics, newTopic]);
      return updated;
    });
    
    setTopicItems(prev => ({ ...prev, [newTopic.id]: [] }));

    toast({
      title: "Success",
      description: "Topic created successfully",
    });

    setNewTopicName("");
    setNewTopicCategory("");
    setIsCreateTopicOpen(false);
    setIsSubmitting(false);
  };

  const handleAddItem = () => {
    if (!selectedTopicId || !newItemName.trim()) {
      toast({
        title: "Error",
        description: "Please provide an item name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Create new item locally
    const newItem: TopicItem = {
      id: `local-item-${Date.now()}`,
      name: newItemName.trim(),
      topic_id: selectedTopicId,
      image_url: newItemImageUrl.trim() || null,
    };

    // Update state
    setTopicItems(prev => {
      const updated = {
        ...prev,
        [selectedTopicId]: [...(prev[selectedTopicId] || []), newItem]
      };
      
      // Save to localStorage (only local items)
      const localItems = getLocalItems();
      saveLocalItems([...localItems, newItem]);
      
      return updated;
    });

    toast({
      title: "Success",
      description: "Item added successfully",
    });

    setNewItemName("");
    setNewItemImageUrl("");
    setIsAddItemOpen(false);
    setSelectedTopicId(null);
    setIsSubmitting(false);
  };

  const handleEditItem = async () => {
    if (!selectedItem || !newItemName.trim()) {
      toast({
        title: "Error",
        description: "Please provide an item name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const updatedData = {
      name: newItemName.trim(),
      image_url: newItemImageUrl.trim() || null,
    };

    // Get topic name for database save
    const topic = topics.find(t => t.id === selectedItem.topic_id);
    const topicName = topic?.name || 'Unknown Topic';

    // Save to database
    await saveCustomCard(topicName, selectedItem.name, newItemName.trim());

    // Update item locally
    setTopicItems(prev => {
      const newTopicItems = { ...prev };
      const topicId = selectedItem.topic_id;
      
      if (newTopicItems[topicId]) {
        newTopicItems[topicId] = newTopicItems[topicId].map(item =>
          item.id === selectedItem.id
            ? { ...item, ...updatedData }
            : item
        );
      }
      
      // If it's a local item, update it in localStorage
      if (selectedItem.id.startsWith('local-item-')) {
        const localItems = getLocalItems();
        const updatedLocalItems = localItems.map(item =>
          item.id === selectedItem.id ? { ...item, ...updatedData } : item
        );
        saveLocalItems(updatedLocalItems);
      } else {
        // If it's a database item, save the edit
        const editedItems = getEditedItems();
        editedItems[selectedItem.id] = updatedData;
        saveEditedItems(editedItems);
      }
      
      return newTopicItems;
    });

    toast({
      title: "Success",
      description: "Item updated successfully",
    });

    setNewItemName("");
    setNewItemImageUrl("");
    setIsEditItemOpen(false);
    setSelectedItem(null);
    setIsSubmitting(false);
  };

  const handleDeleteItem = () => {
    if (!selectedItem) return;

    setIsSubmitting(true);

    // Delete item locally
    setTopicItems(prev => {
      const newTopicItems = { ...prev };
      const topicId = selectedItem.topic_id;
      
      if (newTopicItems[topicId]) {
        newTopicItems[topicId] = newTopicItems[topicId].filter(
          item => item.id !== selectedItem.id
        );
      }
      
      // If it's a local item, remove from localStorage
      if (selectedItem.id.startsWith('local-item-')) {
        const localItems = getLocalItems();
        const updatedLocalItems = localItems.filter(item => item.id !== selectedItem.id);
        saveLocalItems(updatedLocalItems);
      } else {
        // If it's a database item, add to deleted list
        const deletedItems = getDeletedItems();
        saveDeletedItems([...deletedItems, selectedItem.id]);
      }
      
      return newTopicItems;
    });

    toast({
      title: "Success",
      description: "Item deleted successfully",
    });

    setIsDeleteItemOpen(false);
    setSelectedItem(null);
    setIsSubmitting(false);
  };

  const openAddItemDialog = (topicId: string) => {
    setSelectedTopicId(topicId);
    setNewItemName("");
    setNewItemImageUrl("");
    setIsAddItemOpen(true);
  };

  const openEditItemDialog = (item: TopicItem) => {
    setSelectedItem(item);
    setNewItemName(item.name);
    setNewItemImageUrl(item.image_url || "");
    setIsEditItemOpen(true);
  };

  const openDeleteItemDialog = (item: TopicItem) => {
    setSelectedItem(item);
    setIsDeleteItemOpen(true);
  };

  // Get or create player ID
  const getPlayerId = () => {
    let playerId = localStorage.getItem('player_id');
    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('player_id', playerId);
    }
    return playerId;
  };

  // Save custom card to database
  const saveCustomCard = async (topicName: string, originalItem: string | null, customItem: string) => {
    try {
      const playerId = getPlayerId();
      
      const { error } = await supabase.from('board_cads').insert({
        player_id: playerId,
        topic_name: topicName,
        original_item: originalItem,
        custom_item: customItem.trim()
      });

      if (error) throw error;
      
      console.log('Custom card saved to database');
    } catch (error) {
      console.error('Error saving custom card:', error);
    }
  };

  const clearLocalChanges = () => {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_TOPICS);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.EDITED_ITEMS);
    localStorage.removeItem(STORAGE_KEYS.DELETED_ITEMS);
    
    setIsResetChangesOpen(false);
    
    toast({
      title: "Success",
      description: "All local changes cleared. Reloading...",
    });
    
    // Reload data
    setTimeout(() => {
      loadTopicsAndItems();
    }, 500);
  };

  const toggleItemSelection = (topicId: string, itemId: string) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      
      if (!newSelected[topicId]) {
        newSelected[topicId] = new Set();
      }
      
      const topicSelections = new Set(newSelected[topicId]);
      
      if (topicSelections.has(itemId)) {
        topicSelections.delete(itemId);
      } else {
        if (topicSelections.size < 5) {
          topicSelections.add(itemId);
        } else {
          toast({
            title: "Maximum reached",
            description: "You can only select 5 items per topic",
          });
          return prev;
        }
      }
      
      newSelected[topicId] = topicSelections;
      
      // Check if exactly 5 items selected
      if (topicSelections.size === 5) {
        const topic = topics.find(t => t.id === topicId);
        const items = topicItems[topicId]?.filter(item => topicSelections.has(item.id)) || [];
        
        if (topic && items.length === 5) {
          setSelectedTopicData({ topic, items });
          setShowSelectionCard(true);
          setSelectionCardFlipped(false);
          
          // Flip after 1 second
          setTimeout(() => {
            setSelectionCardFlipped(true);
          }, 1000);
        }
      }
      
      return newSelected;
    });
  };

  const closeSelectionCard = () => {
    const topicId = selectedTopicData?.topic.id;

    setShowSelectionCard(false);
    setSelectionCardFlipped(false);
    setSelectedTopicData(null);
    
    if (topicId) {
      // Clear selections for that topic
      setSelectedItems(prev => {
        const newSelected = { ...prev };
        delete newSelected[topicId];
        return newSelected;
      });

      // Collapse the expanded topic overlay
      setExpandedTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }

    navigate("/qrcode");
  };

  const isItemSelected = (topicId: string, itemId: string): boolean => {
    return selectedItems[topicId]?.has(itemId) || false;
  };

  const getSelectionCount = (topicId: string): number => {
    return selectedItems[topicId]?.size || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.1)] to-[hsl(var(--knowsy-purple)/.1)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--knowsy-blue))' }} />
          <p className="text-muted-foreground">Loading Knowsy Topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[hsl(var(--knowsy-blue)/.15)] via-[hsl(var(--knowsy-purple)/.15)] to-[hsl(var(--knowsy-yellow)/.1)] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[hsl(var(--knowsy-blue)/.2)] blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-[hsl(var(--knowsy-purple)/.2)] blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-36 h-36 rounded-full bg-[hsl(var(--knowsy-yellow)/.15)] blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--knowsy-blue)/.2)] to-[hsl(var(--knowsy-purple)/.2)] border border-[hsl(var(--knowsy-blue)/.3)]">
            <span className="text-sm font-medium bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
              🎮 Knowsy Board Game
            </span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl mb-4 bg-gradient-to-r from-[hsl(var(--knowsy-blue))] via-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-blue))] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Discover Topics
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Explore exciting topics and create your perfect game collection
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {/* <Button 
              onClick={() => setIsCreateTopicOpen(true)}
              className="gap-2 bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] hover:shadow-lg hover:scale-105 transition-all duration-300"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              Create Topic
            </Button> */}
            <Button 
              onClick={() => setIsResetChangesOpen(true)}
              variant="outline"
              size="lg"
              className="gap-2 hover:bg-muted/50 transition-all duration-300"
            >
              Reset Changes
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '100ms' }}>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full flex flex-wrap justify-center gap-2 h-auto p-3 bg-card/50 backdrop-blur-sm border shadow-lg rounded-2xl">
              {categories.map((category, idx) => {
                const color = categoryColors[category] || 'hsl(var(--primary))';
                return (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize px-6 py-3 rounded-xl font-medium data-[state=active]:shadow-md transition-all duration-300"
                    style={{
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    <span className={selectedCategory === category ? 'font-bold' : ''}>
                      {category}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTopics.map((topic, idx) => {
            const items = topicItems[topic.id] || [];
            const categoryColor = categoryColors[topic.category] || 'hsl(var(--primary))';
            const isExpanded = expandedTopics.has(topic.id);

            return (
              <Card 
                key={topic.id} 
                className="group border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 cursor-pointer bg-card/80 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                style={{
                  animationDelay: `${idx * 50}ms`,
                  animationFillMode: 'backwards',
                }}
                onClick={() => toggleTopic(topic.id)}
              >
                {/* Decorative gradient bar */}
                <div 
                  className="h-2 w-full transition-all duration-300 group-hover:h-3"
                  style={{
                    background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}dd)`,
                  }}
                />
                
                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      className="px-3 py-1 font-semibold shadow-sm"
                      style={{ 
                        backgroundColor: `${categoryColor}20`,
                        borderColor: categoryColor,
                        color: categoryColor,
                        border: '2px solid',
                      }}
                    >
                      {topic.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                      <List className="w-4 h-4" />
                      <span>{items.length}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                      {topic.name}
                    </CardTitle>
                    <div className="shrink-0 w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-300">
                      <ChevronDown className="h-5 w-5 group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Expanded Topic Overlay */}
        {Array.from(expandedTopics).map(topicId => {
          const topic = topics.find(t => t.id === topicId);
          if (!topic) return null;

          const items = topicItems[topic.id] || [];
          const categoryColor = categoryColors[topic.category] || 'hsl(var(--primary))';

          return (
            <div
              key={topicId}
              className="fixed inset-0 z-40 flex items-center justify-center p-4 animate-in fade-in duration-300"
              style={{
                backdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}
              onClick={() => toggleTopic(topicId)}
            >
              <Card 
                className="w-full max-w-md max-h-[90vh] overflow-hidden border shadow-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 bg-card"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative gradient bar */}
                <div 
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${categoryColor}, ${categoryColor}dd)`,
                  }}
                />
                
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors border-b p-3"
                  onClick={() => toggleTopic(topicId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      className="px-2 py-0.5 text-[10px] font-semibold"
                      style={{ 
                        backgroundColor: `${categoryColor}15`,
                        borderColor: categoryColor,
                        color: categoryColor,
                        border: '1px solid',
                      }}
                    >
                      {topic.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <List className="w-3 h-3" />
                      <span>{items.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold">
                      {topic.name}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0 h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="overflow-y-auto max-h-[calc(90vh-100px)] p-3">
                  <div className="mb-2 flex gap-2 items-center">
                    {/* <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddItemDialog(topic.id);
                      }}
                      size="sm"
                      className="flex-1 gap-1.5 h-8 text-xs text-foreground"
                      style={{
                        background: `linear-gradient(135deg, ${categoryColor}dd, ${categoryColor})`,
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 text-foreground" />
                      Add Item
                    </Button> */}
                    {getSelectionCount(topic.id) > 0 && (
                      <Badge 
                        className="px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}`,
                        }}
                      >
                        {getSelectionCount(topic.id)}/5
                      </Badge>
                    )}
                  </div>
                  
                  {items.length > 0 ? (
                    <div className="space-y-1.5">
                      {items.map((item, idx) => {
                        const isSelected = isItemSelected(topic.id, item.id);
                        return (
                          <div
                            key={item.id}
                            className={`group/item flex items-center gap-2 p-2 rounded-md transition-all cursor-pointer ${
                              isSelected
                                ? 'shadow-sm'
                                : 'bg-muted/40 hover:bg-muted/60 border border-transparent'
                            }`}
                            style={{
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                              ...(isSelected ? {
                                background: `linear-gradient(135deg, ${categoryColor}15, ${categoryColor}20)`,
                                borderColor: categoryColor,
                                border: '1px solid',
                              } : {})
                            }}
                            onTouchStart={(e) => e.preventDefault()}
                            onTouchEnd={() => {
                              touchedRef.current = true;
                              toggleItemSelection(topic.id, item.id);
                            }}
                            onClick={() => {
                              if (touchedRef.current) {
                                touchedRef.current = false;
                                return;
                              }
                              toggleItemSelection(topic.id, item.id);
                            }}
                          >
                            <div className="relative shrink-0">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="w-10 h-10 object-cover rounded"
                                  style={isSelected ? { 
                                    border: `2px solid ${categoryColor}`
                                  } : {}}
                                />
                              ) : (
                                <div 
                                  className="w-10 h-10 rounded flex items-center justify-center"
                                  style={isSelected ? { 
                                    backgroundColor: `${categoryColor}20`,
                                    border: `2px solid ${categoryColor}`
                                  } : { backgroundColor: 'hsl(var(--muted))' }}>
                                  <ImageIcon className="w-5 h-5" style={{ color: isSelected ? categoryColor : 'hsl(var(--muted-foreground))' }} />
                                </div>
                              )}
                              {isSelected && (
                                <div 
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: categoryColor }}
                                >
                                  <span className="text-[8px] text-white font-bold">✓</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${
                                isSelected ? '' : 'group-hover/item:text-primary'
                              }`}
                              style={isSelected ? { color: categoryColor } : {}}>
                                {item.name}
                              </p>
                            </div>
                            
                            <div 
                              className="flex items-center justify-center w-6 h-6 rounded-full font-semibold text-[10px] shrink-0"
                              style={{
                                backgroundColor: isSelected ? `${categoryColor}25` : 'hsl(var(--muted))',
                                color: isSelected ? categoryColor : 'hsl(var(--muted-foreground))',
                              }}
                            >
                              {idx + 1}
                            </div>
                            
                            <div className="flex gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Button
                                onClick={() => openEditItemDialog(item)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              {/* <Button
                                onClick={() => openDeleteItemDialog(item)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button> */}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                        <List className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        No items yet
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Click "Add Item" to start
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-700">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[hsl(var(--knowsy-blue)/.2)] to-[hsl(var(--knowsy-purple)/.2)] flex items-center justify-center mx-auto mb-6 shadow-lg">
              <List className="w-16 h-16 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-2">No Topics Found</h3>
            <p className="text-lg text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'No topics available yet.'
                : `No topics in the ${selectedCategory} category yet`
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
          <div className="inline-block px-6 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border-2 shadow-lg">
            <p className="text-sm font-medium text-muted-foreground">
              📱 Scan the QR code on your Knowsy board game to access this page
            </p>
          </div>
        </div>
      </div>

      {/* Create Topic Dialog */}
      <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-2">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-heading bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
              Create New Topic
            </DialogTitle>
            <DialogDescription className="text-base">
              Add a new topic with a name and category to expand your collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-3">
              <Label htmlFor="topic-name" className="text-base font-semibold">Topic Name</Label>
              <Input
                id="topic-name"
                placeholder="e.g., Italian Dishes"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="topic-category" className="text-base font-semibold">Category</Label>
              <Select value={newTopicCategory} onValueChange={setNewTopicCategory}>
                <SelectTrigger id="topic-category" className="h-12 text-base border-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">🍕 Food</SelectItem>
                  <SelectItem value="Travel">✈️ Travel</SelectItem>
                  <SelectItem value="Entertainment">🎬 Entertainment</SelectItem>
                  <SelectItem value="Technology">💻 Technology</SelectItem>
                  <SelectItem value="Sports">⚽ Sports</SelectItem>
                  <SelectItem value="Lifestyle">🌟 Lifestyle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateTopicOpen(false)}
              disabled={isSubmitting}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTopic} 
              disabled={isSubmitting}
              className="h-11 px-6 bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] hover:shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Topic
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-2">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-heading bg-gradient-to-r from-[hsl(var(--knowsy-green))] to-[hsl(var(--knowsy-blue))] bg-clip-text text-transparent">
              Add New Item
            </DialogTitle>
            <DialogDescription className="text-base">
              Add a new item to enrich this topic
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-3">
              <Label htmlFor="item-name" className="text-base font-semibold">Item Name</Label>
              <Input
                id="item-name"
                placeholder="e.g., Pizza Margherita"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="item-image" className="text-base font-semibold">
                Image URL <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="item-image"
                placeholder="https://example.com/image.jpg"
                value={newItemImageUrl}
                onChange={(e) => setNewItemImageUrl(e.target.value)}
                className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddItemOpen(false)}
              disabled={isSubmitting}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={isSubmitting}
              className="h-11 px-6 bg-gradient-to-r from-[hsl(var(--knowsy-green))] to-[hsl(var(--knowsy-blue))] hover:shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-2">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-heading bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
              Edit Item
            </DialogTitle>
            <DialogDescription className="text-base">
              Update the item details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-3">
              <Label htmlFor="edit-item-name" className="text-base font-semibold">Item Name</Label>
              <Input
                id="edit-item-name"
                placeholder="e.g., Pizza Margherita"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-item-image" className="text-base font-semibold">
                Image URL <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="edit-item-image"
                placeholder="https://example.com/image.jpg"
                value={newItemImageUrl}
                onChange={(e) => setNewItemImageUrl(e.target.value)}
                className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditItemOpen(false)}
              disabled={isSubmitting}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditItem} 
              disabled={isSubmitting}
              className="h-11 px-6 bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] hover:shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Update Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={isDeleteItemOpen} onOpenChange={setIsDeleteItemOpen}>
        <AlertDialogContent className="sm:max-w-[450px] bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-2 border-destructive/20">
          <AlertDialogHeader className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-heading text-center">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-center">
              Are you sure you want to delete <span className="font-semibold text-foreground">"{selectedItem?.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isSubmitting} className="h-11 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={isSubmitting}
              className="h-11 px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Changes Confirmation Dialog */}
      <AlertDialog open={isResetChangesOpen} onOpenChange={setIsResetChangesOpen}>
        <AlertDialogContent className="sm:max-w-[450px] bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-2 border-yellow-500/20">
          <AlertDialogHeader className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <AlertDialogTitle className="text-2xl font-heading text-center">Reset All Changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-center">
              Are you sure you want to reset all local changes? This will remove all your edits, additions, and deletions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="h-11 px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearLocalChanges}
              className="h-11 px-6 bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg transition-all duration-300"
            >
              Yes, Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Selection Card Overlay */}
      {showSelectionCard && selectedTopicData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={closeSelectionCard}
        >
          <div 
            className="relative w-full max-w-sm"
            style={{ perspective: '1200px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full transition-transform duration-700 ease-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: selectionCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: '420px',
              }}
            >
              {/* Front of card - Logo */}
              <div
                className="absolute inset-0 w-full h-full rounded-lg shadow-xl p-6 flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, hsl(var(--knowsy-blue)) 0%, hsl(var(--knowsy-purple)) 100%)',
                }}
              >
                <div className="text-center">
                  <img 
                    src="/src/assets/knowsy-logo.png" 
                    alt="Knowsy Logo"
                    className="w-32 h-32 mx-auto mb-3 animate-pulse"
                  />
                  <h2 className="text-2xl font-heading text-white">Knowsy</h2>
                </div>
              </div>

              {/* Back of card - Selected items */}
              <div
                className="absolute inset-0 w-full h-full bg-card rounded-lg shadow-xl p-4"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  border: `2px solid ${categoryColors[selectedTopicData.topic.category]}40`,
                }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: `${categoryColors[selectedTopicData.topic.category]}20` }}>
                    <div>
                      <h2 className="text-lg font-heading font-bold mb-1">
                        {selectedTopicData.topic.name}
                      </h2>
                      <Badge 
                        className="text-[10px] px-2 py-0.5 font-semibold"
                        style={{ 
                          backgroundColor: `${categoryColors[selectedTopicData.topic.category]}20`,
                          borderColor: categoryColors[selectedTopicData.topic.category],
                          color: categoryColors[selectedTopicData.topic.category],
                          border: '1px solid',
                        }}
                      >
                        {selectedTopicData.topic.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={closeSelectionCard}
                    >
                      <span className="text-lg leading-none">×</span>
                    </Button>
                  </div>

                  {/* Items List - No scrolling, exactly 5 items */}
                  <div className="flex-1 space-y-2">
                    {selectedTopicData.items.map((item, idx) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-md border animate-in fade-in slide-in-from-right-4"
                        style={{
                          animationDelay: `${idx * 50}ms`,
                          animationFillMode: 'backwards',
                          background: `linear-gradient(135deg, ${categoryColors[selectedTopicData.topic.category]}08, ${categoryColors[selectedTopicData.topic.category]}15)`,
                          borderColor: `${categoryColors[selectedTopicData.topic.category]}30`,
                        }}
                      >
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${categoryColors[selectedTopicData.topic.category]}, ${categoryColors[selectedTopicData.topic.category]}dd)`,
                          }}
                        >
                          {idx + 1}
                        </div>
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded shrink-0"
                            style={{ 
                              border: `1.5px solid ${categoryColors[selectedTopicData.topic.category]}50`
                            }}
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                            style={{ 
                              backgroundColor: `${categoryColors[selectedTopicData.topic.category]}20`,
                              border: `1.5px solid ${categoryColors[selectedTopicData.topic.category]}40`
                            }}
                          >
                            <ImageIcon className="w-5 h-5" style={{ color: `${categoryColors[selectedTopicData.topic.category]}80` }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-2 text-center border-t" style={{ borderColor: `${categoryColors[selectedTopicData.topic.category]}20` }}>
                    <Button
                      onClick={closeSelectionCard}
                      size="sm"
                      className="w-full h-8 text-xs font-semibold"
                      style={{
                        background: `linear-gradient(135deg, ${categoryColors[selectedTopicData.topic.category]}, ${categoryColors[selectedTopicData.topic.category]}dd)`,
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCode;
