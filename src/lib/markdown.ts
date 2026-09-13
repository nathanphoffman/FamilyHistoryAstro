import { marked } from 'marked';
import type { BioContext, ProseBlock, ProseInline, Source } from './types';

const FOOTNOTE = /\[\^([a-z0-9_]+)\]/gi;
/** One or more footnote markers run together, as they trail a sentence. */
const TRAILING_FOOTNOTES = /^(?:\[\^[a-z0-9_]+\])+/i;

/**
 * Private-use-area markers spliced into the raw markdown before it reaches
 * `marked`, so an unverified span or a citation survives tokenizing as plain
 * text and can be pulled back out as structured data afterward — the prose
 * never becomes an HTML string. A citation carries its source id and index
 * inline (`id:index`) since both are already known at splice time.
 */
const UNVERIFIED_START = '\uE000';
const UNVERIFIED_END = '\uE001';
const CITE_START = '\uE002';
const CITE_END = '\uE003';
const SENTINEL = new RegExp(
  `${UNVERIFIED_START}|${UNVERIFIED_END}|${CITE_START}([a-z0-9_]+):(\\d+)${CITE_END}`,
  'g',
);

export interface RenderedBio {
  blocks: ProseBlock[];
  /** Source ids referenced from the prose, in first-appearance order. */
  citations: string[];
  /** A sentence in the prose rests only on untrusted sources. */
  hasUnverifiedProse: boolean;
}

/**
 * Words that end in a full stop without ending a sentence. Single capitals are
 * handled separately, so "Rev. A. E. Ackerman" and "J. Q. A. Stovall" stay in
 * one piece.
 */
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'rev', 'st', 'jr', 'sr', 'lt', 'col', 'capt', 'gen',
  'hon', 'esq', 'no', 'vs', 'etc', 'co', 'inc', 'ct', 'ave', 'rd', 'c', 'ca',
  'aft', 'bef', 'approx', 'fl', 'd', 'b', 'm',
]);

function endsSentence(text: string): boolean {
  const word = /(\S+)[.!?]$/.exec(text)?.[1];
  if (!word) return false;
  if (/^[A-Z]$/.test(word)) return false; // an initial, as in "A. E. Ackerman"
  return !ABBREVIATIONS.has(word.toLowerCase().replace(/[^a-z]/g, ''));
}

interface Sentence {
  /** Where the prose itself ends, before any footnote markers trailing it. */
  start: number;
  textEnd: number;
  /** Where the sentence ends including those markers. */
  end: number;
}

/**
 * Splits one block of markdown into sentences. Footnote markers sit after the
 * full stop they belong to ("...in 1843.[^tree]"), so a sentence runs through
 * any markers trailing it, and the prose it covers stops before them.
 */
function sentences(block: string): Sentence[] {
  const found: Sentence[] = [];
  let start = 0;
  let i = 0;

  while (i < block.length) {
    if (!'.!?'.includes(block[i]!)) {
      i++;
      continue;
    }
    let textEnd = i + 1;
    while (textEnd < block.length && '"\'’”)]'.includes(block[textEnd]!)) textEnd++;

    let end = textEnd;
    const trailing = TRAILING_FOOTNOTES.exec(block.slice(end));
    if (trailing) end += trailing[0].length;

    const closes = end >= block.length || /\s/.test(block[end]!);
    if (!closes || !endsSentence(block.slice(start, i + 1))) {
      i++;
      continue;
    }

    found.push({ start, textEnd, end });
    while (end < block.length && /\s/.test(block[end]!)) end++;
    start = end;
    i = end;
  }

  if (start < block.length) {
    found.push({ start, textEnd: block.length, end: block.length });
  }
  return found;
}

/**
 * Underlines the sentences that rest only on untrusted sources, so a claim
 * taken from an unevidenced tree or unconfirmed family notes is visible as such
 * while it is being read.
 * A sentence citing nothing is left alone, and so is one that cites anything
 * better — the test is that every source behind it is untrusted, which is the
 * same rule the dates use.
 */
