import { submitInquiry } from '$lib/server/inquiry';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const c = locals.customer;
	return { defaults: { name: c ? `${c.firstName} ${c.lastName}`.trim() : '', email: c?.email ?? '', phone: c?.phone ?? '' }, subject: url.searchParams.get('betreff') ?? '' };
};

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => submitInquiry(await request.formData(), { locale: locals.locale, clientAddress: getClientAddress() })
};
