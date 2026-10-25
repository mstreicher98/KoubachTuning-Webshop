import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, inArray, ne, notInArray, sql } from 'drizzle-orm';
import type { MediaRef } from '$lib/media';
import type { Condition, FieldType, PersonalizationField, ProductOption, ProductSpec } from '$lib/shop-types';
import { parseEuro } from '$lib/admin-labels';
import { logAction } from '$lib/server/audit';
import { db } from '$lib/server/db';
import {
	bundleItems,
	categories,
	media,
	orderItems,
	productCategories,
	productImages,
	products,
	variants
} from '$lib/server/db/schema';
import { setFlash } from '$lib/server/flash';
import { checked, idList, requirePermission, str } from '$lib/server/guard';
import { cleanHtml } from '$lib/server/sanitize';
import { slugify } from '$lib/slug';
import type { Actions, PageServerLoad } from './$types';

const MEDIA_COLS = { id: media.id, file: media.file, widths: media.widths, width: media.width, height: media.height, alt: media.alt };

export const load: PageServerLoad = async ({ locals, params, url }) => {
	requirePermission(locals, 'shop.manage');
	const isNew = params.id === 'neu';
	const product = isNew ? null : await db.select().from(products).where(eq(products.id, Number(params.id))).get();
	if (!isNew && !product) error(404, 'Produkt nicht gefunden');
	const pid = product?.id ?? -1;
	const [cats, brands, others, imgs, vs, catIds, bundle, orderCount] = await Promise.all([
		db.select({ id: categories.id, name: categories.name, parentId: categories.parentId }).from(categories).orderBy(asc(categories.sortOrder)).all(),
		// Bisher verwendete Hersteller als Vorschläge
		db.selectDistinct({ brand: products.brand }).from(products).where(ne(products.brand, '')).orderBy(asc(products.brand)).all(),
		db
			.select({ id: products.id, title: products.title })
			.from(products)
			.where(and(ne(products.id, pid), inArray(products.kind, ['standard']), ne(products.status, 'archiviert')))
			.orderBy(asc(products.title))
			.all(),
		db.select(MEDIA_COLS).from(productImages).innerJoin(media, eq(media.id, productImages.mediaId)).where(eq(productImages.productId, pid)).orderBy(asc(productImages.sortOrder)).all(),
		db.select().from(variants).where(eq(variants.productId, pid)).orderBy(asc(variants.sortOrder), asc(variants.id)).all(),
		db.select({ id: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, pid)).all(),
		db.select().from(bundleItems).where(eq(bundleItems.bundleId, pid)).orderBy(asc(bundleItems.sortOrder)).all(),
		db.select({ n: sql<number>`count(*)` }).from(orderItems).where(eq(orderItems.productId, pid)).get()
	]);
	// Neues Produkt direkt aus der Vorlagenwahl: ?art=fahrzeug oder ?zustand=gebraucht
	const presetKind = url.searchParams.get('art');
	const presetCondition = url.searchParams.get('zustand');
	const used = presetCondition === 'gebraucht' || presetKind === 'fahrzeug';
	return {
		isNew,
		product: product ?? {
			id: null,
			kind: (['standard', 'fahrzeug', 'gutschein', 'bundle'].includes(presetKind ?? '') ? presetKind : 'standard') as 'standard',
			status: 'entwurf' as const,
			title: '',
			titleEn: '',
			subtitle: '',
			subtitleEn: '',
			slug: '',
			descriptionHtml: '',
			descriptionHtmlEn: '',
			brand: '',
			condition: (used ? 'gebraucht' : 'neu') as Condition,
			conditionNote: '',
			conditionNoteEn: '',
			specs: [] as ProductSpec[],
			marginScheme: false,
			options: [] as ProductOption[],
			// Gebrauchtes und Fahrzeuge sind Einzelstücke mit Bestand 1
			stockMode: (used ? 'bestand' : 'auf_bestellung') as 'bestand' | 'auf_bestellung',
			backorder: false,
			releaseDate: null as string | null,
			leadTime: '',
			leadTimeEn: '',
			fields: [] as PersonalizationField[],
			requiresShipping: presetKind !== 'fahrzeug',
			featured: false,
			sortOrder: 0
		},
		images: imgs as MediaRef[],
		variants: vs.map((v) => ({ id: v.id as number | null, values: v.optionValues, sku: v.sku, price: v.price, compareAt: v.compareAtPrice, stock: v.stock, active: v.active })),
		newStock: used ? 1 : 0,
		categoryIds: catIds.map((c) => c.id),
		bundle: bundle.map((b) => ({ productId: b.productId, quantity: b.quantity })),
		categories: cats,
		brands: brands.map((b) => b.brand),
		others,
		hasOrders: Number(orderCount?.n ?? 0) > 0
	};
};