function markUnverified(markdown: string, isUntrusted: (id: string) => boolean): {
  text: string;
  marked: boolean;
} {
  let touched = false;

  const blocks = markdown.split(/\n\n/).map((block) => {
    // Headings and list markers start their own sentence; leaving them inside
    // one would wrap the bullet along with the claim.
    if (/^\s*#/.test(block)) return block;

    let out = '';
    let cursor = 0;

    for (const s of sentences(block)) {
      const body = block.slice(s.start, s.textEnd);
      const cited = [...block.slice(s.start, s.end).matchAll(FOOTNOTE)].map((m) => m[1]!);

      out += block.slice(cursor, s.start);
      if (cited.length > 0 && cited.every(isUntrusted)) {
        touched = true;
        out += `${UNVERIFIED_START}${body}${UNVERIFIED_END}`;
      } else {
        out += body;
      }
      out += block.slice(s.textEnd, s.end);
      cursor = s.end;
    }

    return out + block.slice(cursor);
  });

  return { text: blocks.join('\n\n'), marked: touched };
}

/** A flattened, linear view of an inline token tree — see `flattenInline`. */
type InlineEvent =
  | { kind: 'text'; value: string }
  | { kind: 'citation'; sourceId: string; index: number }
  | { kind: 'enter' | 'exit'; node: 'unverified' | 'bold' | 'italic' };

/** Splits one leaf run of text on the sentinels spliced in above. */
function flattenLeaf(text: string, into: InlineEvent[]): void {
  let cursor = 0;
  for (const m of text.matchAll(SENTINEL)) {
    if (m.index! > cursor) into.push({ kind: 'text', value: text.slice(cursor, m.index) });
    if (m[0] === UNVERIFIED_START) into.push({ kind: 'enter', node: 'unverified' });
    else if (m[0] === UNVERIFIED_END) into.push({ kind: 'exit', node: 'unverified' });
    else into.push({ kind: 'citation', sourceId: m[1]!, index: Number(m[2]) });
    cursor = m.index! + m[0].length;
  }
  if (cursor < text.length) into.push({ kind: 'text', value: text.slice(cursor) });
}

/**
 * Walks one block's inline tokens depth-first into a flat event stream, so a
 * sentinel pair can be reassembled into a wrapper node even when it crosses a
 * `**bold**`/`*italic*` boundary rather than sitting cleanly inside one.
 * `marked` wraps a tight list item's content in its own `text` token (with a
 * nested `.tokens`) rather than a `paragraph` — recursing into any `text`
 * token that itself carries `.tokens` unwraps that case for free.
 */
function flattenInline(tokens: any[], into: InlineEvent[] = []): InlineEvent[] {
  for (const t of tokens) {
    if (t.type === 'text' && Array.isArray(t.tokens)) {
      flattenInline(t.tokens, into);
    } else if (t.type === 'strong') {
      into.push({ kind: 'enter', node: 'bold' });
      flattenInline(t.tokens ?? [], into);
      into.push({ kind: 'exit', node: 'bold' });
    } else if (t.type === 'em') {
      into.push({ kind: 'enter', node: 'italic' });
      flattenInline(t.tokens ?? [], into);
      into.push({ kind: 'exit', node: 'italic' });
    } else if (typeof t.text === 'string') {
      // Any other inline token (codespan, br, link, …) — none appear in the
      // data today, but fall back to its plain text rather than dropping it.
      flattenLeaf(t.text, into);
    }
  }
  return into;
}

/** Rebuilds nested `ProseInline` nodes from a flat event stream. */
function buildInline(events: InlineEvent[]): ProseInline[] {
  const root: ProseInline[] = [];
  const stack: { node: 'unverified' | 'bold' | 'italic'; children: ProseInline[] }[] = [];
  const top = () => (stack.length ? stack[stack.length - 1]!.children : root);
  const close = (frame: { node: 'unverified' | 'bold' | 'italic'; children: ProseInline[] }) => {
    if (frame.children.length === 0) return;
    top().push(
      frame.node === 'unverified'
        ? { type: 'unverified', children: frame.children }
        : { type: frame.node, children: frame.children },
    );
  };

  for (const e of events) {
    if (e.kind === 'text') {
      if (e.value) top().push({ type: 'text', text: e.value });
    } else if (e.kind === 'citation') {
      top().push({ type: 'citation', sourceId: e.sourceId, index: e.index });
    } else if (e.kind === 'enter') {
      stack.push({ node: e.node, children: [] });
    } else {
      // Closes its matching frame; a frame still open above it (a sentence
      // boundary landing inside a **bold** run) is closed early and reopened
      // empty, so the two spans end up adjacent rather than truly crossing —
      // the same shape the old <span>-in-raw-markdown approach produced.
      const depth = [...stack].reverse().findIndex((f) => f.node === e.node);
      if (depth === -1) continue;
      const at = stack.length - 1 - depth;
      const above = stack.splice(at);
      close(above.shift()!);
      for (const reopened of above) stack.push({ node: reopened.node, children: [] });
    }
  }
  while (stack.length) close(stack.pop()!);
  return root;
}

function blockChildren(tokens: any[]): ProseInline[] {
  return buildInline(flattenInline(tokens ?? []));
}

/** Converts `marked`'s block-level tokens into `ProseBlock[]`. */
function tokensToBlocks(tokens: any[]): ProseBlock[] {
  const blocks: ProseBlock[] = [];
  for (const t of tokens) {
    if (t.type === 'paragraph') {
      blocks.push({ type: 'paragraph', children: blockChildren(t.tokens) });
    } else if (t.type === 'heading') {
      blocks.push({ type: 'heading', depth: t.depth, children: blockChildren(t.tokens) });
    } else if (t.type === 'list') {
      blocks.push({
        type: 'list',
        ordered: !!t.ordered,
        items: t.items.map((item: any) => blockChildren(item.tokens)),
      });
    } else if (t.type !== 'space') {
      // No blockquotes/code fences/tables appear in the data today; treat
      // anything else as a paragraph of its own text rather than dropping it.
      blocks.push({ type: 'paragraph', children: blockChildren([{ type: 'text', text: t.text ?? t.raw }]) });
    }
  }
  return blocks;
}

/**
 * Renders a biography body to structured prose, turning `[^source_id]`
 * markers into `citation` nodes and collecting the ids they point at. An id
 * with no matching entry in sources.json is a build error rather than a
 * silent dangling footnote.
 */
export function renderBio(
  markdown: string,
  sourceIds: Set<string>,
  who: string,
  isUntrusted: (id: string) => boolean = () => false,
): RenderedBio {
  const citations: string[] = [];

  const { text, marked: hasUnverifiedProse } = markUnverified(markdown, isUntrusted);

  const withMarkers = text.replace(FOOTNOTE, (_match, id: string) => {
    if (!sourceIds.has(id)) {
      throw new Error(`${who}: biography cites unknown source "${id}"`);
    }
    let index = citations.indexOf(id);
    if (index === -1) {
      citations.push(id);
      index = citations.length - 1;
    }
    return `${CITE_START}${id}:${index}${CITE_END}`;
  });

  const blocks = tokensToBlocks(marked.lexer(withMarkers));
  return { blocks, citations, hasUnverifiedProse };
}

/** Merges prose footnotes with the citations attached to structured facts. */
export function mergeCitations(...lists: string[][]): string[] {
  const seen: string[] = [];
  for (const list of lists) {
    for (const id of list) {
      if (!seen.includes(id)) seen.push(id);
    }
  }
  return seen;
}

/** Resolve citation ids to their sources, dropping any id with no match. */
export function resolveSources(
  ctx: Pick<BioContext, 'sources'>,
  ids: string[],
): (Source & { id: string })[] {
  return ids.flatMap((id) => {
    const source = ctx.sources[id];
    return source ? [{ ...source, id }] : [];
  });
}
