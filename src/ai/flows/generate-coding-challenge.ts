
'use server';

/**
 * @fileOverview A Genkit flow to generate a daily coding challenge.
 *
 * - generateCodingChallenge - A function that generates a new coding challenge.
 * - GenerateCodingChallengeOutput - The return type for the generateCodingChallenge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCodingChallengeOutputSchema = z.object({
  title: z.string().describe('A catchy and descriptive title for the coding challenge.'),
  description: z.string().describe('A detailed description of the coding challenge, including the problem statement and any constraints.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the challenge.'),
  example: z.object({
    input: z.string().describe('An example input for the challenge.'),
    output: z.string().describe('The corresponding example output.'),
  }).describe('An example test case with input and expected output.'),
});

export type GenerateCodingChallengeOutput = z.infer<typeof GenerateCodingChallengeOutputSchema>;

export async function generateCodingChallenge(): Promise<GenerateCodingChallengeOutput> {
  return generateCodingChallengeFlow();
}

const prompt = ai.definePrompt({
  name: 'generateCodingChallengePrompt',
  output: { schema: GenerateCodingChallengeOutputSchema },
  prompt: `You are an AI assistant tasked with creating engaging and educational daily coding challenges for college students.
  The challenges should be beginner-friendly but thought-provoking.
  
  Generate a new coding challenge with the following properties:
  - A catchy title.
  - A clear description of the problem.
  - A difficulty level (Easy, Medium, or Hard).
  - One clear example with an input and its corresponding output.

  The topic should be relevant to common data structures and algorithms concepts taught in introductory computer science courses.
  Avoid overly complex or niche topics. Make it fun!
  
  Format your output as a JSON object matching the provided schema.
  `,
});

const generateCodingChallengeFlow = ai.defineFlow(
  {
    name: 'generateCodingChallengeFlow',
    outputSchema: GenerateCodingChallengeOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
