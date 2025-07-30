
'use server';

/**
 * @fileOverview A Genkit flow to generate a profile banner image.
 *
 * - generateProfileBanner - A function that returns an image URL for a banner.
 * - GenerateProfileBannerInput - The input type for the generateProfileBanner function.
 * - GenerateProfileBannerOutput - The return type for the generateProfileBanner function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProfileBannerInputSchema = z.object({
  query: z.string().describe('The search query for the banner image.'),
});
export type GenerateProfileBannerInput = z.infer<typeof GenerateProfileBannerInputSchema>;

const GenerateProfileBannerOutputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the generated banner image.'),
});
export type GenerateProfileBannerOutput = z.infer<typeof GenerateProfileBannerOutputSchema>;

// This tool does not actually use a real API and is for demonstration purposes only.
const getUnsplashImage = ai.defineTool(
    {
        name: 'getUnsplashImage',
        description: 'Get an image from Unsplash based on a query. The image should be suitable for a profile banner, so it should be landscape.',
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.object({ imageUrl: z.string().url() }),
    },
    async (input) => {
        // In a real app, you would call the Unsplash API here.
        // For this demo, we'll return a placeholder that simulates a search.
        const encodedQuery = encodeURIComponent(input.query);
        // Using a source that provides random images based on a query string
        return {
            imageUrl: `https://source.unsplash.com/1200x300/?${encodedQuery}`
        };
    }
);


export async function generateProfileBanner(input: GenerateProfileBannerInput): Promise<GenerateProfileBannerOutput> {
  return generateProfileBannerFlow(input);
}


const generateProfileBannerFlow = ai.defineFlow(
  {
    name: 'generateProfileBannerFlow',
    inputSchema: GenerateProfileBannerInputSchema,
    outputSchema: GenerateProfileBannerOutputSchema,
  },
  async (input) => {
    // The 'runTool' function is a convenient way to execute a tool and get its direct output.
    // It's equivalent to calling ai.generate({ tools: [getUnsplashImage], prompt: ... })
    // and parsing the tool call from the response, but is simpler for direct tool calls.
    const { output } = await ai.runTool(getUnsplashImage, { query: input.query });
    return output!;
  }
);
