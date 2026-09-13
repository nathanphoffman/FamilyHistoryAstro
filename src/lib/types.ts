/**
 * How much weight a source carries, ordered strongest first.
 *
 * `reported` is the middle ground: a real record stands behind the claim and
 * someone worked from it, but nobody has re-opened the image to check. It is
 * treated as reasonably reliable.
 *
 * The last two tiers are the untrusted end, and both mark the facts citing them
 * as unverified on the page. `family_notes` is hand-written family notes or an
 * old Bible transcription of no known authorship or date — trusted a little more
 * than an anonymous online tree, because a relative wrote it and some of it
 * copies a real Bible, but still hearsay, some of it second- or third-hand.
 * `unsourced` is a user-submitted tree with no evidence attached at all.
 */
export type Reliability =
  | 'primary' | 'derivative' | 'published' | 'reported' | 'family_notes' | 'unsourced';

/** Tiers that do not, on their own, establish a fact. */
export const UNTRUSTED: readonly Reliability[] = ['family_notes', 'unsourced'];

export type Confidence = 'documented' | 'probable' | 'unconfirmed';

export type CandidateStatus = 'proposed' | 'probable' | 'weakened' | 'eliminated';

/** A person proposed for an unfilled parent slot, never drawn into the tree. */
export interface Candidate {
  name: string;
  parent: 'father' | 'mother';
  person?: string;
  status: CandidateStatus;
  note?: string;
  citations: string[];
}

export interface Tag {
  label: string;
  color: string;
  /** Second channel, independent of colour, so the markers survive a
   *  colourblind reader or a greyscale print. */
  shape: 'square' | 'circle' | 'diamond';
}

/** A tag as applied to one person, with their own note on it. */
export interface PersonTag {
  tag: string;
  note?: string;
}

/** One run of inline biography prose — plain text, or a wrapper around more of the same. */
export type ProseInline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: ProseInline[] }
  | { type: 'italic'; children: ProseInline[] }
  /** A run whose only citations are untrusted sources (see `markUnverified`). */
  | { type: 'unverified'; children: ProseInline[] }
  /** A `[^source_id]` marker, resolved to its 1-based position among this person's citations. */
  | { type: 'citation'; sourceId: string; index: number };

/** One block of biography prose, in source order. */
export type ProseBlock =
  | { type: 'paragraph'; children: ProseInline[] }
  | { type: 'heading'; depth: number; children: ProseInline[] }
  | { type: 'list'; ordered: boolean; items: ProseInline[][] };

export interface Source {
  title: string;
  repository?: string;
  date?: string;
  /** Path under /img, e.g. "/img/sams_death_1913.jpg". */
  image?: string;
  url?: string;
  reliability: Reliability;
  note?: string;
}

export interface Union {
  id: string;
  spouses: [string, string];
  type: 'marriage' | 'relationship';
  date?: string;
  place?: string;
  children: string[];
  citations: string[];
  note?: string;
}

/** One entry in trees.json — a person who gets an ancestry chart of their own. */
export interface Tree {
  person: string;
  title: string;
}

/** A person as prepared for the chart and its biography panels. */
export interface PersonOut {
  id: string;
  name: string;
  aka?: string;
  dates: string;
  occupation?: string;
  birth?: EventOut;
  death?: EventOut;
  burial?: EventOut;
  bioBlocks: ProseBlock[];
  notes: string[];
  citations: string[];
  parentNote?: string;
  confidence: Confidence;
  /**
   * Why this person is untrusted, when their presence in the tree rests only
   * on an unevidenced source. Undefined for everyone standing on real evidence.
   */
  unverified?: string;
  /** The parent link itself rests only on untrusted sources. */
  parentsUnverified?: boolean;
  /** At least one sentence of the biography rests only on untrusted sources. */
  unverifiedProse?: boolean;
  /** Ids of every union this person appears in, drawn or not. */
  unions: string[];
  /** Set when this person has an ancestry chart of their own. */
  chartUrl?: string;
  tags: PersonTag[];
}

export interface EventOut {
  date?: string;
  place?: string;
  cause?: string;
  note?: string;
  /**
   * Every source this fact cites sits in an untrusted tier, so the date is
   * drawn marked. A fact citing nothing at all is not marked — silence is not
   * the same claim as "an unevidenced tree says so".
   */
  unverified?: boolean;
}

/**
 * One couple box on the chart. Every ancestral slot gets a box, so either or
 * both sides may be unknown and the chart keeps its pedigree shape.
 */
export interface CoupleNode {
  /** Ahnentafel id of the father's slot, e.g. "ahn4". */
  id: string;
  /** Standard ancestor numbering: subject is 1, father 2n, mother 2n+1. */
  ahnentafel: { father: number; mother: number };
  father: string | null;
  mother: string | null;
  union: string | null;
  /** The child through whom this couple enters the tree; null if that child is unknown too. */
  childOf: string | null;
  confidence: Confidence;
  note?: string;
  /** Nothing known and nothing to say: a structural filler, not clickable. */
  placeholder: boolean;
  /** Id of the panel that continues this couple's line, if there is one. */
  expandsTo: string | null;
  /** Proposed but undrawn occupants of the two slots. */
  candidates: { father: Candidate[]; mother: Candidate[] };
}

/**
 * One screenful of the chart. A panel stops once a row reaches four boxes;
 * going further is a matter of expanding one of those four into its own panel.
 */
export interface Panel {
  id: string;
  title: string;
  subtitle: string;
  generations: Generation[];
  /** Panels reachable from this panel's last row. */
  children: string[];
  parent: string | null;
}

export interface Generation {
  depth: number;
  label: string;
  nodes: CoupleNode[];
}

export interface ChartData {
  /** The person this tree is rooted at and named after. */
  root: { id: string; name: string; dates: string; relation?: string };
  /** Flat list, root panel first, then its descendants depth-first. */
  panels: Panel[];
  people: Record<string, PersonOut>;
  unions: Record<string, Union>;
  sources: Record<string, Source>;
  /** Only the tags actually used on this chart, in the order tags.json lists them. */
  tags: Record<string, Tag>;
  /** Which parts of the legend this chart needs, so it explains only what it shows. */
  showsUnverified: { facts: boolean; people: boolean; prose: boolean };
}

/**
 * The lookups `PersonBio` needs to render one person, independent of any chart —
 * so a person or pair page (or the popup) can reuse the same component.
 * `ChartData` is a superset of this (bar the `subjectId` vs `root.id` shape).
 */
export interface BioContext {
  people: Record<string, PersonOut>;
  unions: Record<string, Union>;
  sources: Record<string, Source>;
  tags: Record<string, Tag>;
  /** The page's own subject — only their marriages link out to other charts. */
  subjectId: string;
}
