import { error, fail, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { logAction } from '$lib/server/audit';
import { endAllCustomerSessions } from '$lib/server/customer-auth';
import { db } from '$lib/server/db';
import { addresses, customers, orders } from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { checked, requirePermission, str } from '$lib/server/guard';
import { checkVatId } from '$lib/server/vies';
import type { Actions, PageServerLoad } from './$types';

async function getCustomer(id: string) {
	const c = await db.select().from(customers).where(eq(customers.id, Number(id))).get();
	if (!c) error(404, 'Kunde nicht gefunden');
	return c;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requirePermission(locals, 'shop.manage');
	const c = await getCustomer(params.id);
	const [orderRows, addr] = await Promise.all([
		db
			.select({ id: orders.id, number: orders.number, createdAt: orders.createdAt, status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total })
			.from(orders)
			.where(eq(orders.customerId, c.id))
			.orderBy(desc(orders.id))
			.all(),
		db.select().from(addresses).where(eq(addresses.customerId, c.id)).all()
	]);
	const { passwordHash, ...safe } = c;
	return { customer: { ...safe, hasPassword: !!passwordHash }, orders: orderRows, addresses: addr };
};

export const actions: Actions = {
	speichern: async ({ locals, params, request }) => {
		const me = requirePermission(locals, 'shop.manage');
		const c = await getCustomer(params.id);
		const f = await request.formData();
		await db
			.update(customers)
			.set({
				firstName: str(f.get('vorname'), 80),
				lastName: str(f.get('nachname'), 80),
				phone: str(f.get('telefon'), 40),
				company: str(f.get('firma'), 120),
				vatId: str(f.get('uid'), 20).toUpperCase().replace(/\s/g, ''),
				internalNote: str(f.get('notiz'), 4000),
				active: checked(f.get('aktiv'))
			})
			.where(eq(customers.id, c.id));
		if (!checked(f.get('aktiv'))) await endAllCustomerSessions(c.id);
		await logAction(me.id, 'geändert', 'kunde', c.id, c.email);
		return { message: 'Gespeichert.' };
	},
	uid: async ({ locals, params }) => {
		requirePermission(locals, 'shop.manage');
		const c = await getCustomer(params.id);
		if (!c.vatId) return fail(400, { error: 'Keine UID hinterlegt.' });
		const valid = await checkVatId(c.vatId);
		if (valid === null) return fail(503, { error: 'VIES ist gerade nicht erreichbar. Bitte später erneut versuchen.' });
		await db.update(customers).set({ vatIdValid: valid, vatIdCheckedAt: new Date() }).where(eq(customers.id, c.id));
		return { message: valid ? 'UID ist gültig.' : 'UID ist laut VIES NICHT gültig.' };
	},
	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'shop.manage');
		const c = await getCustomer(params.id);
		// Bestellungen und Rechnungen bleiben (Aufbewahrungspflicht) – sie verlieren nur die Verknüpfung zum Konto
		await db.delete(customers).where(eq(customers.id, c.id));
		await logAction(me.id, 'gelöscht', 'kunde', c.id, c.email);
		setFlash(cookies, 'Kundenkonto gelöscht. Bestellungen und Rechnungen bleiben erhalten.');
		redirect(303, '/admin/kunden');
	}
};
