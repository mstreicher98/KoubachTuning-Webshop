import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { pick } from '$lib/i18n.svelte';
import type { MediaRef } from '$lib/media';
import { db } from '$lib/server/db';
import { media, productCategories, products, showcase, testimonials } from '$lib/server/db/schema';
import { getSettings } from '$lib/server/settings';
import { activeCountries } from '$lib/server/shop/cart';
import { categoryTree, findProductIds, productCards } from '$lib/server/shop/catalog';
import { allowedPaymentMethods } from '$lib/server/shop/orders';
import type { PageServerLoad } from './$types';

const MEDIA_COLS = { id: media.id, file: media.file, widths: media.widths, width: media.width, height: media.height, alt: media.alt };

export const load: PageServerLoad = async ({ locals }) => {
	const locale = locals.locale;
	const s = await getSettings();
	const ctx = { locale };
	const [featuredIds, newIds, vehicleIds, tree, gallery, reviews, hero, countries] = await Promise.all([
		findProductIds({ featured: true, excludeKind: 'fahrzeug', limit: 8 }),
		findProductIds({ sort: 'neu', excludeKind: 'fahrzeug', limit: 8 }),
		findProductIds({ kind: 'fahrzeug', sort: 'neu', limit: 6 }),
		categoryTree(locale, true),
		db
			.select({ id: showcase.id, title: showcase.title, vehicle: showcase.vehicle, image: MEDIA_COLS })
			.from(showcase)
			.innerJoin(media, eq(media.id, showcase.mediaId))
			.where(eq(showcase.active, true))
			.orderBy(asc(showcase.sortOrder), asc(showcase.id))
			.limit(12)
			.all(),
		db.select().from(testimonials).where(eq(testimonials.active, true)).orderBy(asc(testimonials.sortOrder)).limit(6).all(),
		s.home.heroMediaId ? db.select(MEDIA_COLS).from(media).where(and(eq(media.id, s.home.heroMediaId), eq(media.kind, 'bild'))).get() : null,
		activeCountries()
	]);

	// Aktive Produkte je Hauptkategorie (inkl. Unterkategorien) – zeigt, wo schon etwas liegt
	const counts = new Map<number, number>();
	for (const root of tree) {
		const ids = [root.id, ...root.children.map((c) => c.id)];
		const row = await db
			.select({ n: sql<number>`count(DISTINCT ${productCategories.productId})` })
			.from(productCategories)
			.innerJoin(products, eq(products.id, productCategories.productId))
			.where(and(inArray(productCategories.categoryId, ids), eq(products.status, 'aktiv')))
			.get();
		counts.set(root.id, Number(row?.n ?? 0));
	}

	// Neu: ohne die schon hervorgehobenen
	const newest = newIds.filter((id) => !featuredIds.includes(id)).slice(0, 4);
	const home = countries.find((c) => c.code === 'AT') ?? countries[0] ?? null;
	return {
		hero: {
			title: pick(locale, s.home.heroTitle, s.home.heroTitleEn),
			text: pick(locale, s.home.heroText, s.home.heroTextEn),
			image: (hero ?? null) as MediaRef | null
		},
		categories: tree.map((c) => ({ id: c.id, slug: c.slug, name: c.name, tagline: c.tagline, count: counts.get(c.id) ?? 0, children: c.children.map((ch) => ({ slug: ch.slug, name: ch.name })) })),
		featured: await productCards(featuredIds.length ? featuredIds : newIds.slice(0, 8), ctx),
		newest: featuredIds.length ? await productCards(newest, ctx) : [],
		vehicles: await productCards(vehicleIds, ctx),
		gallery: gallery.map((g) => ({ id: g.id, title: g.title, vehicle: g.vehicle, image: g.image as MediaRef })),
		reviews: reviews.map((r) => ({ id: r.id, name: r.name, vehicle: r.vehicle, rating: r.rating, text: pick(locale, r.text, r.textEn) })),
		service: {
			countries: countries.map((c) => ({ code: c.code, name: pick(locale, c.name, c.nameEn), price: c.price, freeFrom: c.freeFrom })),
			freeFrom: home?.freeFrom ?? null,
			pickup: s.pickup.enabled ? s.pickup.address : '',
			payments: allowedPaymentMethods(s, true)
		}
	};
};