interface Payload {
	options: ProductOption[];
	variants: { id: number | null; values: string[]; sku: string; price: string; compareAt: string; stock: number; active: boolean }[];
	fields: PersonalizationField[];
	specs: ProductSpec[];
	bundle: { productId: number; quantity: number }[];
}

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'number', 'select', 'datei'];
const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);
const intOr = (v: unknown, d: number | null) => (Number.isInteger(Number(v)) && v !== '' && v != null ? Number(v) : d);

function cleanPayload(raw: string): Payload | null {
	let p: Payload;
	try {
		p = JSON.parse(raw);
	} catch {
		return null;
	}
	const options = (Array.isArray(p.options) ? p.options : [])
		.slice(0, 3)
		.map((o) => ({
			name: clip(o.name, 40),
			nameEn: clip(o.nameEn, 40),
			values: (Array.isArray(o.values) ? o.values : [])
				.map((v) => ({ de: clip(v.de, 40), en: clip(v.en, 40) }))
				.filter((v) => v.de)
				.slice(0, 40)
		}))
		.filter((o) => o.name && o.values.length);
	const fields = (Array.isArray(p.fields) ? p.fields : []).slice(0, 20).map((f) => ({
		key: clip(f.key, 40).replace(/[^\w-]/g, '_') || `feld_${Math.random().toString(36).slice(2, 7)}`,
		type: FIELD_TYPES.includes(f.type) ? f.type : 'text',
		label: clip(f.label, 120),
		labelEn: clip(f.labelEn, 120),
		help: clip(f.help, 300),
		helpEn: clip(f.helpEn, 300),
		placeholder: clip(f.placeholder, 500),
		placeholderEn: clip(f.placeholderEn, 500),
		required: !!f.required,
		choices: (Array.isArray(f.choices) ? f.choices : []).map((c) => ({ de: clip(c.de, 80), en: clip(c.en, 80) })).filter((c) => c.de).slice(0, 50),
		maxLength: Math.min(4000, Math.max(1, intOr(f.maxLength, 120)!)),
		surcharge: Math.max(0, intOr(f.surcharge, 0)!),
		maxFiles: Math.min(10, Math.max(1, intOr(f.maxFiles, 1)!))
	})) as PersonalizationField[];
	return {
		options,
		variants: (Array.isArray(p.variants) ? p.variants : []).slice(0, 300),
		fields: fields.filter((f) => f.label),
		specs: (Array.isArray(p.specs) ? p.specs : [])
			.map((x) => ({ label: clip(x.label, 60), labelEn: clip(x.labelEn, 60), value: clip(x.value, 200), valueEn: clip(x.valueEn, 200) }))
			.filter((x) => x.label && x.value)
			.slice(0, 30),
		bundle: (Array.isArray(p.bundle) ? p.bundle : []).map((b) => ({ productId: Number(b.productId), quantity: Math.max(1, Math.min(99, Number(b.quantity) || 1)) })).filter((b) => b.productId > 0)
	};
}

async function uniqueSlug(base: string, exceptId: number | null): Promise<string> {
	let slug = base || 'produkt';
	for (let n = 2; ; n++) {
		const hit = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
		if (!hit || hit.id === exceptId) return slug;
		slug = `${base}-${n}`;
	}
}

