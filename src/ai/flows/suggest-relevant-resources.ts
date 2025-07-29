'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant academic resources based on recent posts and discussions.
 *
 * - suggestRelevantResources - A function that triggers the resource suggestion process.
 * - SuggestRelevantResourcesInput - The input type for the suggestRelevantResources function.
 * - SuggestRelevantResourcesOutput - The return type for the suggestRelevantResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelevantResourcesInputSchema = z.object({
  recentPosts: z.array(
    z.object({
      content: z.string().describe('The text content of the post.'),
      author: z.string().describe('The author of the post.'),
    })
  ).describe('A list of recent posts and discussions from the user\'s feed.'),
});
export type SuggestRelevantResourcesInput = z.infer<typeof SuggestRelevantResourcesInputSchema>;

const SuggestRelevantResourcesOutputSchema = z.object({
  suggestedResources: z.array(
    z.object({
      title: z.string().describe('The title of the resource.'),
      url: z.string().url().describe('The URL of the resource.'),
      description: z.string().describe('A brief description of the resource.'),
    })
  ).describe('A list of suggested academic resources.'),
});
export type SuggestRelevantResourcesOutput = z.infer<typeof SuggestRelevantResourcesOutputSchema>;

export async function suggestRelevantResources(input: SuggestRelevantResourcesInput): Promise<SuggestRelevantResourcesOutput> {
  return suggestRelevantResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelevantResourcesPrompt',
  input: {schema: SuggestRelevantResourcesInputSchema},
  output: {schema: SuggestRelevantResourcesOutputSchema},
  prompt: `You are an AI assistant designed to suggest relevant academic resources to students based on their recent posts and discussions.

  Analyze the following recent posts and discussions from the user's feed:
  
  {{#each recentPosts}}
  Author: {{author}}
  Content: {{content}}
  {{/each}}

  Based on the content of these posts, suggest a list of academic resources that would be helpful to the student.
  Each resource should include a title, URL, and a brief description.
  Ensure the suggested resources are relevant to the topics discussed in the posts.

  Format your output as a JSON array of resources. Each resource object should have "title", "url", and "description" fields.
  `,
});

const suggestRelevantResourcesFlow = ai.defineFlow(
  {
    name: 'suggestRelevantResourcesFlow',
    inputSchema: SuggestRelevantResourcesInputSchema,
    outputSchema: SuggestRelevantResourcesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
