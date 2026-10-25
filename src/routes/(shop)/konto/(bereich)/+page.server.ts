import { requireCustomer } from '$lib/server/customer-auth';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { messages, orders } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const c = requireCustomer(locals);
	const rows = await db
		.select({
			id: orders.id,
			number: orders.number,
			createdAt: orders.createdAt,
			status: orders.status,
			paymentStatus: orders.paymentStatus,
			total: orders.total,
			unread: sql<number>`(SELECT count(*) FROM ${messages} WHERE ${messages.orderId} = ${orders.id} AND ${messages.author} = 'team' AND ${messages.readByCustomerAt} IS NULL)`
		})
		.from(orders)
		.where(eq(orders.customerId, c.id))
		.orderBy(desc(orders.createdAt))
		.all();
	return {
		welcome: url.searchParams.has('willkommen'),
		orders: rows
	};
};
