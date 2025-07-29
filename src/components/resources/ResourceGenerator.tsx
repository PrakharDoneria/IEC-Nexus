"use client";

import { useState } from "react";
import {
  suggestRelevantResources,
  type SuggestRelevantResourcesOutput,
} from "@/ai/flows/suggest-relevant-resources";
import { NeoButton } from "@/components/NeoButton";
import { NeoCard, NeoCardContent, NeoCardHeader } from "@/components/NeoCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockPosts } from "@/lib/mock";
import { Loader2, Lightbulb, AlertTriangle, LinkIcon } from "lucide-react";

export function ResourceGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestRelevantResourcesOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const recentPostsForAI = mockPosts.map((post) => ({
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
      <NeoCard>
        <NeoCardHeader className="text-center">
            <Lightbulb className="mx-auto h-12 w-12 mb-4 p-2 bg-primary text-primary-foreground rounded-full border-2 border-foreground" />
            <h2 className="font-headline text-3xl font-bold">
            AI Resource Suggestions
          </h2>
          <p className="text-muted-foreground mt-2">
            Click the button to let our AI analyze recent posts from the feed and
            suggest relevant academic materials for you.
          </p>
        </NeoCardHeader>
        <NeoCardContent className="text-center">
          <NeoButton
            size="lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Resources"
            )}
          </NeoButton>
        </NeoCardContent>
      </NeoCard>

      {error && (
        <Alert variant="destructive" className="mt-6 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && result.suggestedResources.length > 0 && (
        <div className="mt-8">
             <h3 className="font-headline text-2xl font-bold mb-4">Suggested For You</h3>
             <div className="space-y-4">
                {result.suggestedResources.map((resource, index) => (
                    <NeoCard key={index}>
                        <NeoCardContent className="p-4">
                            <h4 className="font-headline font-bold">{resource.title}</h4>
                            <p className="text-muted-foreground text-sm my-2">{resource.description}</p>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary font-semibold underline-offset-4 hover:underline">
                                <LinkIcon className="h-4 w-4" />
                                View Resource
                            </a>
                        </NeoCardContent>
                    </NeoCard>
                ))}
             </div>
        </div>
      )}
    </div>
  );
}
