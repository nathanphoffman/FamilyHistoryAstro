import type { APIRoute, GetStaticPaths } from 'astro';
import { buildPair, pairChildren } from '../../lib/data';

export const getStaticPaths: GetStaticPaths = async () => {
  return (await pairChildren()).map((id) => ({ params: { parentsOfChildId: id } }));
};

/**
 * The JSON sibling of `pairs/[parentsOfChildId].astro`, fetched by `BioPopup`
 * and rendered client-side through the same `PersonBio` component (twice —
 * father and mother) the static page uses server-side.
 */
export const GET: APIRoute = async ({ params }) => {
  const data = await buildPair(params.parentsOfChildId!);
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
  });
};
