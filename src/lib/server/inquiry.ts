import { fail } from '@sveltejs/kit';
import type { Locale } from '$lib/shop-types';
import { isRateLimited, registerFailure } from './auth';
import { isEmail, normalizeEmail } from './customer-auth';
import { db } from './db';
import { inquiries, type Inquiry } from './db/schema';
import { inquiryReceivedMail, teamInquiryMail } from './emails';
import { checked, str } from './guard';
import { queueMail } from './mail';
import { notifyTeam } from './notify';

/**
 * Anfragen aus dem Kontaktformular und von Produkt- bzw. Fahrzeugseiten.
 * Landen unter Admin → Anfragen, das Team bekommt E-Mail und Push,
 * der Absender eine Eingangsbestätigung.
 */
export async function submitInquiry(
	form: FormData,
	opts: { locale: Locale; clientAddress: string; kind?: Inquiry['kind']; productId?: number | null; productTitle?: string }
) {
	const L = (de: string, en: string) => (opts.locale === 'en' ? en : de);
	// Unsichtbares Feld – nur Bots füllen es aus
	if (str(form.get('website'), 200)) return { sent: true };
	const values = {
		name: str(form.get('name'), 120),
		email: normalizeEmail(str(form.get('email'), 200)),
		phone: str(form.get('telefon'), 40),
		subject: str(form.get('betreff'), 150),
		message: str(form.get('nachricht'), 5000)
	};
	if (!values.name || !isEmail(values.email) || values.message.length < 5)
		return fail(400, { values, error: L('Bitte Name, E-Mail und Nachricht angeben.', 'Please enter name, email and message.') });
	if (!checked(form.get('datenschutz'))) return fail(400, { values, error: L('Bitte bestätige die Datenschutzerklärung.', 'Please accept the privacy policy.') });
	const key = `anfrage:${opts.clientAddress}`;
	if (isRateLimited(key, 5, 60 * 60_000))
		return fail(429, { values, error: L('Zu viele Anfragen. Bitte später erneut versuchen oder per E-Mail melden.', 'Too many requests. Please try later or email us.') });
	registerFailure(key, 60 * 60_000);
	const inq = await db
		.insert(inquiries)
		.values({ ...values, kind: opts.kind ?? 'kontakt', productId: opts.productId ?? null, productTitle: opts.productTitle ?? '', locale: opts.locale })
		.returning()
		.get();
	void notifyTeam(teamInquiryMail(inq), { title: inq.productTitle ? `Anfrage: ${inq.productTitle}` : 'Neue Anfrage', body: `${inq.name}: ${inq.subject || inq.message.slice(0, 80)}`, url: '/admin/anfragen' });
	queueMail(inq.email, inquiryReceivedMail(inq), { template: 'anfrage' });
	return { sent: true };
}
