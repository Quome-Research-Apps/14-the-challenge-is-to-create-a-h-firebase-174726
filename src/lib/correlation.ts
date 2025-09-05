const sum = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0);

const mean = (arr: number[]) => sum(arr) / arr.length;

const stddev = (arr: number[]) => {
  const n = arr.length;
  if (n < 2) return 0;
  const arrMean = mean(arr);
  const diffSq = arr.map(n => (n - arrMean) ** 2);
  return Math.sqrt(sum(diffSq) / (n - 1));
};

export function calculatePearson(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Input arrays must have the same length.');
  }
  const n = x.length;
  if (n < 2) return NaN;

  const meanX = mean(x);
  const meanY = mean(y);
  const stddevX = stddev(x);
  const stddevY = stddev(y);

  if (stddevX === 0 || stddevY === 0) {
    return NaN; // Correlation is not defined if one variable is constant
  }

  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (x[i] - meanX) * (y[i] - meanY);
  }
  covariance /= n - 1;

  return covariance / (stddevX * stddevY);
}

function getRank(arr: number[]): number[] {
  const sortedWithIndices = arr.map((value, index) => ({ value, originalIndex: index }));
  sortedWithIndices.sort((a, b) => a.value - b.value);

  const ranks = new Array(arr.length);
  for (let i = 0; i < sortedWithIndices.length; ) {
    let j = i;
    while (j < sortedWithIndices.length - 1 && sortedWithIndices[j].value === sortedWithIndices[j + 1].value) {
      j++;
    }
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[sortedWithIndices[k].originalIndex] = rank;
    }
    i = j + 1;
  }
  return ranks;
}


export function calculateSpearman(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Input arrays must have the same length.');
  }
  if (x.length < 2) return NaN;

  const rankX = getRank(x);
  const rankY = getRank(y);

  return calculatePearson(rankX, rankY);
}
