type Iteratee<T> = ((value: T) => number) | keyof T;

const resolveValue = <T>(item: T, iteratee: Iteratee<T>): number =>
  typeof iteratee === 'function' ? iteratee(item) : Number(item[iteratee]);

export default function sumBy<T>(array: T[], iteratee: Iteratee<T>): number {
  return array.reduce((total, item) => total + resolveValue(item, iteratee), 0);
}
