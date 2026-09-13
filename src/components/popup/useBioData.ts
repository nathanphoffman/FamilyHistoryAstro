import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { BioContext, PersonOut } from '../../lib/types';
import type { PairData } from '../../lib/data';

export type BioStatus = 'loading' | 'ready' | 'error';
export type BioKind = 'person' | 'pair';

export type PersonPayload = { person: PersonOut; ctx: BioContext };
export type BioPayload = PersonPayload | PairData;

interface BioResult {
  status: BioStatus;
  kind: BioKind | null;
  /** The fetched payload, or null before the first successful load. */
  data: BioPayload | null;
  /** Re-fetch the current url, bypassing the page cache. */
  reload: () => void;
}

const jsonPages = new Map<string, Promise<BioPayload>>();

/** `/people/id.html` -> `/people/id.json`, `/pairs/id.html` -> `/pairs/id.json`. */
function toJsonUrl(htmlUrl: string): string {
  return htmlUrl.replace(/\.html(?=$|[?#])/, '.json');
}

function kindOf(url: string): BioKind {
  return /^\/pairs\//.test(new URL(url, location.href).pathname) ? 'pair' : 'person';
}

/** Fetch a page's JSON, reusing an in-flight or completed request for the url. */
function loadJson(url: string): Promise<BioPayload> {
  let pending = jsonPages.get(url);
  if (!pending) {
    pending = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    });
    jsonPages.set(url, pending);
  }
  return pending;
}

/** Drop a memoised page so the next `loadJson` re-fetches it. */
function forgetJson(url: string): void {
  jsonPages.delete(url);
}

/** Warm the cache for a trigger's data ahead of a click, e.g. on hover/focus. */
export function prefetchBioData(htmlUrl: string): void {
  const jsonUrl = toJsonUrl(htmlUrl);
  loadJson(jsonUrl).catch(() => forgetJson(jsonUrl));
}

/**
 * Loads the JSON sibling of `htmlUrl` (a box's or cross-reference link's
 * `href`) and exposes it as `data`, discarding responses a newer request has
 * superseded. Idle (`ready`, null data) until a url is set.
 */
export function useBioData(htmlUrl: string | null): BioResult {
  const [status, setStatus] = useState<BioStatus>('ready');
  const [kind, setKind] = useState<BioKind | null>(null);
  const [data, setData] = useState<BioPayload | null>(null);
  const reqId = useRef(0);

  const fetchInto = useCallback((target: string, { fresh = false } = {}) => {
    const jsonUrl = toJsonUrl(target);
    if (fresh) forgetJson(jsonUrl);
    const id = ++reqId.current;
    setStatus('loading');
    setKind(kindOf(target));
    loadJson(jsonUrl).then(
      (payload) => {
        if (id !== reqId.current) return;
        setData(payload);
        setStatus('ready');
      },
      () => {
        if (id !== reqId.current) return;
        forgetJson(jsonUrl);
        setStatus('error');
      },
    );
  }, []);

  // Fetch whenever the target changes (including candidate-to-person hops).
  useEffect(() => {
    if (htmlUrl) fetchInto(htmlUrl);
  }, [htmlUrl, fetchInto]);

  const reload = useCallback(() => {
    if (htmlUrl) fetchInto(htmlUrl, { fresh: true });
  }, [htmlUrl, fetchInto]);

  return { status, kind, data, reload };
}
