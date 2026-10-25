import { and, asc, eq, inArray, ne } from 'drizzle-orm';
import type { SessionCustomer } from '../customer-auth';
import { db } from '../db';
import { productCategories, products } from '../db/schema';
import { findProductIds, productCards, type SortKey } from './catalog';
import type { Condition, Locale } from '$lib/shop-types';

const SORTS: SortKey[] = ['empfohlen', 'neu', 'preis_auf', 'preis_ab'];
const CONDITIONS: Condition[] = ['neu', 'gebraucht', 'ueberholt'];
const PAGE_SIZE = 24;

/** Gemeinsame Logik für Produktliste, Suche und Kategorie */
export async function productListing(opts: { url: URL; locale: Locale; customer: SessionCustomer | null; categoryIds?: number[] }) {
	const { url } = opts;
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	const sortParam = url.searchParams.get('sortierung') as SortKey | null;
	const sort: SortKey = sortParam && SORTS.includes(sortParam) ? sortParam : 'empfohlen';
	const page = Math.max(1, Number(url.searchParams.get('seite')) || 1);
	const brand = (url.searchParams.get('marke') ?? '').trim().slice(0, 80) || null;
	const condParam = url.searchParams.get('zustand') as Condition | null;
	const condition = condParam && CONDITIONS.includes(condParam) ? condParam : null;
	const ids = await findProductIds({ categoryIds: opts.categoryIds, search: q || undefined, sort, brand, condition });
	const pages = Math.max(1, Math.ceil(ids.length / PAGE_SIZE));
	const slice = ids.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
	const products = await productCards(slice, { locale: opts.locale });
	return { products, total: ids.length, page, pages, q, sort, brand, condition, brands: await brandsIn(opts.categoryIds) };
}

/** Hersteller der aktiven Produkte (für den Filter), optional nur in bestimmten Kategorien */
export async function brandsIn(categoryIds?: number[]): Promise<string[]> {
	const conds = [eq(products.status, 'aktiv'), ne(products.brand, '')];
	if (categoryIds?.length)
		conds.push(inArray(products.id, db.select({ id: productCategories.productId }).from(productCategories).where(inArray(productCategories.categoryId, categoryIds))));
	const rows = await db
		.selectDistinct({ brand: products.brand })
		.from(products)
		.where(and(...conds))
		.orderBy(asc(products.brand))
		.all();
	return rows.map((r) => r.brand);
}
