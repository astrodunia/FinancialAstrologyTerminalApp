import { useEffect, useRef, useState } from 'react';
import { rankLocalTickerResults } from './localTickerSearch';

const SEARCH_DEBOUNCE_MS = 300;

export const useTickerSearch = (query, { enabled = true, limit = 8 } = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolved, setResolved] = useState(false);
  const requestRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      requestRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError('');
      setResolved(false);
      return undefined;
    }

    const trimmed = String(query || '').trim();
    if (!trimmed) {
      requestRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError('');
      setResolved(false);
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setLoading(true);
    setResolved(false);

    const timeoutId = setTimeout(async () => {
      setError('');

      try {
        const items = rankLocalTickerResults(trimmed, limit);
        if (!controller.signal.aborted) {
          setResults(items);
          setResolved(true);
        }
      } catch (nextError) {
        if (!controller.signal.aborted) {
          setResults([]);
          setError(nextError?.message ? 'Search failed' : 'Search failed');
          setResolved(true);
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

  return { results, loading, error, resolved };
};
