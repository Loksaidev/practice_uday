import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, Save, X, List, Tag, Upload, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import AISuggestions from "./AISuggestions";

interface Topic {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

interface TopicItem {
  id: string;
  name: string;
  topic_id: string;
  created_at: string;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
}

const TopicsManagement = () => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicItems, setTopicItems] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Topic form state
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  
  // Item form state
  const [newItemName, setNewItemName] = useState("");
  const [editingItem, setEditingItem] = useState<TopicItem | null>(null);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  
  // Category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
    loadTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      loadTopicItems(selectedTopic.id);
    }
  }, [selectedTopic]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load categories.",
      });
    } else {
      setCategories(data || []);
    }
  };

  const loadTopics = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load topics.",
      });
    } else {
      setTopics(data || []);
    }
    setIsLoading(false);
  };

  const loadTopicItems = async (topicId: string) => {
    const { data, error } = await supabase
      .from("topic_items")
      .select("*")
      .eq("topic_id", topicId)
      .order("name", { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load topic items.",
      });
    } else {
      setTopicItems(data || []);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !newTopicCategory) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from("topics")
      .insert({
        name: newTopicName.trim(),
        category: newTopicCategory,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Topic created successfully.",
      });
      setNewTopicName("");
      setNewTopicCategory("");
      setIsTopicDialogOpen(false);
      loadTopics();
    }
    setIsSubmitting(false);
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic || !newTopicName.trim() || !newTopicCategory) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("topics")
      .update({
        name: newTopicName.trim(),
        category: newTopicCategory,
      })
      .eq("id", editingTopic.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Topic updated successfully.",
      });
      setEditingTopic(null);
      setNewTopicName("");
      setNewTopicCategory("");
      setIsTopicDialogOpen(false);
      loadTopics();
    }
    setIsSubmitting(false);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic? This will also delete all its items.")) {
      return;
    }

    const { error } = await supabase
      .from("topics")
      .delete()
      .eq("id", topicId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Topic deleted successfully.",
      });
      if (selectedTopic?.id === topicId) {
        setSelectedTopic(null);
        setTopicItems([]);
      }
      loadTopics();
    }
  };

  const handleAddItem = async () => {
    if (!selectedTopic || !newItemName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an item name.",
      });
      return;
    }

    setIsSubmitting(true);
    
    let imageUrl: string | null = null;
    
    // Upload image if provided
    if (itemImageFile) {
      const fileExt = itemImageFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${selectedTopic.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('topic-images')
        .upload(filePath, itemImageFile);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Error uploading image",
          description: uploadError.message,
        });
        setIsSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('topic-images')
        .getPublicUrl(filePath);
      
      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from("topic_items")
      .insert({
        topic_id: selectedTopic.id,
        name: newItemName.trim(),
        image_url: imageUrl,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Item added successfully.",
      });
      setNewItemName("");
      setItemImageFile(null);
      setItemImagePreview(null);
      loadTopicItems(selectedTopic.id);
    }
    setIsSubmitting(false);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !newItemName.trim()) return;

    setIsSubmitting(true);
    
    let imageUrl: string | null = editingItem.image_url;
    
    // Upload new image if provided
    if (itemImageFile) {
      // Delete old image if exists
      if (editingItem.image_url) {
        const oldPath = editingItem.image_url.split('/topic-images/')[1];
        if (oldPath) {
          await supabase.storage
            .from('topic-images')
            .remove([oldPath]);
        }
      }

      const fileExt = itemImageFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${editingItem.topic_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('topic-images')
        .upload(filePath, itemImageFile);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Error uploading image",
          description: uploadError.message,
        });
        setIsSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('topic-images')
        .getPublicUrl(filePath);
      
      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from("topic_items")
      .update({ 
        name: newItemName.trim(),
        image_url: imageUrl,
      })
      .eq("id", editingItem.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Item updated successfully.",
      });
      setEditingItem(null);
      setNewItemName("");
      setItemImageFile(null);
      setItemImagePreview(null);
      if (selectedTopic) {
        loadTopicItems(selectedTopic.id);
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    const { error } = await supabase
      .from("topic_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
      if (selectedTopic) {
        loadTopicItems(selectedTopic.id);
      }
    }
  };

  const startEditingTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setNewTopicName(topic.name);
    setNewTopicCategory(topic.category);
    setIsTopicDialogOpen(true);
  };

  const startEditingItem = (item: TopicItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setItemImagePreview(item.image_url);
  };

  const cancelEditItem = () => {
    setEditingItem(null);
    setNewItemName("");
    setItemImageFile(null);
    setItemImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setItemImageFile(null);
    setItemImagePreview(null);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a category name.",
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from("categories")
      .insert({ name: newCategoryName.trim() });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Category created successfully.",
      });
      setNewCategoryName("");
      setIsCategoryDialogOpen(false);
      loadCategories();
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (category: Category) => {
    // Check if any topics use this category
    const topicsUsingCategory = topics.filter(t => t.category === category.name);
    if (topicsUsingCategory.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete category",
        description: `This category is used by ${topicsUsingCategory.length} topic(s). Please reassign or delete those topics first.`,
      });
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
      loadCategories();
    }
    setCategoryToDelete(null);
  };

  const groupedTopics = topics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, Topic[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto overflow-scroll">
      {/* Categories Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Categories
              </CardTitle>
              <CardDescription>Manage topic categories</CardDescription>
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new category for organizing topics
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      placeholder="e.g., Music"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateCategory();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleCreateCategory}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="text-sm px-3 py-1 flex items-center gap-2"
              >
                {category.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setCategoryToDelete(category)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet. Create your first category!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Topics and Items Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Topics List */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Knowsy Topics</CardTitle>
              <CardDescription>Manage game topics and categories</CardDescription>
            </div>
            <div className="flex gap-2">
              <AISuggestions 
                categories={categories}
                onTopicCreated={loadTopics}
              />
              <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => {
                  setEditingTopic(null);
                  setNewTopicName("");
                  setNewTopicCategory("");
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Topic
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTopic ? "Edit Topic" : "Create New Topic"}</DialogTitle>
                  <DialogDescription>
                    {editingTopic ? "Update the topic details" : "Add a new topic to the Knowsy database"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic-name">Topic Name</Label>
                    <Input
                      id="topic-name"
                      placeholder="e.g., Favorite Pizza Toppings"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic-category">Category</Label>
                    <Select value={newTopicCategory} onValueChange={setNewTopicCategory}>
                      <SelectTrigger id="topic-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={editingTopic ? handleUpdateTopic : handleCreateTopic}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingTopic ? "Update Topic" : "Create Topic"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[300px] md:max-h-[600px] overflow-y-auto">
          {topics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No topics yet. Create your first topic!</p>
            </div>
          ) : (
            Object.entries(groupedTopics).map(([category, categoryTopics]) => (
              <div key={category}>
                <Badge className="mb-2">{category}</Badge>
                <div className="space-y-2">
                  {categoryTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedTopic?.id === topic.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:border-muted-foreground/20"
                      }`}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{topic.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingTopic(topic);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTopic(topic.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Topic Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {selectedTopic ? `Items for "${selectedTopic.name}"` : "Select a Topic"}
              </CardTitle>
              <CardDescription>
                {selectedTopic
                  ? "Manage items for this topic"
                  : "Choose a topic from the left to manage its items"}
              </CardDescription>
            </div>
            {selectedTopic && (
              <AISuggestions 
                categories={categories}
                selectedTopicId={selectedTopic.id}
                selectedTopicName={selectedTopic.name}
                onItemsCreated={() => loadTopicItems(selectedTopic.id)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTopic ? (
            <>
              {/* Add/Edit Item Form */}
              <div className="space-y-3">
                <Label htmlFor="item-name">
                  {editingItem ? "Edit Item" : "Add New Item"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="item-name"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !itemImageFile) {
                        editingItem ? handleUpdateItem() : handleAddItem();
                      }
                    }}
                  />
                  {editingItem ? (
                    <>
                      <Button
                        size="icon"
                        onClick={handleUpdateItem}
                        disabled={isSubmitting}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditItem}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="icon"
                      onClick={handleAddItem}
                      disabled={isSubmitting}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {/* Image Upload Section */}
                <div className="space-y-2">
                  <Label htmlFor="item-image" className="text-sm text-muted-foreground">
                    Image (Optional)
                  </Label>
                  {itemImagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={itemImagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('item-image')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[200px] md:max-h-[480px] overflow-y-auto">
                {topicItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items yet. Add your first item!</p>
                  </div>
                ) : (
                  topicItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <span>{item.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditingItem(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a topic to view and manage its items</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              This action cannot be undone. Topics using this category must be reassigned or deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TopicsManagement;
