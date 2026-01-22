import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
}

interface TopicSuggestion {
  name: string;
  category: string;
  reasoning: string;
}

interface ItemSuggestion {
  name: string;
  reasoning: string;
}

interface AISuggestionsProps {
  categories: Category[];
  selectedTopicId?: string;
  selectedTopicName?: string;
  onTopicCreated?: () => void;
  onItemsCreated?: () => void;
}

const AISuggestions = ({ 
  categories, 
  selectedTopicId, 
  selectedTopicName,
  onTopicCreated,
  onItemsCreated 
}: AISuggestionsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[] | ItemSuggestion[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const mode = selectedTopicId ? "items" : "topics";

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a prompt.",
      });
      return;
    }

    setIsLoading(true);
    setSuggestions(null);
    setSelectedSuggestions(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("ai-topic-suggestions", {
        body: {
          type: mode,
          prompt: prompt.trim(),
          topicName: selectedTopicName,
          existingCategories: categories.map(c => c.name)
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

      if (mode === "topics" && data.topics) {
        setSuggestions(data.topics);
        // Select all by default
        setSelectedSuggestions(new Set(data.topics.map((_: any, i: number) => i)));
      } else if (mode === "items" && data.items) {
        setSuggestions(data.items);
        // Select all by default
        setSelectedSuggestions(new Set(data.items.map((_: any, i: number) => i)));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate suggestions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedSuggestions.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one suggestion.",
      });
      return;
    }

    setIsAdding(true);

    try {
      if (mode === "topics") {
        const topicsToAdd = (suggestions as TopicSuggestion[])
          .filter((_, i) => selectedSuggestions.has(i));

        const { error } = await supabase
          .from("topics")
          .insert(topicsToAdd.map(t => ({
            name: t.name,
            category: t.category
          })));

        if (error) throw error;

        toast({
          title: "Success",
          description: `Added ${topicsToAdd.length} topic(s).`,
        });
        
        if (onTopicCreated) onTopicCreated();
      } else if (mode === "items" && selectedTopicId) {
        const itemsToAdd = (suggestions as ItemSuggestion[])
          .filter((_, i) => selectedSuggestions.has(i));

        const { error } = await supabase
          .from("topic_items")
          .insert(itemsToAdd.map(item => ({
            topic_id: selectedTopicId,
            name: item.name
          })));

        if (error) throw error;

        toast({
          title: "Success",
          description: `Added ${itemsToAdd.length} item(s).`,
        });

        if (onItemsCreated) onItemsCreated();
      }

      setIsOpen(false);
      setPrompt("");
      setSuggestions(null);
      setSelectedSuggestions(new Set());
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add suggestions.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI Suggestions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {mode === "topics" ? "AI Topic Suggestions" : `AI Items for "${selectedTopicName}"`}
            </DialogTitle>
            <DialogDescription>
              {mode === "topics" 
                ? "Describe what kind of topics you'd like and AI will suggest some options."
                : "Describe what kind of items you need and AI will suggest options to rank."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">
                {mode === "topics" ? "What topics do you need?" : "What items do you need?"}
              </Label>
              <Input
                id="ai-prompt"
                placeholder={
                  mode === "topics"
                    ? "e.g., fun summer activities, breakfast foods, movie genres..."
                    : "e.g., classic options, modern choices, variety of styles..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleGenerate();
                  }
                }}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
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

            {suggestions && suggestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Select suggestions to add ({selectedSuggestions.size} selected)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSuggestions(new Set(suggestions.map((_, i) => i)))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSuggestions(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {mode === "topics" ? (
                    (suggestions as TopicSuggestion[]).map((topic, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedSuggestions.has(index)
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/20"
                        }`}
                        onClick={() => toggleSelection(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedSuggestions.has(index)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {selectedSuggestions.has(index) && (
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
                    (suggestions as ItemSuggestion[]).map((item, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedSuggestions.has(index)
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/20"
                        }`}
                        onClick={() => toggleSelection(index)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedSuggestions.has(index)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            }`}>
                              {selectedSuggestions.has(index) && (
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
                  onClick={handleAddSelected}
                  disabled={isAdding || selectedSuggestions.size === 0}
                  className="w-full"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {selectedSuggestions.size} Selected
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AISuggestions;
