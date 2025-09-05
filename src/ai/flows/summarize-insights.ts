'use server';

/**
 * @fileOverview Provides a concise summary of key insights from correlation analysis.
 *
 * - summarizeInsights - A function that summarizes insights based on correlation analysis results.
 * - SummarizeInsightsInput - The input type for the summarizeInsights function, including correlation results.
 * - SummarizeInsightsOutput - The return type for the summarizeInsights function, a textual summary of insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInsightsInputSchema = z.object({
  dataset1Name: z.string().describe('The name of the first dataset.'),
  dataset2Name: z.string().describe('The name of the second dataset.'),
  correlationDescription: z.string().describe('A description of the correlation analysis performed, including the method used.'),
  significantCorrelations: z
    .array(z.object({
      item1: z.string(),
      item2: z.string(),
      correlation: z.number(),
      pValue: z.number().optional(),
    }))
    .describe('An array of significant correlations found between items in the two datasets.'),
}).describe('Input for summarizing correlation insights, including dataset names and correlation results.');

export type SummarizeInsightsInput = z.infer<typeof SummarizeInsightsInputSchema>;

const SummarizeInsightsOutputSchema = z.object({
  summary: z.string().describe('A human-readable summary of the key insights from the correlation analysis.'),
}).describe('Output containing the summary of the insights.');

export type SummarizeInsightsOutput = z.infer<typeof SummarizeInsightsOutputSchema>;

export async function summarizeInsights(input: SummarizeInsightsInput): Promise<SummarizeInsightsOutput> {
  return summarizeInsightsFlow(input);
}

const summarizeInsightsPrompt = ai.definePrompt({
  name: 'summarizeInsightsPrompt',
  input: {schema: SummarizeInsightsInputSchema},
  output: {schema: SummarizeInsightsOutputSchema},
  prompt: `You are an expert data analyst tasked with summarizing the key findings from a correlation analysis between two datasets.

  Dataset 1 Name: {{{dataset1Name}}}
  Dataset 2 Name: {{{dataset2Name}}}
  Correlation Description: {{{correlationDescription}}}

  Significant Correlations:
  {{#each significantCorrelations}}
  - {{{item1}}} and {{{item2}}}: Correlation = {{{correlation}}}{{#if pValue}}, p-value = {{{pValue}}}{{/if}}
  {{/each}}

  Based on the above information, provide a concise, human-readable summary of the key insights, highlighting statistically significant correlations and potential relationships between the datasets. Focus on the most important and actionable findings for a health researcher or individual practicing self-quantification.
  What potential relationships and further investigations should be considered based on this data?
  What caveats should be considered?
  Please return the summary in the "summary" field.
  `,
});

const summarizeInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeInsightsFlow',
    inputSchema: SummarizeInsightsInputSchema,
    outputSchema: SummarizeInsightsOutputSchema,
  },
  async input => {
    const {output} = await summarizeInsightsPrompt(input);
    return output!;
  }
);
