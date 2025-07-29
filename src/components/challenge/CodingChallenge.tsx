
"use client";

import { useState } from "react";
import {
  generateCodingChallenge,
  type GenerateCodingChallengeOutput,
} from "@/ai/flows/generate-coding-challenge";
import {
    validateSolution,
    type ValidateSolutionInput,
    type ValidateSolutionOutput,
} from "@/ai/flows/validate-solution";
import { NeoButton } from "@/components/NeoButton";
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardFooter } from "@/components/NeoCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export function CodingChallenge() {
  const { user, idToken, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<GenerateCodingChallengeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [solution, setSolution] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateSolutionOutput | null>(null);

  const fetchChallenge = async () => {
    setLoading(true);
    setError(null);
    setChallenge(null);
    setSolution("");
    setValidationResult(null);

    try {
      const response = await generateCodingChallenge();
      setChallenge(response);
    } catch (e) {
      setError("An error occurred while generating the challenge.");
      console.error(e);
    }
    setLoading(false);
  };
  
  const handleValidate = async () => {
    if (!solution.trim() || !challenge || !user || !idToken) return;

    setValidating(true);
    setValidationResult(null);
    setError(null);

    try {
        const input: ValidateSolutionInput = {
            challengeTitle: challenge.title,
            challengeDescription: challenge.description,
            exampleInput: challenge.example.input,
            exampleOutput: challenge.example.output,
            userSolution: solution,
            userId: user.id
        }
        const response = await validateSolution(input);
        setValidationResult(response);
        if (response.isCorrect) {
            toast({
                title: "Correct Solution!",
                description: `+${response.pointsAwarded} points! Your new score is ${response.newScore}.`,
                className: "bg-green-100 border-green-500 text-green-700"
            });
            await refreshUser(); // Update user context with new score
        } else {
             toast({
                variant: "destructive",
                title: "Incorrect Solution",
                description: response.feedback,
            });
        }
    } catch (e) {
      setError("An error occurred while validating the solution.");
      console.error(e);
    }
    setValidating(false);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!challenge && !loading && (
        <NeoCard>
            <NeoCardHeader className="text-center">
                <Lightbulb className="mx-auto h-12 w-12 mb-4 p-2 bg-primary text-primary-foreground rounded-full border-2 border-foreground" />
                <h2 className="font-headline text-3xl font-bold">
                Daily Coding Challenge
            </h2>
            <p className="text-muted-foreground mt-2">
                Sharpen your skills with a new AI-generated coding problem each day.
            </p>
            </NeoCardHeader>
            <NeoCardContent className="text-center">
            <NeoButton size="lg" onClick={fetchChallenge} disabled={loading}>
                {loading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                </>
                ) : "Generate Today's Challenge"}
            </NeoButton>
            </NeoCardContent>
        </NeoCard>
      )}


      {loading && (
        <NeoCard>
             <NeoCardContent className="p-10 text-center">
                 <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
                 <p className="text-muted-foreground">Generating a new challenge for you...</p>
             </NeoCardContent>
        </NeoCard>
      )}

      {error && (
        <Alert variant="destructive" className="mt-6 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {challenge && (
        <div className="space-y-6">
            <NeoCard>
                <NeoCardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant={challenge.difficulty === 'Easy' ? 'secondary' : challenge.difficulty === 'Medium' ? 'default' : 'destructive'} className="mb-2">{challenge.difficulty}</Badge>
                            <h2 className="font-headline text-2xl font-bold">{challenge.title}</h2>
                        </div>
                        <NeoButton size="icon" variant="secondary" onClick={fetchChallenge} disabled={loading}>
                            <RefreshCw className="h-5 w-5"/>
                        </NeoButton>
                    </div>
                </NeoCardHeader>
                <NeoCardContent>
                    <p className="whitespace-pre-wrap">{challenge.description}</p>
                    <div className="mt-6">
                        <h3 className="font-headline font-semibold text-lg mb-2">Example</h3>
                        <div className="bg-secondary p-4 rounded-md border-2 border-foreground font-code text-sm space-y-2">
                            <p><span className="font-bold">Input:</span> {challenge.example.input}</p>
                            <p><span className="font-bold">Output:</span> {challenge.example.output}</p>
                        </div>
                    </div>
                </NeoCardContent>
            </NeoCard>
            
            <NeoCard>
                <NeoCardHeader>
                    <h3 className="font-headline text-xl font-bold">Your Solution</h3>
                </NeoCardHeader>
                <NeoCardContent>
                    <Textarea 
                        placeholder="Enter your solution here..."
                        className="min-h-48 border-2 border-foreground font-code"
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        disabled={validating}
                    />
                </NeoCardContent>
                <NeoCardFooter className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Submit your code to get it validated by AI.</p>
                    <NeoButton onClick={handleValidate} disabled={validating}>
                        {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Validate Solution
                    </NeoButton>
                </NeoCardFooter>
            </NeoCard>
        </div>
      )}
    </div>
  );
}
