export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  return response.json() as Promise<T>;
}
