type Iteratee<T> = ((value: T) => unknown) | keyof T;

const resolveValue = <T>(item: T, iteratee: Iteratee<T>): unknown =>
  typeof iteratee === 'function' ? iteratee(item) : item[iteratee];

export default function sortBy<T>(array: T[], iteratee: Iteratee<T>): T[] {
  return [...array].sort((left, right) => {
    const a = resolveValue(left, iteratee);
    const b = resolveValue(right, iteratee);

    if (a === b) {
      return 0;
    }
    if (a == null) {
      return 1;
    }
    if (b == null) {
      return -1;
    }
    return a < b ? -1 : 1;
  });
}
