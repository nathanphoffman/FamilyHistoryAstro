import { getCollection, type CollectionEntry } from 'astro:content';
import sourcesJson from '../data/sources.json';
import unionsJson from '../data/unions.json';
import treesJson from '../data/trees.json';
import configJson from '../data/config.json';
import tagsJson from '../data/tags.json';
import { relationshipTo, possessive } from './relationship';
import { renderBio, mergeCitations } from './markdown';
import { lifespan, formatDate } from './format';
import { UNTRUSTED } from './types';
import type {
  BioContext, Candidate, ChartData, Confidence, CoupleNode, EventOut, Generation, Panel,
  PersonOut, PersonTag, ProseBlock, Source, Tag, Union,
} from './types';

const sources = sourcesJson as Record<string, Source>;
const unions = unionsJson as Union[];

/** People with a chart of their own, so mentions of them can link to it. */
const tags = tagsJson as Record<string, Tag>;

// Root-absolute so the link resolves the same from a chart page, a person page,
// or a pair page.
const chartUrls = new Map(treesJson.map((s) => [s.person, `/trees/${s.person}.html`]));

const GENERATION_LABELS = [
  'Subject',
  'Parents',
  'Grandparents',
  'Great-Grandparents',
];

function generationLabel(depth: number): string {
  if (depth < GENERATION_LABELS.length) return GENERATION_LABELS[depth]!;
  return `${depth - 2}× Great-Grandparents`;
}

type Person = CollectionEntry<'people'>;

/**
 * Describes a subject by their relationship to one anchor person — "Colleen's
 * Mother" — so the charts read as a family rather than as separate trees.
 */
async function relationLabel(byId: Map<string, Person>, targetId: string): Promise<string | undefined> {
  const referenceId = configJson.referencePerson;
  const reference = referenceId ? byId.get(referenceId) : undefined;
  if (!reference) return undefined;

  const relation = relationshipTo(reference.id, targetId, (id) => {
    const parents = byId.get(id)?.data.parents;
    return parents ? { father: parents.father, mother: parents.mother } : null;
  });

  return relation ? `${possessive(reference.data.given)} ${relation}` : undefined;
}

/** Trees with their titles and relationship labels, for the index page. */
export async function treeCards() {
  const all = await getCollection('people');
  const byId = new Map(all.map((p) => [p.id, p]));
  return Promise.all(
    treesJson.map(async (s) => ({
      ...s,
      relation: await relationLabel(byId, s.person),
    })),
  );
}

function fullName(p: Person): string {
  return `${p.data.given} ${p.data.surname}`.trim();
}

/**
 * True when every source behind a fact sits in an untrusted tier — an
 * unevidenced tree or unconfirmed family notes. A fact that cites nothing is
 * left alone: most of this tree predates the convention, and marking all of it
 * would drown out the claims that genuinely rest on an untrusted source.
 */
function factUnverified(citations: string[] = []): boolean {
  if (citations.length === 0) return false;
  return citations.every(untrusted);
}

/** Whether one source, on its own, can establish nothing. */
function untrusted(id: string): boolean {
  const source = sources[id];
  return source ? UNTRUSTED.includes(source.reliability) : false;
}

/** Copies an event through, flagging it when its sources are all untrusted. */
function toEventOut(event?: { citations?: string[] } & EventOut): EventOut | undefined {
  if (!event) return undefined;
  const unverified = factUnverified(event.citations);
  return unverified ? { ...event, unverified } : event;
}

/** Finds the union joining exactly these two people, in either spouse order. */
function findUnion(a: string | null, b: string | null): Union | null {
  if (!a || !b) return null;
  return unions.find(
    (u) => (u.spouses[0] === a && u.spouses[1] === b) || (u.spouses[0] === b && u.spouses[1] === a),
  ) ?? null;
}

function toPersonOut(
  p: Person,
  bioBlocks: ProseBlock[],
  proseCitations: string[],
  unverifiedProse: boolean,
): PersonOut {
  const { data } = p;
  return {
    id: p.id,
    name: fullName(p),
    aka: data.aka,
    dates: lifespan(data.birth?.date, data.death?.date),
    occupation: data.occupation,
    birth: toEventOut(data.birth),
    death: toEventOut(data.death),
    burial: toEventOut(data.burial),
    bioBlocks,
    notes: data.notes,
    tags: data.tags as PersonTag[],
    parentNote: data.parents?.note,
    confidence: data.parents?.confidence ?? 'documented',
    unverified: data.unverified,
    parentsUnverified: factUnverified(data.parents?.citations) || undefined,
    unverifiedProse: unverifiedProse || undefined,
    unions: [],
    chartUrl: chartUrls.get(p.id),
    citations: mergeCitations(
      proseCitations,
      data.birth?.citations ?? [],
      data.death?.citations ?? [],
      data.burial?.citations ?? [],
      data.parents?.citations ?? [],
    ),
  };
}

