import { asc, ne } from 'drizzle-orm';
import { pick } from '$lib/i18n.svelte';
import { db } from '$lib/server/db';
import { pages } from '$lib/server/db/schema';
import { getSettings, telHref, waHref } from '$lib/server/settings';
import { categoryTree } from '$lib/server/shop/catalog';
import { cartIdFrom, loadCart } from '$lib/server/shop/cart';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const locale = locals.locale;
	const s = await getSettings();
	const cartId = await cartIdFrom(cookies, false);
	const [menu, cart, footerPages] = await Promise.all([
		categoryTree(locale, true),
		loadCart(cartId, { customer: locals.customer, locale, settings: s }),
		db.select({ slug: pages.slug, title: pages.title, titleEn: pages.titleEn, group: pages.group }).from(pages).where(ne(pages.group, 'keine')).orderBy(asc(pages.sortOrder)).all()
	]);
	const c = s.company;
	return {
		locale,
		customer: locals.customer ? { firstName: locals.customer.firstName } : null,
		menu,
		cart: {
			count: cart.count,
			total: cart.totals.subtotal - cart.totals.discount,
			lines: cart.lines.map((l) => ({ id: l.id, slug: l.slug, title: l.title, variantTitle: l.variantTitle, image: l.image, quantity: l.quantity, lineTotal: l.lineTotal }))
		},
		company: {
			brand: c.brand,
			name: c.name,
			street: c.street,
			zip: c.zip,
			city: c.city,
			email: c.email,
			phone: c.phone,
			phoneHref: c.phone ? telHref(c.phone) : '',
			whatsappHref: c.whatsapp ? waHref(c.whatsapp) : '',
			instagram: c.instagram,
			facebook: c.facebook,
			tiktok: c.tiktok,
			youtube: c.youtube
		},
		taxMode: s.tax.mode,
		notice: pick(locale, s.home.notice, s.home.noticeEn),
		footerPages: footerPages.map((p) => ({ slug: p.slug, title: pick(locale, p.title, p.titleEn), group: p.group }))
	};
};
