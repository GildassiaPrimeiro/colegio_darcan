type Iteratee<T> = ((value: T) => number) | keyof T;

const resolveValue = <T>(item: T, iteratee: Iteratee<T>): number =>
  typeof iteratee === 'function' ? iteratee(item) : Number(item[iteratee]);

export default function minBy<T>(array: T[], iteratee: Iteratee<T>): T | undefined {
  let result: T | undefined;
  let minValue = Infinity;

  for (const item of array) {
    const value = resolveValue(item, iteratee);
    if (value < minValue) {
      minValue = value;
      result = item;
    }
  }

  return result;
}