export const actions: Actions = {
	speichern: async ({ locals, params, request, cookies }) => {
		const me = requirePermission(locals, 'shop.manage');
		const isNew = params.id === 'neu';
		const existing = isNew ? null : await db.select().from(products).where(eq(products.id, Number(params.id))).get();
		if (!isNew && !existing) error(404);
		const f = await request.formData();
		const payload = cleanPayload(String(f.get('daten') ?? '{}'));
		if (!payload) return fail(400, { error: 'Die Formulardaten sind beschädigt – bitte Seite neu laden.' });

		const kind = (['standard', 'fahrzeug', 'gutschein', 'bundle'].includes(String(f.get('art'))) ? f.get('art') : 'standard') as 'standard' | 'fahrzeug' | 'gutschein' | 'bundle';
		const condition = (['neu', 'gebraucht', 'ueberholt'].includes(String(f.get('zustand'))) ? f.get('zustand') : 'neu') as Condition;
		const title = str(f.get('titel'), 150);
		if (!title) return fail(400, { error: 'Bitte einen Titel eingeben.' });

		// Varianten prüfen
		const optionCount = payload.options.length;
		const seen = new Set<string>();
		const vrows: { id: number | null; optionValues: string[]; sku: string; price: number; compareAtPrice: number | null; stock: number; active: boolean; sortOrder: number }[] = [];
		for (const [i, v] of payload.variants.entries()) {
			const values = (Array.isArray(v.values) ? v.values : []).map((x) => clip(x, 40)).slice(0, optionCount);
			if (values.length !== optionCount) continue;
			const key = JSON.stringify(values);
			if (seen.has(key)) continue;
			seen.add(key);
			const price = parseEuro(v.price);
			// Fahrzeuge dürfen ohne Preis sein („Preis auf Anfrage“)
			if ((price == null && kind !== 'fahrzeug') || (price ?? 0) < 0) return fail(400, { error: `Bitte einen Preis für ${values.join(' / ') || 'das Produkt'} eingeben.` });
			if (kind === 'gutschein' && (price ?? 0) <= 0) return fail(400, { error: 'Gutscheine brauchen einen Wert größer 0.' });
			vrows.push({
				id: Number(v.id) || null,
				optionValues: values,
				sku: clip(v.sku, 60),
				price: price ?? 0,
				compareAtPrice: parseEuro(v.compareAt),
				stock: Math.trunc(Number(v.stock) || 0),
				active: v.active !== false,
				sortOrder: i
			});
		}
		if (!vrows.length) return fail(400, { error: 'Mindestens eine Variante mit Preis anlegen.' });
		if (kind === 'bundle' && !payload.bundle.length) return fail(400, { error: 'Ein Bundle braucht mindestens einen Bestandteil.' });

		const slug = await uniqueSlug(slugify(str(f.get('slug'), 80) || title, 80), existing?.id ?? null);
		const release = str(f.get('erscheint'), 10);
		const values = {
			slug,
			kind,
			status: (['entwurf', 'aktiv', 'archiviert'].includes(String(f.get('status'))) ? f.get('status') : 'entwurf') as 'aktiv',
			title,
			titleEn: str(f.get('titel_en'), 150),
			subtitle: str(f.get('untertitel'), 200),
			subtitleEn: str(f.get('untertitel_en'), 200),
			descriptionHtml: cleanHtml(String(f.get('beschreibung') ?? '')),
			descriptionHtmlEn: cleanHtml(String(f.get('beschreibung_en') ?? '')),
			brand: str(f.get('hersteller'), 80),
			condition: kind === 'gutschein' ? ('neu' as const) : condition,
			conditionNote: str(f.get('zustand_text'), 1000),
			conditionNoteEn: str(f.get('zustand_text_en'), 1000),
			specs: kind === 'gutschein' ? [] : payload.specs,
			marginScheme: kind !== 'gutschein' && condition !== 'neu' && checked(f.get('differenz')),
			options: payload.options,
			stockMode: kind === 'gutschein' ? ('auf_bestellung' as const) : kind === 'fahrzeug' || f.get('lager') === 'bestand' ? ('bestand' as const) : ('auf_bestellung' as const),
			backorder: checked(f.get('nachlieferung')),
			releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(release) ? release : null,
			leadTime: str(f.get('lieferzeit'), 80),
			leadTimeEn: str(f.get('lieferzeit_en'), 80),
			fields: kind === 'standard' ? payload.fields : [],
			requiresShipping: kind === 'gutschein' || kind === 'fahrzeug' ? false : checked(f.get('versand')),
			featured: checked(f.get('hervorgehoben')),
			sortOrder: Number(f.get('sortierung')) || 0
		};

		const imageIds = idList(f, 'bilder');
		const catIds = idList(f, 'kategorien');
		const id = await db.transaction(async (tx) => {
			const pid = existing
				? (await tx.update(products).set(values).where(eq(products.id, existing.id)).returning({ id: products.id }).get()).id
				: (await tx.insert(products).values(values).returning({ id: products.id }).get()).id;

			await tx.delete(productImages).where(eq(productImages.productId, pid));
			for (const [i, mediaId] of imageIds.entries()) await tx.insert(productImages).values({ productId: pid, mediaId, sortOrder: i });
			await tx.delete(productCategories).where(eq(productCategories.productId, pid));
			for (const categoryId of catIds) await tx.insert(productCategories).values({ productId: pid, categoryId });

			// Varianten: bestehende behalten ihre ID (Warenkörbe bleiben gültig)
			const current = await tx.select({ id: variants.id, values: variants.optionValues }).from(variants).where(eq(variants.productId, pid)).all();
			const byKey = new Map(current.map((c) => [JSON.stringify(c.values), c.id]));
			const keep: number[] = [];
			for (const v of vrows) {
				const match = (v.id && current.some((c) => c.id === v.id) ? v.id : null) ?? byKey.get(JSON.stringify(v.optionValues)) ?? null;
				const { id: _ignore, ...data } = v;
				if (match) {
					await tx.update(variants).set(data).where(eq(variants.id, match));
					keep.push(match);
				} else {
					keep.push((await tx.insert(variants).values({ ...data, productId: pid }).returning({ id: variants.id }).get()).id);
				}
			}
			await tx.delete(variants).where(and(eq(variants.productId, pid), keep.length ? notInArray(variants.id, keep) : sql`1 = 1`));

			await tx.delete(bundleItems).where(eq(bundleItems.bundleId, pid));
			if (kind === 'bundle') {
				for (const [i, b] of payload.bundle.entries()) await tx.insert(bundleItems).values({ bundleId: pid, productId: b.productId, quantity: b.quantity, sortOrder: i });
			}
			return pid;
		});
		await logAction(me.id, existing ? 'geändert' : 'erstellt', 'produkt', id, title);
		if (isNew) {
			// Meldung überlebt die Weiterleitung zur Seite des neuen Produkts
			setFlash(cookies, 'Produkt angelegt.');
			redirect(303, `/admin/produkte/${id}`);
		}
		return { message: 'Produkt gespeichert.' };
	},

	loeschen: async ({ locals, params, cookies }) => {
		const me = requirePermission(locals, 'shop.manage');
		const p = await db.select().from(products).where(eq(products.id, Number(params.id))).get();
		if (!p) error(404);
		const used = await db.select({ n: sql<number>`count(*)` }).from(orderItems).where(eq(orderItems.productId, p.id)).get();
		const inBundle = await db.select({ n: sql<number>`count(*)` }).from(bundleItems).where(eq(bundleItems.productId, p.id)).get();
		if (Number(inBundle?.n ?? 0) > 0) return fail(400, { error: 'Das Produkt ist Teil eines Bundles – erst dort entfernen.' });
		if (Number(used?.n ?? 0) > 0) {
			// Bestellt → nur archivieren, damit Bestellungen und Rechnungen vollständig bleiben
			await db.update(products).set({ status: 'archiviert' }).where(eq(products.id, p.id));
			await logAction(me.id, 'geändert', 'produkt', p.id, `${p.title} archiviert`);
			setFlash(cookies, 'Das Produkt wurde schon bestellt und ist jetzt archiviert.');
		} else {
			await db.delete(products).where(eq(products.id, p.id));
			await logAction(me.id, 'gelöscht', 'produkt', p.id, p.title);
			setFlash(cookies, 'Produkt gelöscht.');
		}
		redirect(303, '/admin/produkte');
	},

	kopieren: async ({ locals, params }) => {
		const me = requirePermission(locals, 'shop.manage');
		const p = await db.select().from(products).where(eq(products.id, Number(params.id))).get();
		if (!p) error(404);
		const newId = await db.transaction(async (tx) => {
			const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
			const copy = await tx
				.insert(products)
				.values({ ...rest, slug: await uniqueSlug(`${p.slug}-kopie`, null), title: `${p.title} (Kopie)`, status: 'entwurf', featured: false })
				.returning({ id: products.id })
				.get();
			for (const v of await tx.select().from(variants).where(eq(variants.productId, p.id)).all()) {
				const { id: _vid, productId: _pid, ...vr } = v;
				await tx.insert(variants).values({ ...vr, productId: copy.id, stock: 0 });
			}
			for (const r of await tx.select().from(productImages).where(eq(productImages.productId, p.id)).all()) await tx.insert(productImages).values({ ...r, productId: copy.id });
			for (const r of await tx.select().from(productCategories).where(eq(productCategories.productId, p.id)).all()) await tx.insert(productCategories).values({ ...r, productId: copy.id });
			for (const r of await tx.select().from(bundleItems).where(eq(bundleItems.bundleId, p.id)).all()) {
				const { id: _bid, ...br } = r;
				await tx.insert(bundleItems).values({ ...br, bundleId: copy.id });
			}
			return copy.id;
		});
		await logAction(me.id, 'erstellt', 'produkt', newId, `Kopie von ${p.title}`);
		redirect(303, `/admin/produkte/${newId}`);
	}
};
