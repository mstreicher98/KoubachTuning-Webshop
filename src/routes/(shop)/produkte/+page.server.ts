import { productListing } from '$lib/server/shop/listing';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	return { listing: await productListing({ url, locale: locals.locale, customer: locals.customer }) };
};
