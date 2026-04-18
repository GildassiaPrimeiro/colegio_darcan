export default function range(start: number, end?: number, step = 1): number[] {
  const from = end === undefined ? 0 : start;
  const to = end === undefined ? start : end;
  const values: number[] = [];

  if (step === 0) {
    return values;
  }

  if (step > 0) {
    for (let value = from; value < to; value += step) {
      values.push(value);
    }
  } else {
    for (let value = from; value > to; value += step) {
      values.push(value);
    }
  }

  return values;
}
