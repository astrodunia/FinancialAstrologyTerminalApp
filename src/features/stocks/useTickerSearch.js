import { useEffect, useRef, useState } from 'react';
import { rankLocalTickerResults } from './localTickerSearch';

const SEARCH_DEBOUNCE_MS = 300;

export const useTickerSearch = (query, { enabled = true, limit = 8 } = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      requestRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const trimmed = String(query || '').trim();
    if (!trimmed) {
      requestRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const items = rankLocalTickerResults(trimmed, limit);
        if (!controller.signal.aborted) {
          setResults(items);
        }
      } catch (nextError) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(nextError?.message ? 'Search failed' : 'Search failed');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, limit, query]);

  return { results, loading, error };
};
