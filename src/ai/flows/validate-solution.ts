
'use server';

/**
 * @fileOverview A Genkit flow to validate a user's solution to a coding challenge.
 *
 * - validateSolution - Validates the solution and awards points.
 * - ValidateSolutionInput - The input type for the validateSolution function.
 * - ValidateSolutionOutput - The return type for the validateSolution function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import clientPromise from '@/lib/mongodb';
import { User, ValidateSolutionInputSchema, ValidateSolutionOutputSchema, ValidateSolutionInput, ValidateSolutionOutput } from '@/lib/types';


export async function validateSolution(input: ValidateSolutionInput): Promise<ValidateSolutionOutput> {
  return validateSolutionFlow(input);
}

const validationPrompt = ai.definePrompt({
  name: 'validationPrompt',
  input: { schema: z.object({
      challengeTitle: z.string(),
      challengeDescription: z.string(),
      exampleInput: z.string(),
      exampleOutput: z.string(),
      userSolution: z.string(),
  }) },
  output: { schema: z.object({
    isCorrect: z.boolean(),
    feedback: z.string(),
  }) },
  prompt: `You are an expert code judge for a programming competition.
  Your task is to determine if a user's solution correctly solves the given programming challenge.
  You must also provide clear, concise, and constructive feedback.

  CHALLENGE:
  Title: {{{challengeTitle}}}
  Description: {{{challengeDescription}}}
  Example Input: {{{exampleInput}}}
  Example Output: {{{exampleOutput}}}

  USER'S SOLUTION:
  \`\`\`
  {{{userSolution}}}
  \`\`\`

  Analyze the user's solution. Does it correctly solve the problem described?
  Does it produce the correct output for the given example input?
  Consider edge cases and potential issues, but the primary goal is correctness based on the problem description.

  Provide your verdict and feedback in the specified JSON format.
  If the solution is correct, the feedback should be positive and encouraging.
  If it is incorrect, the feedback must clearly explain the logical error or what the code fails to do.
  Do not just state the code is wrong, explain WHY.
  `,
});

const validateSolutionFlow = ai.defineFlow(
  {
    name: 'validateSolutionFlow',
    inputSchema: ValidateSolutionInputSchema,
    outputSchema: ValidateSolutionOutputSchema,
  },
  async (input) => {
    const { output } = await validationPrompt({
        challengeTitle: input.challengeTitle,
        challengeDescription: input.challengeDescription,
        exampleInput: input.exampleInput,
        exampleOutput: input.exampleOutput,
        userSolution: input.userSolution,
    });
    
    if (!output) {
      throw new Error('AI validation failed to produce an output.');
    }

    let pointsAwarded = 0;
    let finalScore = 0;
    
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<User>('users');

    const user = await usersCollection.findOne({ id: input.userId });
    if (!user) {
      throw new Error('User not found.');
    }

    finalScore = user.score || 0;

    if (output.isCorrect) {
      pointsAwarded = 10; // Award 10 points for a correct solution
      finalScore += pointsAwarded;
      
      await usersCollection.updateOne(
        { id: input.userId },
        { $set: { score: finalScore } }
      );
    }
    
    return {
      isCorrect: output.isCorrect,
      feedback: output.feedback,
      pointsAwarded: pointsAwarded,
      newScore: finalScore,
    };
  }
);
