type Iteratee<T> = ((value: T) => number) | keyof T;

const resolveValue = <T>(item: T, iteratee: Iteratee<T>): number =>
  typeof iteratee === 'function' ? iteratee(item) : Number(item[iteratee]);

export default function maxBy<T>(array: T[], iteratee: Iteratee<T>): T | undefined {
  let result: T | undefined;
  let maxValue = -Infinity;

  for (const item of array) {
    const value = resolveValue(item, iteratee);
    if (value > maxValue) {
      maxValue = value;
      result = item;
    }
  }

  return result;
}
