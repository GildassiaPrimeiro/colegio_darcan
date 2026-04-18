export default function last<T>(array: T[]): T | undefined {
  return array.length ? array[array.length - 1] : undefined;
}
