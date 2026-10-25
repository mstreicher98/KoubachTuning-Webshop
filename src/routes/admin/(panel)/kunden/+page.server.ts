import { and, desc, like, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { customers, orders } from '$lib/server/db/schema';
import { requirePermission } from '$lib/server/guard';
import type { PageServerLoad } from './$types';

const PAGE = 50;

export const load: PageServerLoad = async ({ locals, url }) => {
	requirePermission(locals, 'shop.manage');
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	const filter = url.searchParams.get('filter') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('seite')) || 1);
	const conds: SQL[] = [];
	if (q) {
		const l = `%${q.replace(/[%_]/g, ' ')}%`;
		conds.push(or(like(customers.email, l), like(customers.firstName, l), like(customers.lastName, l), like(customers.company, l))!);
	}
	if (filter === 'firmen') conds.push(sql`${customers.company} <> ''`);
	if (filter === 'unbestaetigt') conds.push(sql`${customers.emailVerifiedAt} IS NULL`);
	const where = conds.length ? and(...conds) : undefined;
	const [rows, total] = await Promise.all([
		db
			.select({
				id: customers.id,
				email: customers.email,
				firstName: customers.firstName,
				lastName: customers.lastName,
				company: customers.company,
				verified: customers.emailVerifiedAt,
				active: customers.active,
				createdAt: customers.createdAt,
				orders: sql<number>`(SELECT count(*) FROM ${orders} WHERE ${orders.customerId} = ${customers.id})`,
				revenue: sql<number>`(SELECT coalesce(sum(${orders.total}), 0) FROM ${orders} WHERE ${orders.customerId} = ${customers.id} AND ${orders.paymentStatus} = 'bezahlt')`
			})
			.from(customers)
			.where(where)
			.orderBy(desc(customers.id))
			.limit(PAGE)
			.offset((page - 1) * PAGE)
			.all(),
		db.select({ n: sql<number>`count(*)` }).from(customers).where(where).get()
	]);
	return { rows, q, filter, page, pages: Math.max(1, Math.ceil(Number(total?.n ?? 0) / PAGE)) };
};
