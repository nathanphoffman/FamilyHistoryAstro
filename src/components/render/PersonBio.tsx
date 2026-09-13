import PersonBioEmpty from './PersonBioEmpty';
import OtherUnions from './OtherUnions';
import Prose from './Prose';
import Tags from './Tags';
import Sources from './Sources';
import UnverifiedNotice from './UnverifiedNotice';
import VitalFacts from './VitalFacts';
import type { BioContext, Candidate, PersonOut } from '../../lib/types';

interface Props {
  /** The occupant of this slot, or null when the slot is unfilled. */
  person: PersonOut | null;
  /** Lookups for spouses, unions, sources, and tags this person references. */
  ctx: BioContext;
  /** Shown under an empty slot — the parents note explaining the gap. */
  fallbackNote?: string;
  /** People proposed for this slot but not drawn into the tree. */
  candidates?: Candidate[];
  /** The union already named above the pair, so it is not repeated below. */
  shownUnion?: string | null;
  /**
   * When set, cross-reference links (other unions, candidate parents) call
   * this instead of navigating — how the popup keeps a click on a linked
   * relative inside itself. Omitted on the static pages, where those links
   * just navigate normally.
   */
  onOpenPerson?: (id: string) => void;
  /** See `Prose`'s prop of the same name. */
  onCiteClick?: (sourceId: string) => void;
}

/**
 * Renders one person's biography. Used both server-side (no client:* — plain
 * SSR to HTML, zero JS shipped) on the static person/pair pages, and hydrated
 * inside BioPopup, fed the matching JSON endpoint's data as props. Either way
 * it's the exact same component, so the two can never visually drift apart.
 */
export default function PersonBio({
  person,
  ctx,
  fallbackNote,
  candidates = [],
  shownUnion = null,
  onOpenPerson,
  onCiteClick,
}: Props) {
  if (!person) {
    return (
      <PersonBioEmpty
        fallbackNote={fallbackNote}
        candidates={candidates}
        sources={ctx.sources}
        onOpenPerson={onOpenPerson}
      />
    );
  }

  return (
    <div class={`bio-panel min-w-0 flex-[1_1_0]${person.unverified ? ' is-unverified' : ''}`}>
      <h2 class="m-0 text-[1.25rem]">{person.name}</h2>
      {person.aka && (
        <div class="aka text-[.85rem] italic text-ink-faint">also recorded as {person.aka}</div>
      )}

      <UnverifiedNotice reason={person.unverified} />

      <Tags personTags={person.tags} tags={ctx.tags} />

      <VitalFacts person={person} />

      <OtherUnions person={person} ctx={ctx} shownUnion={shownUnion} />

      {person.notes.map((n, i) => (
        <div key={i} class="mb-3.5 border-l-[3px] border-l-rule bg-note px-3 py-2 text-[.85rem]">
          {n}
        </div>
      ))}

      <div class="bio">
        <Prose blocks={person.bioBlocks} onCiteClick={onCiteClick} />
      </div>

      <Sources citations={person.citations} sources={ctx.sources} />
    </div>
  );
}
