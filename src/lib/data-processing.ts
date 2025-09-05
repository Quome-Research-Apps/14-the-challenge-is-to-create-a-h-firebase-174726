export type DataRecord = {[key: string]: any};

function parseCsv(text: string): DataRecord[] {
  const lines = text.trim().replace(/\r\n/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Basic CSV parsing, may not handle all edge cases like commas in quoted fields
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      const value = values[i]?.trim() || '';
      // Attempt to convert to number if it's a valid number string
      obj[header] = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
      return obj;
    }, {} as DataRecord);
  });
}

function parseJson(text: string): DataRecord[] {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null)) {
      return data;
    }
  } catch (error) {
    console.error('Failed to parse JSON', error);
  }
  return [];
}

export async function parseFile(file: File): Promise<DataRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) {
        return reject(new Error('File is empty.'));
      }
      try {
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          resolve(parseCsv(text));
        } else if (
          file.type === 'application/json' ||
          file.name.endsWith('.json')
        ) {
          resolve(parseJson(text));
        } else {
          reject(
            new Error(
              'Unsupported file type. Please upload a CSV or JSON file.'
            )
          );
        }
      } catch (e: any) {
        reject(new Error(`Failed to parse file: ${e.message}`));
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
}

export interface AlignedData {
  date: string;
  value1: number;
  value2: number;
}

export function alignDataByDay(
  data1: DataRecord[],
  timeField1: string,
  valueField1: string,
  data2: DataRecord[],
  timeField2: string,
  valueField2: string
): AlignedData[] {
  const aggregateByDay = (
    data: DataRecord[],
    timeField: string,
    valueField: string
  ): Map<string, number[]> => {
    const map = new Map<string, number[]>();
    for (const record of data) {
      if (record[timeField] == null || record[valueField] == null) continue;

      try {
        const date = new Date(record[timeField]);
        // Check for invalid date
        if (isNaN(date.getTime())) continue;

        const key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const value = parseFloat(record[valueField]);
        if (isNaN(value)) continue;

        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(value);
      } catch (e) {
        // Ignore rows that cause errors
      }
    }
    return map;
  };

  const averageDailyValues = (
    map: Map<string, number[]>
  ): Map<string, number> => {
    const avgMap = new Map<string, number>();
    for (const [key, values] of map.entries()) {
      const sum = values.reduce((a, b) => a + b, 0);
      avgMap.set(key, sum / values.length);
    }
    return avgMap;
  };

  const dailyAvg1 = averageDailyValues(
    aggregateByDay(data1, timeField1, valueField1)
  );
  const dailyAvg2 = averageDailyValues(
    aggregateByDay(data2, timeField2, valueField2)
  );

  const aligned: AlignedData[] = [];
  for (const [date, value1] of dailyAvg1.entries()) {
    if (dailyAvg2.has(date)) {
      aligned.push({
        date,
        value1,
        value2: dailyAvg2.get(date)!,
      });
    }
  }

  // Sort by date chronologically
  return aligned.sort((a, b) => a.date.localeCompare(b.date));
}
