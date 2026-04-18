export default function omit<T extends Record<string, unknown>, K extends keyof T>(
  value: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...value };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}