/**
 * Resolves people on demand into `PersonOut` records, rendering each biography
 * once and accumulating the sources and tags they reference. Shared by the
 * chart, person, and pair builders.
 */
function createResolver(byId: Map<string, Person>) {
  const sourceIds = new Set(Object.keys(sources));
  const people: Record<string, PersonOut> = {};
  const usedSources = new Set<string>();
  const usedTags = new Set<string>();

  const include = (id: string): PersonOut => {
    const existing = people[id];
    if (existing) return existing;
    const person = byId.get(id);
    if (!person) throw new Error(`Reference to unknown person "${id}"`);
    const { blocks, citations, hasUnverifiedProse } = renderBio(
      person.body ?? '', sourceIds, id, untrusted,
    );
    const out = toPersonOut(person, blocks, citations, hasUnverifiedProse);
    people[id] = out;
    for (const c of out.citations) usedSources.add(c);
    for (const t of out.tags) {
      if (!tags[t.tag]) throw new Error(`${id}: unknown tag "${t.tag}"`);
      usedTags.add(t.tag);
    }
    return out;
  };

  return { include, people, usedSources, usedTags };
}

/** Narrows the used-source and used-tag sets to their records; tags keep file order. */
function collectRefs(usedSources: Set<string>, usedTags: Set<string>) {
  const outTags: Record<string, Tag> = {};
  for (const id of Object.keys(tags)) {
    if (usedTags.has(id)) outTags[id] = tags[id]!;
  }
  const outSources: Record<string, Source> = {};
  for (const id of usedSources) outSources[id] = sources[id]!;
  return { sources: outSources, tags: outTags };
}

/** Pulls in every union a person appears in, naming their spouses. */
function attachUnions(
  personId: string,
  include: (id: string) => PersonOut,
  people: Record<string, PersonOut>,
  usedSources: Set<string>,
  into: Record<string, Union>,
): string[] {
  const ids: string[] = [];
  for (const union of unions) {
    if (!union.spouses.includes(personId)) continue;
    into[union.id] = union;
    ids.push(union.id);
    for (const c of union.citations) usedSources.add(c);
    for (const spouse of union.spouses) {
      if (!people[spouse]) include(spouse);
    }
  }
  return ids;
}

/** A position in the pedigree, whether or not we know who fills it. */
interface Slot {
  ahn: number;
  id: string | null;
}

/** Guards against a person being recorded as their own ancestor. */
const MAX_DEPTH = 15;

/** A row wider than this is hard to read, so the chart breaks into panels. */
const MAX_ROW = 4;

/**
 * Walks up from the tree's root person, emitting a couple box for every
 * ancestral slot so each generation keeps its full pedigree width. Rather than
 * running the whole tree into one ever-widening chart, the walk stops each
 * time a row reaches four boxes; each of those four then becomes the root of
 * its own panel, which the reader expands on demand.
 */
