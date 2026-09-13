import { useEffect, useRef } from 'preact/hooks';
import PersonBio from '../render/PersonBio';
import { useBioData, type PersonPayload } from './useBioData';
import type { PairData } from '../../lib/data';

interface Props {
  /** The `.html` page to show — the click that opened it, not the popup's own state. */
  url: string | null;
  onClose: () => void;
  /** A cross-reference inside the popup was clicked — load that person here instead. */
  onNavigate: (personId: string) => void;
}

/**
 * The biography popup. `Chart` owns *whether* it's open and *what* it's
 * showing (both come in as props, driven by real Preact `onClick` handlers
 * on the boxes it renders); this component owns only its own presentation —
 * fetching the clicked url's JSON and rendering `PersonBio` with it.
 */
export default function BioPopup({ url, onClose, onNavigate }: Props) {
  const { status, kind, data, reload } = useBioData(url);

  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes while the popup is up.
  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [url, onClose]);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (url) closeRef.current?.focus();
  }, [url]);

  // Start scrolled to the top whenever new content loads.
  useEffect(() => {
    if (status === 'ready') bodyRef.current!.scrollTop = 0;
  }, [data, status]);

  // Citations are real JSX now (Prose renders them, not raw HTML), so this
  // is an ordinary event handler, not a discovery query — it's called by the
  // citation's own onClick, for the one target that click already names.
  // scrollIntoView has no Preact-native equivalent; that part stays DOM.
  const onCiteClick = (sourceId: string) => {
    document.getElementById(`src-${sourceId}`)?.scrollIntoView({ block: 'nearest' });
  };

  if (!url) return null;

  const person = kind === 'person' ? (data as PersonPayload | null) : null;
  const pair = kind === 'pair' ? (data as PairData | null) : null;

  return (
    <div
      class="fixed inset-0 z-10 flex items-center justify-center bg-[rgba(0,0,0,0.55)] p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        class="relative max-h-[88vh] w-[min(1080px,100%)] overflow-y-auto rounded-[10px] bg-[#fffdf8] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        role="dialog"
        aria-modal="true"
      >
        <button
          class="absolute right-3 top-2 cursor-pointer border-none bg-transparent text-[1.6rem] leading-none text-ink-soft"
          type="button"
          aria-label="Close"
          onClick={onClose}
          ref={closeRef}
        >
          &times;
        </button>
        {status === 'loading' && <p class="italic text-ink-faint">Loading…</p>}
        {status === 'error' && (
          <p class="italic text-ink-faint">
            Could not load this record.{' '}
            <button
              class="cursor-pointer border-none bg-transparent p-0 text-accent underline [font:inherit]"
              type="button"
              onClick={reload}
            >
              Retry
            </button>
          </p>
        )}
        {status === 'ready' && person && (
          <div id="popupBody" ref={bodyRef}>
            <div class="flex items-start gap-6 max-[700px]:block">
              <PersonBio
                person={person.person}
                ctx={person.ctx}
                onOpenPerson={onNavigate}
                onCiteClick={onCiteClick}
              />
            </div>
          </div>
        )}
        {status === 'ready' && pair && (
          <div id="popupBody" ref={bodyRef}>
            {pair.bits.length > 0 && (
              <div class="mb-[18px] border-b border-b-line px-[30px] pt-0 pb-3.5 text-center text-[.85rem] text-ink-soft">
                {pair.bits.join(' · ')}
              </div>
            )}
            <div class="flex items-start gap-6 max-[700px]:block">
              <PersonBio
                person={pair.father}
                ctx={pair.ctx}
                fallbackNote={pair.note}
                candidates={pair.candidates.father}
                shownUnion={pair.union}
                onOpenPerson={onNavigate}
                onCiteClick={onCiteClick}
              />
              <PersonBio
                person={pair.mother}
                ctx={pair.ctx}
                fallbackNote={pair.note}
                candidates={pair.candidates.mother}
                shownUnion={pair.union}
                onOpenPerson={onNavigate}
                onCiteClick={onCiteClick}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
