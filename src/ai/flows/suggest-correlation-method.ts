'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest the most appropriate statistical correlation method
 * based on the characteristics of two input datasets.
 *
 * - suggestCorrelationMethod - A function that takes two datasets and returns a suggested correlation method.
 * - SuggestCorrelationMethodInput - The input type for the suggestCorrelationMethod function.
 * - SuggestCorrelationMethodOutput - The return type for the suggestCorrelationMethod function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCorrelationMethodInputSchema = z.object({
  dataset1Description: z.string().describe('A description of the first dataset, including its data type and distribution.'),
  dataset2Description: z.string().describe('A description of the second dataset, including its data type and distribution.'),
});
export type SuggestCorrelationMethodInput = z.infer<typeof SuggestCorrelationMethodInputSchema>;

const SuggestCorrelationMethodOutputSchema = z.object({
  suggestedMethod: z.string().describe('The suggested statistical correlation method (e.g., Pearson, Spearman).'),
  reasoning: z.string().describe('The reasoning behind the suggested method based on the dataset characteristics.'),
});
export type SuggestCorrelationMethodOutput = z.infer<typeof SuggestCorrelationMethodOutputSchema>;

export async function suggestCorrelationMethod(input: SuggestCorrelationMethodInput): Promise<SuggestCorrelationMethodOutput> {
  return suggestCorrelationMethodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCorrelationMethodPrompt',
  input: {schema: SuggestCorrelationMethodInputSchema},
  output: {schema: SuggestCorrelationMethodOutputSchema},
  prompt: `You are an expert statistician. Based on the descriptions of two datasets, suggest the most appropriate statistical correlation method to use.

Dataset 1 Description: {{{dataset1Description}}}
Dataset 2 Description: {{{dataset2Description}}}

Consider the data types, distributions, and potential non-linear relationships when making your suggestion. Provide a clear reasoning for your choice.

Output the suggested method and the reasoning behind it.
`,
});

const suggestCorrelationMethodFlow = ai.defineFlow(
  {
    name: 'suggestCorrelationMethodFlow',
    inputSchema: SuggestCorrelationMethodInputSchema,
    outputSchema: SuggestCorrelationMethodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