export async function buildChart(treeId: string): Promise<ChartData> {
  const all = await getCollection('people');
  const byId = new Map(all.map((p) => [p.id, p]));

  const root = byId.get(treeId);
  if (!root) throw new Error(`Unknown tree "${treeId}"`);

  const { include, people, usedSources, usedTags } = createResolver(byId);
  const usedUnions: Record<string, Union> = {};

  /** Turns one row of slots into couple boxes, and reports the row above it. */
  function step(frontier: Slot[]): { nodes: CoupleNode[]; next: Slot[] } {
    const nodes: CoupleNode[] = [];
    const next: Slot[] = [];

    for (const slot of frontier) {
      const child = slot.id ? byId.get(slot.id) : undefined;
      const parents = child?.data.parents;
      const father = parents?.father ?? null;
      const mother = parents?.mother ?? null;
      const note = parents?.note;

      if (father) include(father);
      if (mother) include(mother);

      // Candidates stay out of the tree, but their records travel with the
      // chart so the biography panel can show what is being proposed.
      const candidates = (parents?.candidates ?? []) as Candidate[];
      for (const c of candidates) {
        if (c.person) include(c.person);
        for (const id of c.citations) usedSources.add(id);
      }

      const fatherAhn = slot.ahn * 2;
      const motherAhn = slot.ahn * 2 + 1;
      next.push({ ahn: fatherAhn, id: father }, { ahn: motherAhn, id: mother });

      const union = findUnion(father, mother);
      if (union) {
        usedUnions[union.id] = union;
        for (const c of union.citations) usedSources.add(c);
      }

      nodes.push({
        id: `ahn${fatherAhn}`,
        ahnentafel: { father: fatherAhn, mother: motherAhn },
        father,
        mother,
        union: union?.id ?? null,
        childOf: slot.id,
        confidence: (parents?.confidence ?? 'documented') as Confidence,
        note,
        placeholder: !father && !mother && !note && candidates.length === 0,
        expandsTo: null,
        candidates: {
          father: candidates.filter((c) => c.parent === 'father'),
          mother: candidates.filter((c) => c.parent === 'mother'),
        },
      });
    }

    return { nodes, next };
  }

  function coupleTitle(node: CoupleNode): string {
    const father = node.father ? people[node.father]?.name : null;
    const mother = node.mother ? people[node.mother]?.name : null;
    return `${father ?? 'Unknown'} & ${mother ?? 'Unknown'}`;
  }

  const panels: Panel[] = [];

  /**
   * Returns null when there is nothing above this root worth drawing, which is
   * also how the caller knows not to offer an expand arrow.
   */
  function buildPanel(
    id: string,
    title: string,
    subtitle: string,
    root: Slot[],
    startDepth: number,
    parent: string | null,
  ): Panel | null {
    const generations: Generation[] = [];
    let frontier = root;
    let depth = startDepth;
    let leaves: CoupleNode[] = [];

    while (depth <= MAX_DEPTH) {
      const { nodes, next } = step(frontier);

      // Once a row holds neither a name nor an explanation, the rows above it
      // would be empty too.
      const worthShowing = next.some((s) => s.id !== null) || nodes.some((n) => n.note);
      if (!worthShowing) break;

      generations.push({ depth, label: generationLabel(depth), nodes });
      leaves = nodes;
      frontier = next;
      depth++;

      if (nodes.length >= MAX_ROW) break;
    }

    if (depth > MAX_DEPTH) {
      throw new Error(
        `Ancestry of "${treeId}" exceeds ${MAX_DEPTH} generations — check for a parent loop.`,
      );
    }

    if (generations.length === 0) return null;

    const panel: Panel = { id, title, subtitle, generations, children: [], parent };
    panels.push(panel);

    // Only a row that hit the width cap continues; a short row means the line
    // simply ran out.
    if (leaves.length >= MAX_ROW) {
      const leafDepth = depth - 1;
      for (const node of leaves) {
        const child = buildPanel(
          `panel-${node.id}`,
          coupleTitle(node),
          `Generation ${leafDepth} — ${generationLabel(leafDepth)}`,
          [
            { ahn: node.ahnentafel.father, id: node.father },
            { ahn: node.ahnentafel.mother, id: node.mother },
          ],
          depth,
          id,
        );
        if (child) {
          node.expandsTo = child.id;
          panel.children.push(child.id);
        }
      }
    }

    return panel;
  }

  include(root.id);
  buildPanel(
    'panel-root',
    fullName(root),
    people[root.id]!.dates,
    [{ ahn: 1, id: root.id }],
    1,
    null,
  );

  // A person's other marriages are worth showing even when they sit outside the
  // ancestral line — a second husband explains a household the chart cannot.
  for (const id of Object.keys(people)) {
    for (const union of unions) {
      if (!union.spouses.includes(id)) continue;
      people[id]!.unions.push(union.id);
      usedUnions[union.id] = union;
      for (const c of union.citations) usedSources.add(c);
      // Pull in the spouse so the marriage can be named, without walking their
      // ancestry as well.
      for (const spouse of union.spouses) {
        if (!people[spouse]) include(spouse);
      }
    }
  }

  // Keep only the sources and tags actually used, so the chart stays honest
  // about what the page shows. Tag order follows tags.json.
  const { sources: shipped, tags: shippedTags } = collectRefs(usedSources, usedTags);

  // The legend explains only what this chart actually shows.
  const shown = Object.values(people);
  const showsUnverified = {
    facts: shown.some(
      (p) => p.birth?.unverified || p.death?.unverified || p.burial?.unverified || p.parentsUnverified,
    ),
    people: shown.some((p) => p.unverified),
    prose: shown.some((p) => p.unverifiedProse),
  };

  return {
    root: {
      id: root.id,
      name: fullName(root),
      dates: people[root.id]!.dates,
      relation: await relationLabel(byId, root.id),
    },
    panels,
    people,
    unions: usedUnions,
    sources: shipped,
    tags: shippedTags,
    showsUnverified,
  };
}

