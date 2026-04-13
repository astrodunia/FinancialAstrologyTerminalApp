import type { DrawingShape } from '../drawing/types';

type FetchLike = (path: string, init?: RequestInit & Record<string, unknown>) => Promise<Response>;

type JsonMap = Record<string, unknown>;

const readJson = async (response: Response): Promise<JsonMap | null> => {
  try {
    return (await response.json()) as JsonMap;
  } catch {
    return null;
  }
};

const parseShapes = (payload: JsonMap | null): DrawingShape[] => {
  if (!payload) return [];
  if (Array.isArray(payload.shapes)) return payload.shapes as DrawingShape[];
  const data = payload.data as JsonMap | undefined;
  if (Array.isArray(data?.shapes)) return data.shapes as DrawingShape[];
  return [];
};

const pathForKey = (key: string) => `/api/drawings/${encodeURIComponent(key)}`;

export const loadDrawingsByKey = async (authFetch: FetchLike, key: string): Promise<DrawingShape[]> => {
  const response = await authFetch(pathForKey(key), { method: 'GET' });
  if (!response.ok) return [];
  const payload = await readJson(response);
  return parseShapes(payload);
};

export const saveDrawingsByKey = async (
  authFetch: FetchLike,
  key: string,
  payload: { symbol: string; tf: string; version: number; shapes: DrawingShape[]; xDomain: [number, number] | null },
): Promise<boolean> => {
  const response = await authFetch(pathForKey(key), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.ok;
};

export const deleteDrawingsByKey = async (authFetch: FetchLike, key: string): Promise<boolean> => {
  const response = await authFetch(pathForKey(key), { method: 'DELETE' });
  return response.ok;
};

