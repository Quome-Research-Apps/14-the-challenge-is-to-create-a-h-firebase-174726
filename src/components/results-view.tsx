'use client';

import type {AnalysisResult} from '@/app/page';
import {
  Download,
  FileText,
  LineChart,
  RefreshCw,
  ScatterChart,
} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart as RechartsLineChart,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const chartConfig: ChartConfig = {
  value1: {
    label: 'Dataset 1',
  },
  value2: {
    label: 'Dataset 2',
  },
};

export default function ResultsView({result, onReset}: ResultsViewProps) {
  const {
    alignedData,
    correlation,
    method,
    summary,
    dataset1Name,
    dataset2Name,
    dataset1ValueField,
    dataset2ValueField,
  } = result;
  
  chartConfig.value1.label = dataset1ValueField;
  chartConfig.value2.label = dataset2ValueField;


  const handlePrint = () => {
    window.print();
  };

  const getCorrelationStrength = (corr: number) => {
    const absCorr = Math.abs(corr);
    if (absCorr >= 0.7) return 'Strong';
    if (absCorr >= 0.4) return 'Moderate';
    if (absCorr >= 0.1) return 'Weak';
    return 'Very Weak or No';
  };

  const correlationStrength = getCorrelationStrength(correlation);
  const correlationDirection = correlation > 0 ? 'positive' : 'negative';

  return (
    <Card className="w-full printable-area">
      <CardHeader>
        <CardTitle className="text-3xl font-bold tracking-tight">
          Analysis Results
        </CardTitle>
        <CardDescription>
          Correlation between &quot;{dataset1Name}&quot; and &quot;
          {dataset2Name}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <div className="flex justify-between items-start">
            <TabsList className="no-print">
              <TabsTrigger value="summary">
                <FileText className="mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="scatter">
                <ScatterChart className="mr-2" />
                Scatter Plot
              </TabsTrigger>
              <TabsTrigger value="timeseries">
                <LineChart className="mr-2" />
                Time Series
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2 no-print">
                <Button onClick={handlePrint} variant="outline">
                    <Download className="mr-2 h-4 w-4"/>
                    Download Report
                </Button>
                <Button onClick={onReset} variant="destructive">
                    <RefreshCw className="mr-2 h-4 w-4"/>
                    New Analysis
                </Button>
            </div>
          </div>

          <TabsContent value="summary" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Correlation Score</CardTitle>
                  <CardDescription>Using {method} method</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-6xl font-bold text-primary">
                    {correlation.toFixed(3)}
                  </p>
                  <p className="text-xl text-muted-foreground mt-2">
                    {correlationStrength} {correlationDirection} correlation
                  </p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>AI-Powered Insight</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                  <p>{summary}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scatter" className="mt-4">
            <ChartContainer config={chartConfig} className="aspect-video h-[500px] w-full">
              <RechartsScatterChart
                margin={{top: 20, right: 20, bottom: 20, left: 20}}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="value1"
                  name={dataset1ValueField}
                  unit=""
                >
                   <Label value={dataset1ValueField} offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="value2"
                  name={dataset2ValueField}
                  unit=""
                >
                    <Label value={dataset2ValueField} angle={-90} offset={-10} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip
                  cursor={{strokeDasharray: '3 3'}}
                  content={<ChartTooltipContent />}
                />
                <Scatter
                  name="Observations"
                  data={alignedData}
                  fill="hsl(var(--primary))"
                  opacity={0.6}
                />
              </RechartsScatterChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="timeseries" className="mt-4">
             <ChartContainer config={chartConfig} className="aspect-video h-[500px] w-full">
                <RechartsLineChart data={alignedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line yAxisId="left" type="monotone" dataKey="value1" stroke="hsl(var(--primary))" name={dataset1ValueField} />
                    <Line yAxisId="right" type="monotone" dataKey="value2" stroke="hsl(var(--accent))" name={dataset2ValueField} />
                </RechartsLineChart>
             </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
