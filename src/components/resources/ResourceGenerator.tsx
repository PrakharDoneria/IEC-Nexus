
"use client";

import { useState, useEffect } from "react";
import {
  suggestRelevantResources,
  type SuggestRelevantResourcesOutput,
} from "@/ai/flows/suggest-relevant-resources";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Post } from "@/lib/types";
import { Loader2, Lightbulb, AlertTriangle, LinkIcon } from "lucide-react";

export function ResourceGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestRelevantResourcesOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await fetch('/api/posts?limit=5');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        setRecentPosts(data.posts);
      } catch (err) {
        console.error("Could not fetch recent posts for AI.", err);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchRecentPosts();
  }, []);

  const handleSubmit = async () => {
    if (postsLoading || recentPosts.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const recentPostsForAI = recentPosts.map((post) => ({
      content: post.content,
      author: post.author.name,
    }));

    try {
      const response = await suggestRelevantResources({
        recentPosts: recentPostsForAI,
      });
      setResult(response);
    } catch (e) {
      setError("An error occurred while generating resources.");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader className="text-center">
            <Lightbulb className="mx-auto h-12 w-12 mb-4 p-2 bg-primary text-primary-foreground rounded-full border" />
            <h2 className="text-3xl font-bold">
            AI Resource Suggestions
          </h2>
          <p className="text-muted-foreground mt-2">
            Click the button to let our AI analyze recent posts from the feed and
            suggest relevant academic materials for you.
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={loading || postsLoading || recentPosts.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : postsLoading ? (
                 <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading Feed...
                 </>
            ) : (
              "Generate Resources"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && result.suggestedResources.length > 0 && (
        <div className="mt-8">
             <h3 className="text-2xl font-bold mb-4">Suggested For You</h3>
             <div className="space-y-4">
                {result.suggestedResources.map((resource, index) => (
                    <Card key={index}>
                        <CardContent className="p-4">
                            <h4 className="font-bold">{resource.title}</h4>
                            <p className="text-muted-foreground text-sm my-2">{resource.description}</p>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary font-semibold underline-offset-4 hover:underline">
                                <LinkIcon className="h-4 w-4" />
                                View Resource
                            </a>
                        </CardContent>
                    </Card>
                ))}
             </div>
        </div>
      )}
    </div>
  );
}
