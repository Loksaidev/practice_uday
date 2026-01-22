import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Edit2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface CustomTopic {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

interface CustomTopicItem {
  id: string;
  name: string;
  image_url: string | null;
}

interface OrganizationTopicsProps {
  organizationId: string;
}

const OrganizationTopics = ({ organizationId }: OrganizationTopicsProps) => {
  const [topics, setTopics] = useState<CustomTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicItems, setTopicItems] = useState<CustomTopicItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemImageFile, setNewItemImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [editingItem, setEditingItem] = useState<CustomTopicItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CustomTopic | null>(null);
  const [isEditTopicDialogOpen, setIsEditTopicDialogOpen] = useState(false);
  
  // AI suggestions state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [selectedAiItems, setSelectedAiItems] = useState<Set<number>>(new Set());
  const [isAddingAI, setIsAddingAI] = useState(false);
  const [aiMode, setAiMode] = useState<"topics" | "items">("topics");
  
  const { toast } = useToast();

  useEffect(() => {
    loadTopics();
  }, [organizationId]);

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_topics")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTopics(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load topics.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTopicItems = async (topicId: string) => {
    try {
      const { data, error } = await supabase
        .from("custom_topic_items")
        .select("*")
        .eq("custom_topic_id", topicId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTopicItems(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load topic items.",
      });
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !newTopicCategory.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("custom_topics")
        .insert({
          organization_id: organizationId,
          name: newTopicName,
          category: newTopicCategory,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic created successfully.",
      });

      setNewTopicName("");
      setNewTopicCategory("");
      setIsDialogOpen(false);
      loadTopics();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create topic.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${organizationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('topic-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('topic-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload image.",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedTopic) return;

    setIsSaving(true);
    try {
      let imageUrl = null;
      
      if (newItemImageFile) {
        imageUrl = await handleImageUpload(newItemImageFile);
        if (!imageUrl) {
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("custom_topic_items")
        .insert({
          custom_topic_id: selectedTopic,
          name: newItemName,
          image_url: imageUrl,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added successfully.",
      });

      setNewItemName("");
      setNewItemImageFile(null);
      loadTopicItems(selectedTopic);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add item.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageItems = (topicId: string) => {
    setSelectedTopic(topicId);
    setIsItemDialogOpen(true);
    loadTopicItems(topicId);
  };

  const handleDeleteTopic = async (topicId: string, topicName: string) => {
    if (!confirm(`Are you sure you want to delete "${topicName}"? This will also delete all items in this topic.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_topics")
        .delete()
        .eq("id", topicId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic deleted successfully.",
      });

      loadTopics();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete topic.",
      });
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_topic_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });

      if (selectedTopic) {
        loadTopicItems(selectedTopic);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete item.",
      });
    }
  };

  const handleEditItem = (item: CustomTopicItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setIsEditDialogOpen(true);
  };

  const handleEditTopic = (topic: CustomTopic) => {
    setEditingTopic(topic);
    setNewTopicName(topic.name);
    setNewTopicCategory(topic.category);
    setIsEditTopicDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName.trim()) return;

    setIsSaving(true);
    try {
      let imageUrl = editingItem.image_url;

      if (newItemImageFile) {
        imageUrl = await handleImageUpload(newItemImageFile);
        if (!imageUrl) {
          setIsSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("custom_topic_items")
        .update({
          name: newItemName,
          image_url: imageUrl,
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully.",
      });

      setNewItemName("");
      setNewItemImageFile(null);
      setEditingItem(null);
      setIsEditDialogOpen(false);

      if (selectedTopic) {
        loadTopicItems(selectedTopic);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update item.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic || !newTopicName.trim() || !newTopicCategory.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("custom_topics")
        .update({
          name: newTopicName,
          category: newTopicCategory,
        })
        .eq("id", editingTopic.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Topic updated successfully.",
      });

      setNewTopicName("");
      setNewTopicCategory("");
      setEditingTopic(null);
      setIsEditTopicDialogOpen(false);
      loadTopics();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update topic.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a prompt.",
      });
      return;
    }

    setIsGeneratingAI(true);
    setAiSuggestions([]);
    setSelectedAiItems(new Set());

    try {
      const selectedTopicData = aiMode === "items" && selectedTopic 
        ? topics.find(t => t.id === selectedTopic)
        : null;

      const { data, error } = await supabase.functions.invoke("ai-topic-suggestions", {
        body: {
          type: aiMode,
          prompt: aiPrompt.trim(),
          topicName: selectedTopicData?.name,
          organizationId,
          existingCategories: []
        }
      });

      if (error) {
        if (error.message.includes("Rate limit")) {
          toast({
            variant: "destructive",
            title: "Rate Limit",
            description: "Please wait a moment before trying again.",
          });
        } else if (error.message.includes("Payment required")) {
          toast({
            variant: "destructive",
            title: "Credits Required",
            description: "Please add credits to your Lovable workspace.",
          });
        } else {
          throw error;
        }
        return;
      }

      const suggestions = aiMode === "topics" ? data.topics : data.items;
      setAiSuggestions(suggestions || []);
      setSelectedAiItems(new Set((suggestions || []).map((_: any, i: number) => i)));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate suggestions.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const toggleAiSelection = (index: number) => {
    const newSelected = new Set(selectedAiItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedAiItems(newSelected);
  };

  const handleAddAiSelected = async () => {
    if (selectedAiItems.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one suggestion.",
      });
      return;
    }

    setIsAddingAI(true);

    try {
      if (aiMode === "topics") {
        const topicsToAdd = aiSuggestions.filter((_, i) => selectedAiItems.has(i));

        const { error } = await supabase
          .from("custom_topics")
          .insert(topicsToAdd.map(t => ({
            organization_id: organizationId,
            name: t.name,
            category: t.category
          })));

        if (error) throw error;

        toast({
          title: "Success",
          description: `Added ${topicsToAdd.length} topic(s).`,
        });
        
        loadTopics();
      } else if (aiMode === "items" && selectedTopic) {
        const itemsToAdd = aiSuggestions.filter((_, i) => selectedAiItems.has(i));

        const { error } = await supabase
          .from("custom_topic_items")
          .insert(itemsToAdd.map(item => ({
            custom_topic_id: selectedTopic,
            name: item.name
          })));

        if (error) throw error;

        toast({
          title: "Success",
          description: `Added ${itemsToAdd.length} item(s).`,
        });

        loadTopicItems(selectedTopic);
      }

      setAiDialogOpen(false);
      setAiPrompt("");
      setAiSuggestions([]);
      setSelectedAiItems(new Set());
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add suggestions.",
      });
    } finally {
      setIsAddingAI(false);
    }
  };

  const openAiDialog = (mode: "topics" | "items") => {
    setAiMode(mode);
    setAiDialogOpen(true);
    setAiPrompt("");
    setAiSuggestions([]);
    setSelectedAiItems(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto overflow-scroll">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Custom Topics</CardTitle>
              <CardDescription>
                Create and manage custom topics for your organization
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => openAiDialog("topics")}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Suggestions
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Topic
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {topics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No custom topics yet. Create your first topic!
            </p>
          ) : (
            <div className="grid gap-4">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <CardContent className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4">
                    <div>
                      <h3 className="font-medium">{topic.name}</h3>
                      <p className="text-sm text-muted-foreground">{topic.category}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTopic(topic)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Topic
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageItems(topic.id)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Manage Items
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTopic(topic.id, topic.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
            <DialogDescription>
              Add a custom topic for your organization's games
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                placeholder="e.g., Company Products"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-category">Category</Label>
              <Input
                id="topic-category"
                placeholder="e.g., Business"
                value={newTopicCategory}
                onChange={(e) => setNewTopicCategory(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTopic} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Topic Items</DialogTitle>
            <DialogDescription>
              Add items to this topic (minimum 5 items required)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-image">Item Image (optional)</Label>
              <Input
                id="item-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setNewItemImageFile(file);
                }}
              />
              {newItemImageFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {newItemImageFile.name}
                </p>
              )}
              {uploadingImage && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading image...
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openAiDialog("items")} className="flex-1">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Suggestions
              </Button>
              <Button onClick={handleAddItem} disabled={isSaving || uploadingImage} className="flex-1">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Items ({topicItems.length})</h4>
              {topicItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No items yet. Add at least 5 items.
                </p>
              ) : (
                <div className="grid gap-2">
                  {topicItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span>{item.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {aiMode === "topics" ? "AI Topic Suggestions" : "AI Item Suggestions"}
            </DialogTitle>
            <DialogDescription>
              {aiMode === "topics" 
                ? "Describe what kind of topics you'd like and AI will suggest some options."
                : "Describe what kind of items you need and AI will suggest options to rank."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">
                {aiMode === "topics" ? "What topics do you need?" : "What items do you need?"}
              </Label>
              <Input
                id="ai-prompt"
                placeholder={
                  aiMode === "topics"
                    ? "e.g., company products, team values, industry trends..."
                    : "e.g., classic options, modern choices, variety of styles..."
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isGeneratingAI) {
                    handleGenerateAI();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI || !aiPrompt.trim()}
              className="w-full"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Suggestions
                </>
              )}
            </Button>

            {aiSuggestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Select suggestions to add ({selectedAiItems.size} selected)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAiItems(new Set(aiSuggestions.map((_, i) => i)))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAiItems(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] md:max-h-[300px] overflow-y-auto">
                  {aiMode === "topics" ? (
                    aiSuggestions.map((topic, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedAiItems.has(index)
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/20"
                        }`}
                        onClick={() => toggleAiSelection(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedAiItems.has(index)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {selectedAiItems.has(index) && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{topic.name}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {topic.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{topic.reasoning}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    aiSuggestions.map((item, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedAiItems.has(index)
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/20"
                        }`}
                        onClick={() => toggleAiSelection(index)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedAiItems.has(index)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {selectedAiItems.has(index) && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.reasoning}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <Button
                  onClick={handleAddAiSelected}
                  disabled={isAddingAI || selectedAiItems.size === 0}
                  className="w-full"
                >
                  {isAddingAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {selectedAiItems.size} Selected
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTopicDialogOpen} onOpenChange={setIsEditTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Update the topic details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-topic-name">Topic Name</Label>
              <Input
                id="edit-topic-name"
                placeholder="e.g., Company Products"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-topic-category">Category</Label>
              <Input
                id="edit-topic-category"
                placeholder="e.g., Business"
                value={newTopicCategory}
                onChange={(e) => setNewTopicCategory(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTopicDialogOpen(false);
                setEditingTopic(null);
                setNewTopicName("");
                setNewTopicCategory("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTopic} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                id="edit-item-name"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-item-image">Update Image (optional)</Label>
              <Input
                id="edit-item-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setNewItemImageFile(file);
                }}
              />
              {newItemImageFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {newItemImageFile.name}
                </p>
              )}
              {editingItem?.image_url && !newItemImageFile && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                  <img
                    src={editingItem.image_url}
                    alt={editingItem.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                </div>
              )}
              {uploadingImage && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading image...
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingItem(null);
                setNewItemName("");
                setNewItemImageFile(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={isSaving || uploadingImage}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationTopics;
