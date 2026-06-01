import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PRIVATE_BUCKETS = ['nf-files'];

/**
 * If the given URL points to a now-private bucket, extract the storage path.
 * Returns { bucket, path } or null when no rewrite is needed.
 */
export function parseStorageRef(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  // matches both /object/public/<bucket>/<path> and /object/sign/<bucket>/<path>
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/);
  if (!m) return null;
  const bucket = m[1];
  const path = decodeURIComponent(m[2]);
  if (!PRIVATE_BUCKETS.includes(bucket)) return null;
  return { bucket, path };
}

/** Resolve a stored URL to a usable URL (signed if the bucket is private). */
export async function resolveStorageUrl(url: string | null | undefined, expiresIn = 300): Promise<string | null> {
  if (!url) return null;
  const ref = parseStorageRef(url);
  if (!ref) return url;
  const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** React hook: returns a usable URL for the given stored URL, signing it if needed. */
export function useSignedUrl(url: string | null | undefined, expiresIn = 300): string | null {
  const [resolved, setResolved] = useState<string | null>(() => (parseStorageRef(url) ? null : url ?? null));
  useEffect(() => {
    let cancelled = false;
    if (!url) { setResolved(null); return; }
    const ref = parseStorageRef(url);
    if (!ref) { setResolved(url); return; }
    setResolved(null);
    resolveStorageUrl(url, expiresIn).then((u) => { if (!cancelled) setResolved(u); });
    return () => { cancelled = true; };
  }, [url, expiresIn]);
  return resolved;
}
