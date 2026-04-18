type PathSegment = string | number;

const normalizePath = (path: string): PathSegment[] =>
  path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);

export default function get<T = unknown, D = undefined>(
  value: unknown,
  path: string | PathSegment[],
  defaultValue?: D,
): T | D {
  const segments = Array.isArray(path) ? path : normalizePath(path);
  let current: any = value;

  for (const segment of segments) {
    if (current == null) {
      return defaultValue as D;
    }
    current = current[segment as keyof typeof current];
  }

  return (current === undefined ? defaultValue : current) as T | D;
}
