import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import { fetchClubById, fetchResourceById } from '../services/resources';
import type { Club, Resource } from '../types/eventpool';

export type ResourceDetailStatus = 'loading' | 'ready' | 'not_found' | 'error';

/**
 * Loads one resource with GET /api/resources/:id (and its owner club) and keeps the app cache fresh.
 * A cached copy is returned immediately while the refresh is in flight.
 */
export function useResourceDetail(resourceId: string | null): {
  resource: Resource | undefined;
  club: Club | undefined;
  status: ResourceDetailStatus;
  error: string;
  reload: () => void;
} {
  const { getResourceById, getClubById, cacheRemoteData } = useApp();
  const [status, setStatus] = useState<ResourceDetailStatus>('loading');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!resourceId) {
      setStatus('not_found');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setError('');

    (async () => {
      try {
        const resource = await fetchResourceById(resourceId);
        if (cancelled) return;
        cacheRemoteData({ resources: [resource] });
        setStatus('ready');

        // Owner club is secondary: the page still works if this fails
        try {
          const club = await fetchClubById(resource.clubId);
          if (!cancelled) cacheRemoteData({ clubs: [club] });
        } catch {
          /* fall back to whatever club data is already cached */
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setStatus('not_found');
        } else {
          setError(
            err instanceof ApiError && (err.code === 'NETWORK_ERROR' || err.status === 0)
              ? 'Cannot reach the EventPool server. Check your connection and try again.'
              : 'Could not load this resource. Please try again.'
          );
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resourceId, reloadKey, cacheRemoteData]);

  const resource = getResourceById(resourceId);
  return {
    resource,
    club: getClubById(resource?.clubId),
    status,
    error,
    reload: () => setReloadKey((k) => k + 1),
  };
}