/** Ids of every person file — one standalone biography page each. */
export async function allPeople(): Promise<string[]> {
  const all = await getCollection('people');
  return all.map((p) => p.id);
}

/**
 * Ids of every person who has a recorded parent slot. Each gets a pair page
 * ("the parents of X") — the same content the chart shows when their box is
 * clicked, and the no-JS destination of that box.
 */
export async function pairChildren(): Promise<string[]> {
  const all = await getCollection('people');
  return all
    .filter((p) => {
      const par = p.data.parents;
      return !!par && (!!par.father || !!par.mother || !!par.note || par.candidates.length > 0);
    })
    .map((p) => p.id);
}

/** One person's record plus the context `PersonBio` needs to render it alone. */
export async function buildPerson(
  personId: string,
): Promise<{ person: PersonOut; ctx: BioContext }> {
  const all = await getCollection('people');
  const byId = new Map(all.map((p) => [p.id, p]));
  if (!byId.has(personId)) throw new Error(`Unknown person "${personId}"`);

  const { include, people, usedSources, usedTags } = createResolver(byId);
  const person = include(personId);

  const usedUnions: Record<string, Union> = {};
  person.unions = attachUnions(personId, include, people, usedSources, usedUnions);

  const { sources: ctxSources, tags: ctxTags } = collectRefs(usedSources, usedTags);
  return {
    person,
    ctx: { people, unions: usedUnions, sources: ctxSources, tags: ctxTags, subjectId: personId },
  };
}

/** The one-line summary shown above a pair's two panels. */
function unionSummary(
  parents: { confidence?: Confidence; note?: string; citations?: string[] } | undefined,
  joining: Union | null,
): string[] {
  const bits: string[] = [];
  if (joining) {
    const when = [formatDate(joining.date), joining.place].filter(Boolean).join(', ');
    bits.push(`${joining.type === 'marriage' ? 'Married' : 'Partnered'}${when ? ` ${when}` : ''}`);
    if (joining.note) bits.push(joining.note);
  }
  const confidence = parents?.confidence ?? 'documented';
  if (confidence !== 'documented') bits.push(`Parentage ${confidence}`);
  if (factUnverified(parents?.citations)) {
    bits.push('Parent link not verified against an original record');
  }
  if (parents?.note) bits.push(parents.note);
  return bits;
}

export interface PairData {
  title: string;
  bits: string[];
  father: PersonOut | null;
  mother: PersonOut | null;
  candidates: { father: Candidate[]; mother: Candidate[] };
  note?: string;
  union: string | null;
  ctx: BioContext;
}

/** The "parents of <child>" pair, as its own page and as the popup's content. */
export async function buildPair(childId: string): Promise<PairData> {
  const all = await getCollection('people');
  const byId = new Map(all.map((p) => [p.id, p]));
  const child = byId.get(childId);
  if (!child) throw new Error(`Unknown person "${childId}"`);

  const parents = child.data.parents;
  const fatherId = parents?.father ?? null;
  const motherId = parents?.mother ?? null;

  const { include, people, usedSources, usedTags } = createResolver(byId);
  const father = fatherId ? include(fatherId) : null;
  const mother = motherId ? include(motherId) : null;

  const allCandidates = (parents?.candidates ?? []) as Candidate[];
  for (const c of allCandidates) {
    if (c.person) include(c.person);
    for (const id of c.citations) usedSources.add(id);
  }

  const usedUnions: Record<string, Union> = {};
  for (const p of [father, mother]) {
    if (p) p.unions = attachUnions(p.id, include, people, usedSources, usedUnions);
  }

  const joining = findUnion(fatherId, motherId);
  if (joining) {
    usedUnions[joining.id] = joining;
    for (const c of joining.citations) usedSources.add(c);
  }

  const { sources: ctxSources, tags: ctxTags } = collectRefs(usedSources, usedTags);
  return {
    title: `${father?.name ?? 'Unknown'} & ${mother?.name ?? 'Unknown'}`,
    bits: unionSummary(parents, joining),
    father,
    mother,
    candidates: {
      father: allCandidates.filter((c) => c.parent === 'father'),
      mother: allCandidates.filter((c) => c.parent === 'mother'),
    },
    note: parents?.note,
    union: joining?.id ?? null,
    ctx: { people, unions: usedUnions, sources: ctxSources, tags: ctxTags, subjectId: childId },
  };
}
