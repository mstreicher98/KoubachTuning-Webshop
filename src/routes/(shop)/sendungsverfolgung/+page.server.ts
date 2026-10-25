import { fail } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { isRateLimited, registerFailure } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { orders } from '$lib/server/db/schema';
import { str } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

/**
 * Sendungsverfolgung ohne Anmeldung: Bestellnummer plus E-Mail-Adresse oder nur die Sendungsnummer.
 * Gezeigt werden nur Status, Versanddienst und Link – keine Adressen oder Artikel.
 */

export const load: PageServerLoad = async ({ locals }) => ({ email: locals.customer?.email ?? '' });

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => {
		const L = (de: string, en: string) => (locals.locale === 'en' ? en : de);
		const f = await request.formData();
		const number = str(f.get('nummer'), 40).replace(/\s/g, '');
		const email = str(f.get('email'), 200).toLowerCase();
		const values = { number, email };
		if (!number) return fail(400, { values, error: L('Bitte Bestell- oder Sendungsnummer eingeben.', 'Please enter an order or tracking number.') });

		const key = `verfolgung:${getClientAddress()}`;
		if (isRateLimited(key, 20, 15 * 60_000)) return fail(429, { values, error: L('Zu viele Versuche. Bitte in ein paar Minuten erneut versuchen.', 'Too many attempts. Please try again in a few minutes.') });

		const cols = {
			number: orders.number,
			status: orders.status,
			paymentStatus: orders.paymentStatus,
			paymentMethod: orders.paymentMethod,
			shippingMethod: orders.shippingMethod,
			trackingCarrier: orders.trackingCarrier,
			trackingNumber: orders.trackingNumber,
			trackingUrl: orders.trackingUrl,
			shippedAt: orders.shippedAt,
			createdAt: orders.createdAt
		};
		const order = /^\d{4,8}$/.test(number)
			? email
				? await db
						.select(cols)
						.from(orders)
						.where(and(eq(orders.number, Number(number)), sql`lower(${orders.email}) = ${email}`))
						.get()
				: null
			: await db.select(cols).from(orders).where(eq(orders.trackingNumber, number)).get();

		if (!order) {
			registerFailure(key, 15 * 60_000);
			return fail(404, {
				values,
				error: /^\d{4,8}$/.test(number) && !email
					? L('Für die Bestellnummer brauchen wir auch die E-Mail-Adresse der Bestellung.', 'For an order number we also need the email address used for the order.')
					: L('Dazu haben wir nichts gefunden. Bitte Nummer und E-Mail-Adresse prüfen.', "We couldn't find anything. Please check the number and email address.")
			});
		}
		return { values, result: order };
	}
};
