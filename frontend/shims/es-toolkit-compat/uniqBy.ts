type Iteratee<T> = ((value: T) => unknown) | keyof T;

const resolveValue = <T>(item: T, iteratee: Iteratee<T>): unknown =>
  typeof iteratee === 'function' ? iteratee(item) : item[iteratee];

export default function uniqBy<T>(array: T[], iteratee: Iteratee<T>): T[] {
  const seen = new Set<unknown>();

  return array.filter(item => {
    const value = resolveValue(item, iteratee);
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}
