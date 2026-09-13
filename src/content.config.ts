import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Genealogical dates are frequently approximate ("c.1830", "1993/94"), so they
 * are stored as free text. YAML silently parses an unquoted `1856-08-04` into a
 * Date, so accept both shapes and normalise to a string.
 */
const dateText = z
  .union([z.string(), z.date().transform((d) => d.toISOString().slice(0, 10))])
  .optional();

const event = z
  .object({
    date: dateText,
    place: z.string().optional(),
    cause: z.string().optional(),
    note: z.string().optional(),
    citations: z.array(z.string()).default([]),
  })
  .optional();

/** How well evidenced a link is. Rendered as a dashed border on the chart. */
const confidence = z.enum(['documented', 'probable', 'unconfirmed']);

/**
 * A named person proposed for an unfilled parent slot. Candidates are
 * deliberately kept out of the tree itself — they show in the biography panel
 * as hypotheses, so a working theory never hardens into a drawn line.
 */
const candidate = z.object({
  name: z.string(),
  /** Which slot this candidate is proposed for. */
  parent: z.enum(['father', 'mother']),
  /** Optional link to a full person file, when one is warranted. */
  person: z.string().optional(),
  status: z.enum(['proposed', 'probable', 'weakened', 'eliminated']).default('proposed'),
  note: z.string().optional(),
  citations: z.array(z.string()).default([]),
});

/**
 * A tidbit: a shared category that colours the marker, plus an optional note
 * saying what it means for this particular person.
 */
const tagRef = z
  .union([z.string(), z.object({ tag: z.string(), note: z.string().optional() })])
  .transform((v) => (typeof v === 'string' ? { tag: v, note: undefined } : v));

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/people' }),
  schema: z.object({
    given: z.string(),
    surname: z.string(),
    aka: z.string().optional(),
    sex: z.enum(['M', 'F', '?']).default('?'),
    occupation: z.string().optional(),
    birth: event,
    death: event,
    burial: event,
    /** null means genuinely unrecorded, not merely "not entered yet". */
    parents: z
      .object({
        father: z.string().nullable().default(null),
        mother: z.string().nullable().default(null),
        confidence: confidence.default('documented'),
        note: z.string().optional(),
        candidates: z.array(candidate).default([]),
        citations: z.array(z.string()).default([]),
      })
      .optional(),
    notes: z.array(z.string()).default([]),
    tags: z.array(tagRef).default([]),
    /**
     * Set on a person whose presence in the tree rests only on an untrusted
     * source — a user-submitted tree with nothing attached. The text is the
     * reason, shown as a banner on their record. Omit it for anyone standing
     * on evidence that was actually examined.
     */
    unverified: z.string().optional(),
  }),
});

export const collections = { people };
