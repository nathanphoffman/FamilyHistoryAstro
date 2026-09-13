import type { APIRoute, GetStaticPaths } from 'astro';
import { allPeople, buildPerson } from '../../lib/data';

export const getStaticPaths: GetStaticPaths = async () => {
  return (await allPeople()).map((id) => ({ params: { personId: id } }));
};

/**
 * The JSON sibling of `people/[personId].astro`, fetched by `BioPopup` and
 * rendered client-side through the exact same `PersonBio` component the
 * static page uses server-side — the two can never visually drift apart.
 */
export const GET: APIRoute = async ({ params }) => {
  const { person, ctx } = await buildPerson(params.personId!);
  return new Response(JSON.stringify({ person, ctx }), {
    headers: { 'content-type': 'application/json' },
  });
};
