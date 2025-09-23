export function asArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? v as T[] : [];
}

export function safeLength(arr: unknown): number {
  return Array.isArray(arr) ? arr.length : 0;
}