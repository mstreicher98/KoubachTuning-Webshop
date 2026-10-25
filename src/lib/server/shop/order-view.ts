import { fail } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import type { Locale } from '$lib/shop-types';
import { db } from '../db';
import { messages, orders, type Order } from '../db/schema';
import { teamNoticeMail } from '../emails';
import { notifyTeam } from '../notify';
import { getSettings } from '../settings';
import { orderDetails, paymentLabel } from './orders';

/**
 * Bestellansicht für Kunden – über den Link aus der Mail (/bestellung/<token>)
 * oder im Kundenkonto. Enthält Rechnungen, Sendungsverfolgung und Nachrichten.
 */

export async function orderByToken(token: string) {
	if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
	return db.select().from(orders).where(eq(orders.token, token)).get();
}

export async function customerOrderView(order: Order, locale: Locale) {
	const s = await getSettings();
	const d = await orderDetails(order.id);
	// Nachrichten des Teams gelten als gelesen, sobald der Kunde die Seite öffnet
	await db
		.update(messages)
		.set({ readByCustomerAt: new Date() })
		.where(and(eq(messages.orderId, order.id), eq(messages.author, 'team'), isNull(messages.readByCustomerAt)));
	const openPayment = d.payments.find((p) => p.status === 'offen');
	return {
		order: {
			number: order.number,
			token: order.token,
			createdAt: order.createdAt,
			status: order.status,
			paymentStatus: order.paymentStatus,
			paymentMethod: order.paymentMethod,
			paymentLabel: paymentLabel(order.paymentMethod, locale),
			email: order.email,
			billing: order.billingAddress,
			shipping: order.shippingAddress,
			shippingMethod: order.shippingMethod,
			subtotal: order.subtotal,
			discountTotal: order.discountTotal,
			discountCode: order.discountCode,
			shippingTotal: order.shippingTotal,
			taxTotal: order.taxTotal,
			taxCase: order.taxCase,
			taxRate: order.taxRate,
			total: order.total,
			giftCardTotal: order.giftCardTotal,
			amountDue: order.amountDue,
			trackingNumber: order.trackingNumber,
			trackingCarrier: order.trackingCarrier,
			trackingUrl: order.trackingUrl
		},
		items: d.items.map((i) => ({ id: i.id, title: i.title, variantTitle: i.variantTitle, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal, marginScheme: i.marginScheme, config: i.config, kind: i.kind })),
		payments: d.payments.map((p) => ({ id: p.id, purpose: p.purpose, method: p.method, amount: p.amount, status: p.status, token: p.token, paidAt: p.paidAt })),
		openPayment: openPayment ? { token: openPayment.token, amount: openPayment.amount, method: openPayment.method, purpose: openPayment.purpose } : null,
		invoices: d.invoices.map((inv) => ({ id: inv.id, number: inv.number, kind: inv.kind, total: inv.total, issuedAt: inv.issuedAt })),
		messages: d.messages.map((m) => ({ id: m.id, author: m.author, body: m.body, createdAt: m.createdAt, files: m.fileIds.map((id) => d.files[id]).filter(Boolean) })),
		files: Object.fromEntries(Object.values(d.files).map((f) => [f.id, { key: f.key, name: f.name }])),
		bank: order.paymentMethod === 'ueberweisung' ? { name: s.company.name, iban: s.company.iban, bic: s.company.bic, days: s.orders.transferDays } : null
	};
}

/** Aktionen, die Kunde und Kundenkonto gleich nutzen */
export async function customerOrderAction(order: Order, form: FormData, locale: Locale, cartId: string | null) {
	const L = (de: string, en: string) => (locale === 'en' ? en : de);
	const action = String(form.get('aktion') ?? '');
	if (order.status === 'storniert') return fail(400, { error: L('Diese Bestellung ist storniert.', 'This order has been cancelled.') });

	if (action === 'nachricht') {
		const body = String(form.get('text') ?? '')
			.trim()
			.slice(0, 4000);
		if (!body) return fail(400, { error: L('Bitte eine Nachricht eingeben.', 'Please enter a message.') });
		const wanted = String(form.get('dateien') ?? '')
			.split(',')
			.map(Number)
			.filter((n) => n > 0)
			.slice(0, 10);
		// Hochgeladene Dateien gehören ab jetzt zur Bestellung
		const { attachUploads } = await import('./uploads');
		const fileIds = await attachUploads(wanted, order.id, cartId);
		await db.insert(messages).values({ orderId: order.id, author: 'kunde', body, fileIds });
		void notifyTeam(
			teamNoticeMail(`Nachricht zu Bestellung ${order.number}`, body, `/admin/bestellungen/${order.id}`),
			{ title: `Nachricht · ${order.number}`, body: body.slice(0, 120), url: `/admin/bestellungen/${order.id}` },
			order.id
		);
		return { ok: L('Nachricht gesendet.', 'Message sent.') };
	}

	return fail(400);
}
