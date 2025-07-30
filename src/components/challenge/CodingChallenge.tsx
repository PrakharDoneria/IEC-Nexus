
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Lightbulb, AlertTriangle, RefreshCw, CheckCircle, XCircle, TimerIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function ChallengeTimer({ difficulty, onTimeUp }: { difficulty: 'Easy' | 'Medium' | 'Hard', onTimeUp: () => void }) {
    const timeMap = {
        Easy: 15 * 60,
        Medium: 30 * 60,
        Hard: 60 * 60,
    };
    const [timeLeft, setTimeLeft] = useState(timeMap[difficulty]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, onTimeUp]);
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="flex items-center gap-2 font-semibold text-lg">
            <TimerIcon className="h-5 w-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
    )
}

export function CodingChallenge() {
  const { user, idToken, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<GenerateCodingChallengeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [solution, setSolution] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidateSolutionOutput | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const fetchChallenge = async () => {
    setLoading(true);
    setError(null);
    setChallenge(null);
    setSolution("");
    setValidationResult(null);
    setIsTimeUp(false);

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
    if (isTimeUp) {
        toast({
            variant: "destructive",
            title: "Time's Up!",
            description: "You can no longer submit a solution.",
        });
        return;
    }

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
                <Lightbulb className="mx-auto h-12 w-12 mb-4 p-2 bg-primary text-primary-foreground rounded-full" />
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

      {error && !loading && (
        <Alert variant="destructive">
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
                         <div className="flex items-center gap-4">
                            <ChallengeTimer difficulty={challenge.difficulty} onTimeUp={() => setIsTimeUp(true)} />
                            <NeoButton size="icon" variant="secondary" onClick={fetchChallenge} disabled={loading}>
                                <RefreshCw className="h-5 w-5"/>
                            </NeoButton>
                        </div>
                    </div>
                </NeoCardHeader>
                <NeoCardContent>
                    <p className="whitespace-pre-wrap">{challenge.description}</p>
                    <div className="mt-6">
                        <h3 className="font-headline font-semibold text-lg mb-2">Example</h3>
                        <div className="bg-secondary p-4 rounded-md font-code text-sm space-y-2">
                            <p><span className="font-bold">Input:</span> {challenge.example.input}</p>
                            <p><span className="font-bold">Output:</span> {challenge.example.output}</p>
                        </div>
                    </div>
                </NeoCardContent>
            </NeoCard>
            
            <NeoCard>
                <NeoCardHeader>
                    <h3 className="font-headline text-xl font-bold">Your Solution</h3>
                    <p className="text-sm text-muted-foreground">You can submit your code in any language.</p>
                </NeoCardHeader>
                <NeoCardContent>
                    <Textarea 
                        placeholder="Enter your solution here..."
                        className="min-h-48 font-code bg-secondary/50 text-base"
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        disabled={validating || isTimeUp}
                    />
                </NeoCardContent>
                <NeoCardFooter className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Submit your code to get it validated by AI.</p>
                    <NeoButton onClick={handleValidate} disabled={validating || isTimeUp}>
                        {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Validate Solution
                    </NeoButton>
                </NeoCardFooter>
            </NeoCard>

             {validationResult && (
                <Alert className={cn(validationResult.isCorrect ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500")}>
                    {validationResult.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertTitle className="font-headline font-bold text-lg">
                        {validationResult.isCorrect ? "Correct Solution!" : "Incorrect Solution"}
                    </AlertTitle>
                    <AlertDescription className="text-base">
                        {validationResult.feedback}
                        {validationResult.isCorrect && (
                            <p className="font-bold mt-2">You earned {validationResult.pointsAwarded} points!</p>
                        )}
                    </AlertDescription>
                </Alert>
            )}
             {isTimeUp && !validationResult && (
                 <Alert variant="destructive">
                    <TimerIcon className="h-4 w-4" />
                    <AlertTitle>Time's Up!</AlertTitle>
                    <AlertDescription>The time for this challenge has expired. Please generate a new challenge to try again.</AlertDescription>
                </Alert>
             )}
        </div>
      )}
    </div>
  );
}
