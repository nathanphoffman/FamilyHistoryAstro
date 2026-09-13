import Candidates from './Candidates';
import type { BioContext, Candidate } from '../../lib/types';

interface Props {
  /** Shown under the empty slot — the parents note explaining the gap. */
  fallbackNote?: string;
  /** People proposed for this slot but not drawn into the tree. */
  candidates?: Candidate[];
  sources: BioContext['sources'];
  /** See `PersonBio`'s prop of the same name. */
  onOpenPerson?: (id: string) => void;
}

export default function PersonBioEmpty({ fallbackNote, candidates = [], sources, onOpenPerson }: Props) {
  return (
    <div class="bio-panel min-w-0 flex-[1_1_0]">
      <h2 class="m-0 text-[1.25rem] italic text-ink-faint">Unknown</h2>
      {fallbackNote && (
        <div class="mb-3.5 border-l-[3px] border-l-rule bg-note px-3 py-2 text-[.85rem]">{fallbackNote}</div>
      )}
      <Candidates candidates={candidates} sources={sources} onOpenPerson={onOpenPerson} />
      {!fallbackNote && candidates.length === 0 && <p class="italic text-ink-faint">No record.</p>}
    </div>
  );
}
