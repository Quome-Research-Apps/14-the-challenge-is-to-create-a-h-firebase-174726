'use client';

import {useState} from 'react';
import type {FC} from 'react';
import {
  AlertCircle,
  BarChart,
  FileText,
  Loader2,
  RefreshCw,
  ScatterChart,
  Zap,
} from 'lucide-react';

import {summarizeInsights} from '@/ai/flows/summarize-insights';
import {suggestCorrelationMethod} from '@/ai/flows/suggest-correlation-method';
import AppHeader from '@/components/app-header';
import DataUploader from '@/components/data-uploader';
import ResultsView from '@/components/results-view';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {useToast} from '@/hooks/use-toast';
import {calculatePearson, calculateSpearman} from '@/lib/correlation';
import {alignDataByDay, type AlignedData, type DataRecord} from '@/lib/data-processing';

export interface DataSet {
  name: string;
  data: DataRecord[];
  timeField: string;
  valueField: string;
}

export interface AnalysisResult {
  alignedData: AlignedData;
  correlation: number;
  method: string;
  reasoning: string;
  summary: string;
  dataset1Name: string;
  dataset2Name: string;
  dataset1ValueField: string;
  dataset2ValueField: string;
}

const Welcome: FC<{onStart: () => void}> = ({onStart}) => (
  <div className="text-center">
    <h2 className="text-3xl font-bold tracking-tight">
      Find the Hidden Connections in Your Data
    </h2>
    <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
      Correlator helps you discover relationships between two time-series
      datasets. Does your joint pain worsen when the barometric pressure drops?
      Are your allergies linked to the local pollen count? Upload your data to
      find out.
    </p>
    <Button size="lg" className="mt-8 bg-accent-gradient text-accent-foreground hover:opacity-90 transition-opacity" onClick={onStart}>
      <Zap className="mr-2" />
      Start Analysis
    </Button>
  </div>
);

export default function Home() {
  const [step, setStep] = useState<'welcome' | 'upload' | 'results'>('welcome');
  const [dataset1, setDataset1] = useState<DataSet | null>(null);
  const [dataset2, setDataset2] = useState<DataSet | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {toast} = useToast();

  const handleAnalyze = async () => {
    if (!dataset1 || !dataset2) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide both datasets before analyzing.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const alignedData = alignDataByDay(
        dataset1.data,
        dataset1.timeField,
        dataset1.valueField,
        dataset2.data,
        dataset2.timeField,
        dataset2.valueField
      );

      if (alignedData.length < 3) {
        throw new Error(
          'Not enough overlapping data points to perform analysis. Please check your datasets and timestamps.'
        );
      }
      
      const {suggestedMethod, reasoning} = await suggestCorrelationMethod({
        dataset1Description: `A time-series dataset named "${dataset1.name}" with numerical values.`,
        dataset2Description: `A time-series dataset named "${dataset2.name}" with numerical values.`,
      });

      const x = alignedData.map(d => d.value1);
      const y = alignedData.map(d => d.value2);
      let correlation: number;

      if (suggestedMethod.toLowerCase().includes('spearman')) {
        correlation = calculateSpearman(x, y);
      } else {
        correlation = calculatePearson(x, y);
      }

      if (isNaN(correlation)) {
        throw new Error(
          'Correlation could not be calculated. This might be due to a lack of variation in one of your datasets.'
        );
      }

      const {summary} = await summarizeInsights({
        dataset1Name: dataset1.name,
        dataset2Name: dataset2.name,
        correlationDescription: `Analysis was performed using the ${suggestedMethod} correlation method. ${reasoning}`,
        significantCorrelations: [
          {
            item1: dataset1.valueField,
            item2: dataset2.valueField,
            correlation: correlation,
          },
        ],
      });

      setAnalysisResult({
        alignedData,
        correlation,
        method: suggestedMethod,
        reasoning,
        summary,
        dataset1Name: dataset1.name,
        dataset2Name: dataset2.name,
        dataset1ValueField: dataset1.valueField,
        dataset2ValueField: dataset2.valueField,
      });
      setStep('results');
    } catch (e: any) {
      const errorMessage =
        e.message || 'An unknown error occurred during analysis.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDataset1(null);
    setDataset2(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setStep('upload');
  };

  const renderContent = () => {
    if (step === 'welcome') {
      return <Welcome onStart={() => setStep('upload')} />;
    }

    if (isLoading) {
      return (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-xl font-semibold">Analyzing your data...</h3>
          <p className="text-muted-foreground mt-2">
            This may take a moment. We're aligning datasets, calculating
            correlations, and generating insights with AI.
          </p>
        </Card>
      );
    }
    
    if (step === 'results' && analysisResult) {
      return <ResultsView result={analysisResult} onReset={handleReset} />;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <DataUploader
          id="dataset1"
          title="Dataset 1"
          description="Subjective feelings, symptoms, etc."
          onDataReady={setDataset1}
        />
        <DataUploader
          id="dataset2"
          title="Dataset 2"
          description="Objective, external data points."
          onDataReady={setDataset2}
        />
        <div className="lg:col-span-2 flex flex-col items-center gap-4">
          {error && (
            <Alert variant="destructive" className="w-full max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={!dataset1 || !dataset2 || isLoading}
            className="w-full max-w-xs bg-accent-gradient text-accent-foreground hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Analyze
          </Button>
          {(dataset1 || dataset2) && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4"/>
              Reset
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {renderContent()}
      </main>
      <footer className="no-print text-center py-4 text-sm text-muted-foreground border-t">
        <p>Data processing is done entirely in your browser. Your data never leaves your computer.</p>
        <p className="font-semibold">Powered by Genkit</p>
      </footer>
    </div>
  );
}
