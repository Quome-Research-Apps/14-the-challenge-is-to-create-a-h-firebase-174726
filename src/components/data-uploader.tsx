'use client';

import {useState, type ChangeEvent} from 'react';
import type {DataSet} from '@/app/page';
import {AlertCircle, CheckCircle, FileUp, X} from 'lucide-react';

import {useToast} from '@/hooks/use-toast';
import {parseFile, type DataRecord} from '@/lib/data-processing';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';

interface DataUploaderProps {
  id: string;
  title: string;
  description: string;
  onDataReady: (dataset: DataSet | null) => void;
}

export default function DataUploader({
  id,
  title,
  description,
  onDataReady,
}: DataUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<DataRecord[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [timeField, setTimeField] = useState<string>('');
  const [valueField, setValueField] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const {toast} = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setData(null);
    setColumns([]);
    setTimeField('');
    setValueField('');
    onDataReady(null);

    try {
      const parsedData = await parseFile(selectedFile);
      if (parsedData.length === 0) {
        throw new Error('File is empty or could not be parsed.');
      }
      setData(parsedData);
      const firstRecordKeys = Object.keys(parsedData[0]);
      setColumns(firstRecordKeys);
    } catch (err: any) {
      const errorMessage =
        err.message || 'An error occurred while parsing the file.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'File Error',
        description: errorMessage,
      });
    }
  };

  const handleFieldChange = (
    value: string,
    type: 'time' | 'value'
  ) => {
    let newTimeField = timeField;
    let newValueField = valueField;

    if (type === 'time') {
      newTimeField = value;
      setTimeField(value);
    } else {
      newValueField = value;
      setValueField(value);
    }

    if (file && data && newTimeField && newValueField) {
      onDataReady({
        name: file.name,
        data,
        timeField: newTimeField,
        valueField: newValueField,
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setData(null);
    setColumns([]);
    setTimeField('');
    setValueField('');
    setError(null);
    onDataReady(null);
    const input = document.getElementById(id) as HTMLInputElement;
    if(input) input.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {file && timeField && valueField && !error && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {error && <AlertCircle className="h-5 w-5 text-destructive" />}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor={id}>Upload Data File</Label>
          <div className="relative">
            <Input
              id={id}
              type="file"
              accept=".csv, application/json"
              onChange={handleFileChange}
              className={`pr-10 ${file ? 'border-primary' : ''}`}
            />
            {file && (
              <Button variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8" onClick={handleReset}>
                <X className="h-4 w-4"/>
              </Button>
            )}
          </div>
          {file && <p className="text-sm text-muted-foreground">Loaded: {file.name}</p>}
        </div>

        {data && (
          <>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-time`}>Timestamp Field</Label>
              <Select
                value={timeField}
                onValueChange={value => handleFieldChange(value, 'time')}
              >
                <SelectTrigger id={`${id}-time`}>
                  <SelectValue placeholder="Select timestamp column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-value`}>Value Field</Label>
              <Select
                value={valueField}
                onValueChange={value => handleFieldChange(value, 'value')}
              >
                <SelectTrigger id={`${id}-value`}>
                  <SelectValue placeholder="Select value column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
