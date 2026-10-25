import { error, fail } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { pick } from '$lib/i18n.svelte';
import { db } from '$lib/server/db';
import { cartItems, files } from '$lib/server/db/schema';
import { submitInquiry } from '$lib/server/inquiry';
import { cartIdFrom, touchCart } from '$lib/server/shop/cart';
import { configKey, findProductIds, isReleased, loadFullProduct, productCards, resolveLine, variantLabel, variantLimit } from '$lib/server/shop/catalog';
import { CONDITION_LABELS, type LineConfig, type PersonalizationField } from '$lib/shop-types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const locale = locals.locale;
	const fp = await loadFullProduct({ slug: params.slug });
	// Entwürfe sieht nur das Team (Vorschau aus dem Admin)
	if (!fp || fp.product.status === 'archiviert' || (fp.product.status === 'entwurf' && !locals.user)) {
		error(404, locale === 'en' ? 'This product does not exist (anymore).' : 'Dieses Produkt gibt es nicht (mehr).');
	}
	const { product } = fp;
	const fields = (product.fields as PersonalizationField[]).map((f) => ({
		key: f.key,
		type: f.type,
		label: pick(locale, f.label, f.labelEn),
		help: pick(locale, f.help, f.helpEn),
		placeholder: pick(locale, f.placeholder, f.placeholderEn),
		required: f.required,
		choices: f.choices.map((c) => ({ value: c.de, label: pick(locale, c.de, c.en) })),
		maxLength: f.maxLength,
		surcharge: f.surcharge,
		maxFiles: f.maxFiles || 1
	}));
	const related = await findProductIds({ categoryIds: fp.categoryIds, limit: 5, excludeId: product.id }).then((ids) => productCards(ids.slice(0, 4), { locale }));
	const c = locals.customer;

	return {
		product: {
			id: product.id,
			slug: product.slug,
			kind: product.kind,
			status: product.status,
			title: pick(locale, product.title, product.titleEn),
			subtitle: pick(locale, product.subtitle, product.subtitleEn),
			descriptionHtml: pick(locale, product.descriptionHtml, product.descriptionHtmlEn),
			brand: product.brand,
			condition: product.condition,
			conditionLabel: CONDITION_LABELS[product.condition][locale],
			conditionNote: pick(locale, product.conditionNote, product.conditionNoteEn),
			specs: product.specs.map((x) => ({ label: pick(locale, x.label, x.labelEn), value: pick(locale, x.value, x.valueEn) })).filter((x) => x.label && x.value),
			marginScheme: product.marginScheme,
			leadTime: pick(locale, product.leadTime, product.leadTimeEn),
			releaseDate: isReleased(product) ? null : product.releaseDate,
			stockMode: product.stockMode
		},
		images: fp.images,
		options: product.options.map((o) => ({ name: pick(locale, o.name, o.nameEn), values: o.values.map((v) => ({ value: v.de, label: pick(locale, v.de, v.en) })) })),
		variants: fp.variants
			.filter((v) => v.active)
			.map((v) => ({
				id: v.id,
				values: v.optionValues,
				label: variantLabel(product, v, locale),
				price: v.price,
				compareAt: v.compareAtPrice,
				limit: product.kind === 'fahrzeug' ? null : variantLimit(product, v)
			})),
		fields,
		bundle: fp.bundle.map((b) => ({
			id: b.id,
			quantity: b.quantity,
			title: pick(locale, b.product.title, b.product.titleEn),
			variants: b.variants.map((v) => ({ id: v.id, label: variantLabel(b.product, v, locale) || pick(locale, b.product.title, b.product.titleEn), soldOut: variantLimit(b.product, v) === 0 }))
		})),
		related,
		contact: { name: c ? `${c.firstName} ${c.lastName}`.trim() : '', email: c?.email ?? '', phone: c?.phone ?? '' }
	};
};

/* ------------------------------------------------------------ In den Warenkorb */

/** name="fields[farbe]" → { fields: { farbe: … } } */
function parseConfig(form: FormData): LineConfig {
	const cfg: LineConfig = {};
	for (const [key, raw] of form.entries()) {
		if (typeof raw !== 'string') continue;
		const m = key.match(/^(fields|files|bundle|gift)\[([\w-]{1,40})\]$/);
		if (!m) continue;
		const [, group, sub] = m;
		if (group === 'bundle') (cfg.bundle ??= {})[sub] = Number(raw);
		else if (group === 'fields') (cfg.fields ??= {})[sub] = raw;
		else if (group === 'files')
			(cfg.files ??= {})[sub] = raw
				.split(',')
				.map(Number)
				.filter((n) => n > 0);
		else if (group === 'gift') (cfg.gift ??= { name: '', email: '', message: '' })[sub as 'name'] = raw;
	}
	return cfg;
}

export const actions: Actions = {
	add: async ({ request, params, locals, cookies }) => {
		const locale = locals.locale;
		const L = (de: string, en: string) => (locale === 'en' ? en : de);
		const fp = await loadFullProduct({ slug: params.slug });
		if (!fp || fp.product.status !== 'aktiv') return fail(404, { error: L('Dieses Produkt ist nicht erhältlich.', 'This product is not available.') });
		if (fp.product.kind === 'fahrzeug') return fail(400, { error: L('Fahrzeuge gibt es nur auf Anfrage.', 'Vehicles are available on request only.') });
		const form = await request.formData();
		const variantId = Number(form.get('variante'));
		const qty = Math.min(99, Math.max(1, Math.floor(Number(form.get('menge')) || 1)));
		const cartId = (await cartIdFrom(cookies, true, locals.customer?.id ?? null))!;
		const own = new Set((await db.select({ id: files.id }).from(files).where(eq(files.cartId, cartId)).all()).map((f) => f.id));
		const r = resolveLine(fp, variantId, parseConfig(form), { locale }, own);
		if (Object.keys(r.errors).length) return fail(400, { errors: r.errors, error: Object.values(r.errors)[0] });

		const key = configKey(variantId, r.config);
		const existing = await db
			.select()
			.from(cartItems)
			.where(and(eq(cartItems.cartId, cartId), eq(cartItems.configKey, key)))
			.get();
		const wanted = qty + (existing?.quantity ?? 0);
		if (r.limit != null && wanted > r.limit) {
			return fail(400, { error: r.limit === 0 ? L('Leider ausverkauft.', 'Sorry, sold out.') : L(`Nur noch ${r.limit} Stück verfügbar.`, `Only ${r.limit} left.`) });
		}
		// Gutscheine mit Empfänger nicht zusammenfassen – jeder geht an eine eigene Person
		if (existing && !r.config.gift) {
			await db
				.update(cartItems)
				.set({ quantity: sql`${cartItems.quantity} + ${qty}` })
				.where(eq(cartItems.id, existing.id));
		} else {
			await db.insert(cartItems).values({ cartId, productId: fp.product.id, variantId, quantity: qty, config: r.config, configKey: key });
		}
		await touchCart(cartId);
		return { added: true };
	},

	/** Anfrage zu einem Fahrzeug oder Artikel */
	anfrage: async ({ request, params, locals, getClientAddress }) => {
		const fp = await loadFullProduct({ slug: params.slug });
		if (!fp || fp.product.status !== 'aktiv') error(404);
		const p = fp.product;
		return submitInquiry(await request.formData(), {
			locale: locals.locale,
			clientAddress: getClientAddress(),
			kind: p.kind === 'fahrzeug' ? 'fahrzeug' : 'produkt',
			productId: p.id,
			productTitle: p.brand && !p.title.startsWith(p.brand) ? `${p.brand} ${p.title}` : p.title
		});
	}
};
