"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PollSettings } from "@/types";

interface PollOption {
  id: string;
  text: string;
}

export function CreatePollForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<PollSettings>({
    allowMultipleSelections: false,
    requireLogin: false,
    expirationDate: undefined,
  });
  const { toast } = useToast();
  const router = useRouter();

  const addOption = () => {
    if (options.length < 6) {
      const newOption: PollOption = {
        id: Date.now().toString(),
        text: ""
      };
      setOptions([...options, newOption]);
    }
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a poll title",
      });
      setIsLoading(false);
      return;
    }

    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide at least 2 options",
      });
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Implement API call to create poll
      const pollData = {
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map(option => option.text.trim()),
        settings
      };
      
      console.log("Creating poll:", pollData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success toast
      toast({
        variant: "success",
        title: "Poll Created Successfully! 🎉",
        description: `"${title}" has been created and is now live for voting.`,
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setOptions([
        { id: "1", text: "" },
        { id: "2", text: "" }
      ]);
      setSettings({
        allowMultipleSelections: false,
        requireLogin: false,
        expirationDate: undefined,
      });
      
      // Redirect to polls page after a short delay
      setTimeout(() => {
        router.push('/polls');
      }, 2000);
      
    } catch (error) {
      console.error("Failed to create poll:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create poll. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>
          Create a new poll for others to vote on
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter poll title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Enter poll description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Poll Options</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={options.length >= 6}
                  >
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => updateOption(option.id, e.target.value)}
                          required
                        />
                      </div>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-gray-500">
                  You can add up to 6 options. At least 2 options are required.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="multiple-selections">Allow Multiple Selections</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to select multiple options in this poll
                    </p>
                  </div>
                  <Switch
                    id="multiple-selections"
                    checked={settings.allowMultipleSelections}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, allowMultipleSelections: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-login">Require Login to Vote</Label>
                    <p className="text-sm text-muted-foreground">
                      Only authenticated users can vote on this poll
                    </p>
                  </div>
                  <Switch
                    id="require-login"
                    checked={settings.requireLogin}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, requireLogin: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Poll Expiration Date (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Set when this poll should stop accepting votes
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !settings.expirationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {settings.expirationDate ? (
                          format(settings.expirationDate, "PPP")
                        ) : (
                          <span>Pick an expiration date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={settings.expirationDate}
                        onSelect={(date) => 
                          setSettings(prev => ({ ...prev, expirationDate: date }))
                        }
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {settings.expirationDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettings(prev => ({ ...prev, expirationDate: undefined }))}
                      className="text-muted-foreground"
                    >
                      Clear date
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating Poll..." : "Create Poll"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setOptions([
                    { id: "1", text: "" },
                    { id: "2", text: "" }
                  ]);
                  setSettings({
                    allowMultipleSelections: false,
                    requireLogin: false,
                    expirationDate: undefined,
                  });
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}