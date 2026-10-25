import { formatDate, formatMoney } from '$lib/i18n.svelte';
import type { Locale } from '$lib/shop-types';
import type { GiftCard, Inquiry, Order, OrderItem, Payment } from './db/schema';
import type { MailContent } from './mail';
import { getSettings, type ShopSettings } from './settings';
import { adminUrl, shopBase, shopUrl } from './urls';

/**
 * Alle E-Mails an Kunden (Deutsch/Englisch) und an das Team (Deutsch).
 * Aufbau: schwarzer Kopf mit Logo, weißer Inhalt, ein klarer Knopf.
 */

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>');

interface Block {
	html: string;
	text: string;
}

function layout(s: ShopSettings, locale: Locale, heading: string, blocks: Block[], cta?: { label: string; url: string }): { html: string; text: string } {
	const c = s.company;
	const footer = [c.name, [c.street, `${c.zip} ${c.city}`.trim()].filter(Boolean).join(', '), c.email, c.phone].filter(Boolean).join(' · ');
	const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#e4e4e7;font-family:Helvetica,Arial,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e4e4e7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff">
<tr><td style="background:#000000;padding:22px 28px" align="left"><img src="${shopBase()}/bilder/logo-mail.png" width="200" height="48" alt="${esc(c.brand)}" style="display:block;border:0"></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:#e52521;background-image:linear-gradient(90deg,#e52521,#9e0b0f)">&nbsp;</td></tr>
<tr><td style="padding:30px 28px 8px"><h1 style="margin:0 0 18px;font-size:24px;line-height:1.2;font-weight:800;text-transform:uppercase;letter-spacing:.01em">${esc(heading)}</h1>
${blocks.map((b) => b.html).join('\n')}
${cta ? `<p style="margin:26px 0 8px"><a href="${esc(cta.url)}" style="display:inline-block;background:#e52521;background-image:linear-gradient(115deg,#e52521,#9e0b0f);color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;text-transform:uppercase;font-size:14px;letter-spacing:.03em">${esc(cta.label)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:24px 28px 28px;font-size:12px;line-height:1.5;color:#71717a;border-top:1px solid #e4e4e7">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;
	const text = [heading.toUpperCase(), '', ...blocks.map((b) => b.text), cta ? `\n${cta.label}: ${cta.url}` : '', '', '—', footer].join('\n');
	return { html, text };
}

const p = (t: string): Block => ({ html: `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${nl2br(t)}</p>`, text: `${t}\n` });
const raw = (html: string, text: string): Block => ({ html, text });

function money(cents: number, locale: Locale) {
	return formatMoney(cents, locale);
}

/* ------------------------------------------------------------ Bestellübersicht */

function orderSummary(order: Order, items: OrderItem[], locale: Locale): Block {
	const L = (de: string, en: string) => (locale === 'en' ? en : de);
	const rows = items
		.map((i) => {
			const details = [
				i.variantTitle,
				...(i.config.fields ?? []).map((f) => `${f.label}: ${f.value}`),
				...(i.config.bundle ?? []).map((b) => `${b.quantity}× ${b.title}${b.variantTitle ? ` (${b.variantTitle})` : ''}`),
				i.marginScheme ? L('differenzbesteuert (§ 24 UStG)', 'margin scheme (§ 24 UStG)') : ''
			].filter(Boolean);
			return {
				html: `<tr><td style="padding:10px 0;border-bottom:1px solid #e4e4e7;font-size:14px;vertical-align:top"><strong>${i.quantity}× ${esc(i.title)}</strong>${details.length ? `<br><span style="color:#71717a;font-size:13px">${details.map(esc).join('<br>')}</span>` : ''}</td><td style="padding:10px 0;border-bottom:1px solid #e4e4e7;font-size:14px;text-align:right;vertical-align:top;white-space:nowrap">${money(i.lineTotal, locale)}</td></tr>`,
				text: `${i.quantity}× ${i.title}  ${money(i.lineTotal, locale)}${details.length ? `\n   ${details.join('\n   ')}` : ''}`
			};
		});
	const sums: [string, number][] = [[L('Zwischensumme', 'Subtotal'), order.subtotal]];
	if (order.discountTotal) sums.push([`${L('Rabatt', 'Discount')}${order.discountCode ? ` (${order.discountCode})` : ''}`, -order.discountTotal]);
	// Nur Gutscheine: kein Versand
	const shipsNow = items.some((i) => i.kind !== 'gutschein');
	if (order.shippingMethod !== 'keiner' && shipsNow) sums.push([order.shippingMethod === 'abholung' ? L('Abholung', 'Pickup') : L('Versand', 'Shipping'), order.shippingTotal]);
	sums.push([L('Summe', 'Total'), order.total]);
	if (order.giftCardTotal) sums.push([L('Bezahlt mit Gutschein', 'Paid by gift card'), -order.giftCardTotal]);
	const sumHtml = sums
		.map(([label, v], idx) => `<tr><td style="padding:4px 0;font-size:14px;${idx === sums.length - 1 || label.startsWith('Summe') || label.startsWith('Total') ? 'font-weight:700' : ''}">${esc(label)}</td><td style="padding:4px 0;font-size:14px;text-align:right">${money(v, locale)}</td></tr>`)
		.join('');
	const taxLine =
		order.taxCase === 'kleinunternehmer'
			? L('Umsatzsteuerfrei aufgrund der Kleinunternehmerregelung.', 'VAT exempt (small business regulation).')
			: order.taxCase === 'reverse_charge'
				? L('Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge).', 'Reverse charge – VAT to be accounted for by the recipient.')
				: order.taxCase === 'export'
					? L('Steuerfreie Ausfuhrlieferung.', 'VAT-free export delivery.')
					: L(`inkl. ${money(order.taxTotal, locale)} USt.`, `incl. ${money(order.taxTotal, locale)} VAT`);
	return raw(
		`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 6px">${rows.map((r) => r.html).join('')}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px">${sumHtml}</table>
<p style="margin:0 0 16px;font-size:12px;color:#71717a">${esc(taxLine)}</p>`,
		`${rows.map((r) => r.text).join('\n')}\n\n${sums.map(([l, v]) => `${l}: ${money(v, locale)}`).join('\n')}\n${taxLine}\n`
	);
}

function transferBlock(s: ShopSettings, order: Order, amount: number, locale: Locale): Block {
	const L = (de: string, en: string) => (locale === 'en' ? en : de);
	const rows: [string, string][] = [
		[L('Empfänger', 'Recipient'), s.company.name],
		['IBAN', s.company.iban || L('(wird nachgereicht)', '(to follow)')],
		['BIC', s.company.bic],
		[L('Betrag', 'Amount'), money(amount, locale)],
		[L('Verwendungszweck', 'Reference'), L(`Bestellung ${order.number}`, `Order ${order.number}`)]
	];
	return raw(
		`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;background:#f4f4f5;width:100%"><tr><td style="padding:16px 18px">
<p style="margin:0 0 10px;font-weight:700;font-size:14px">${esc(L(`Bitte überweise innerhalb von ${s.orders.transferDays} Tagen:`, `Please transfer within ${s.orders.transferDays} days:`))}</p>
${rows.filter(([, v]) => v).map(([k, v]) => `<div style="font-size:14px;line-height:1.7"><span style="color:#71717a;display:inline-block;min-width:130px">${esc(k)}</span> <strong>${esc(v)}</strong></div>`).join('')}
</td></tr></table>`,
		`${L('Bitte überweise:', 'Please transfer:')}\n${rows
			.filter(([, v]) => v)
			.map(([k, v]) => `${k}: ${v}`)
			.join('\n')}\n`
	);
}

const orderLink = (order: Order) => shopUrl(`/bestellung/${order.token}`, order.locale);
const hello = (order: Order) => {
	const name = order.billingAddress.firstName;
	return order.locale === 'en' ? `Hi ${name},` : `Hallo ${name},`;
};

/* ================================================================ Kunden */

export async function orderConfirmationMail(order: Order, items: OrderItem[], payment: Payment | null): Promise<MailContent> {
	const s = await getSettings();
	const l = order.locale;
	const L = (de: string, en: string) => (l === 'en' ? en : de);
	const blocks: Block[] = [
		p(hello(order)),
		p(
			L(
				`danke für deine Bestellung! Wir haben sie unter der Nummer ${order.number} erhalten.`,
				`thanks for your order! We've received it as order number ${order.number}.`
			)
		)
	];
	if (payment?.method === 'ueberweisung' && order.amountDue > 0) blocks.push(transferBlock(s, order, order.amountDue, l));
	if (payment?.method === 'bar' && order.shippingMethod === 'abholung')
		blocks.push(p(L('Du bezahlst bar bei der Abholung. Wir melden uns, sobald deine Bestellung bereitliegt.', "You'll pay in cash on pickup. We'll let you know as soon as your order is ready.")));
	blocks.push(orderSummary(order, items, l));
	return {
		subject: L(`Deine Bestellung ${order.number} bei ${s.company.brand}`, `Your ${s.company.brand} order ${order.number}`),
		...layout(s, l, L('Danke für deine Bestellung', 'Thanks for your order'), blocks, { label: L('Bestellung ansehen', 'View order'), url: orderLink(order) })
	};
}

export async function paymentReceivedMail(order: Order, amount: number): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (order.locale === 'en' ? en : de);
	return {
		subject: L(`Zahlung für Bestellung ${order.number} erhalten`, `Payment received for order ${order.number}`),
		...layout(
			s,
			order.locale,
			L('Zahlung erhalten', 'Payment received'),
			[
				p(hello(order)),
				p(
					L(`wir haben deine Zahlung über ${money(amount, 'de')} erhalten und machen uns an die Arbeit.`, `we've received your payment of ${money(amount, 'en')} and are getting to work.`)
				),
				p(L('Die Rechnung findest du bei deiner Bestellung.', 'You can find the invoice with your order.'))
			],
			{ label: L('Bestellung ansehen', 'View order'), url: orderLink(order) }
		)
	};
}

export async function orderShippedMail(order: Order): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (order.locale === 'en' ? en : de);
	const blocks = [p(hello(order)), p(L(`deine Bestellung ${order.number} ist unterwegs zu dir.`, `your order ${order.number} is on its way.`))];
	if (order.trackingNumber)
		blocks.push(p(`${order.trackingCarrier ? `${order.trackingCarrier} – ` : ''}${L('Sendungsnummer', 'Tracking number')}: ${order.trackingNumber}`));
	blocks.push(p(L(`Den Stand siehst du jederzeit unter ${shopUrl('/sendungsverfolgung', 'de')}.`, `You can check the status any time at ${shopUrl('/sendungsverfolgung', 'en')}.`)));
	return {
		subject: L(`Bestellung ${order.number} ist unterwegs`, `Order ${order.number} has shipped`),
		...layout(s, order.locale, L('Deine Bestellung ist unterwegs', 'Your order has shipped'), blocks, {
			label: order.trackingUrl ? L('Sendung verfolgen', 'Track parcel') : L('Bestellung ansehen', 'View order'),
			url: order.trackingUrl || orderLink(order)
		})
	};
}

export async function readyForPickupMail(order: Order): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (order.locale === 'en' ? en : de);
	return {
		subject: L(`Bestellung ${order.number} ist abholbereit`, `Order ${order.number} is ready for pickup`),
		...layout(
			s,
			order.locale,
			L('Abholbereit', 'Ready for pickup'),
			[p(hello(order)), p(L(`deine Bestellung ${order.number} liegt zur Abholung bereit.`, `your order ${order.number} is ready for pickup.`)), p([s.pickup.address, L(s.pickup.note, s.pickup.noteEn)].filter(Boolean).join('\n'))],
			{ label: L('Bestellung ansehen', 'View order'), url: orderLink(order) }
		)
	};
}

export async function orderCancelledMail(order: Order, reason: string): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (order.locale === 'en' ? en : de);
	const blocks = [p(hello(order)), p(L(`deine Bestellung ${order.number} wurde storniert.`, `your order ${order.number} has been cancelled.`))];
	if (reason) blocks.push(p(reason));
	if (order.paymentStatus === 'bezahlt') blocks.push(p(L('Bereits bezahlte Beträge erstatten wir dir auf dem ursprünglichen Zahlungsweg.', "Any payments already made will be refunded via the original payment method.")));
	return {
		subject: L(`Bestellung ${order.number} storniert`, `Order ${order.number} cancelled`),
		...layout(s, order.locale, L('Bestellung storniert', 'Order cancelled'), blocks, { label: L('Bestellung ansehen', 'View order'), url: orderLink(order) })
	};
}

export async function teamMessageToCustomerMail(order: Order, body: string): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (order.locale === 'en' ? en : de);
	return {
		subject: L(`Neue Nachricht zu deiner Bestellung ${order.number}`, `New message about your order ${order.number}`),
		...layout(s, order.locale, L('Neue Nachricht', 'New message'), [p(hello(order)), p(body)], { label: L('Antworten', 'Reply'), url: orderLink(order) })
	};
}

export async function giftCardMail(card: GiftCard, locale: Locale, buyerName: string): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (locale === 'en' ? en : de);
	const blocks: Block[] = [
		p(card.recipientName ? (locale === 'en' ? `Hi ${card.recipientName},` : `Hallo ${card.recipientName},`) : L('Hallo,', 'Hi,')),
		p(
			L(
				`${buyerName ? `${buyerName} schenkt dir` : 'du hast'} einen Gutschein über ${money(card.initialValue, 'de')} für den ${s.company.brand} Shop.`,
				`${buyerName ? `${buyerName} is giving you` : 'here is'} a gift card worth ${money(card.initialValue, 'en')} for the ${s.company.brand} shop.`
			)
		)
	];
	if (card.message) blocks.push(raw(`<blockquote style="margin:0 0 16px;padding:10px 16px;border-left:3px solid #e52521;font-style:italic;font-size:15px">${nl2br(card.message)}</blockquote>`, `„${card.message}“\n`));
	blocks.push(
		raw(
			`<p style="margin:8px 0 16px;padding:18px;background:#e52521;background-image:linear-gradient(115deg,#e52521,#9e0b0f);color:#fff;font-size:24px;font-weight:800;letter-spacing:.12em;text-align:center">${esc(card.code)}</p>`,
			`${L('Gutscheincode', 'Gift card code')}: ${card.code}\n`
		),
		p(L('Einfach an der Kasse eingeben. Nicht verbrauchte Beträge bleiben auf dem Gutschein.', 'Just enter it at checkout. Any unused amount stays on the card.'))
	);
	return {
		subject: L(`Dein Gutschein von ${s.company.brand}`, `Your ${s.company.brand} gift card`),
		...layout(s, locale, L('Ein Gutschein für dich', 'A gift card for you'), blocks, { label: L('Zum Shop', 'Visit the shop'), url: shopUrl('/', locale) })
	};
}

export async function accountLinkMail(kind: 'login' | 'verify' | 'reset', url: string, locale: Locale): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (locale === 'en' ? en : de);
	const t = {
		login: {
			subject: L('Dein Anmelde-Link', 'Your login link'),
			heading: L('Anmelden', 'Log in'),
			text: L('Mit diesem Link meldest du dich ohne Passwort an. Er gilt 30 Minuten und nur einmal.', 'Use this link to log in without a password. It is valid for 30 minutes and works once.'),
			cta: L('Jetzt anmelden', 'Log in now')
		},
		verify: {
			subject: L('Bitte bestätige deine E-Mail-Adresse', 'Please confirm your email address'),
			heading: L('E-Mail bestätigen', 'Confirm your email'),
			text: L(
				'Bestätige deine E-Mail-Adresse, damit dein Kundenkonto aktiv wird. Bestellungen, die du früher ohne Konto mit dieser Adresse aufgegeben hast, erscheinen danach auch in deinem Konto.',
				'Confirm your email address to activate your account. Orders you placed earlier without an account using this address will then show up in your account too.'
			),
			cta: L('E-Mail bestätigen', 'Confirm email')
		},
		reset: {
			subject: L('Neues Passwort festlegen', 'Set a new password'),
			heading: L('Neues Passwort', 'New password'),
			text: L('Über diesen Link legst du ein neues Passwort fest. Er gilt eine Stunde.', 'Use this link to set a new password. It is valid for one hour.'),
			cta: L('Passwort festlegen', 'Set password')
		}
	}[kind];
	return {
		subject: t.subject,
		...layout(s, locale, t.heading, [p(t.text), p(L('Du hast das nicht angefordert? Dann ignoriere diese E-Mail einfach.', "Didn't request this? Just ignore this email."))], { label: t.cta, url })
	};
}

/* ================================================================ Team (immer Deutsch) */

export async function teamNewOrderMail(order: Order, items: OrderItem[]): Promise<MailContent> {
	const s = await getSettings();
	const b = order.billingAddress;
	return {
		subject: `Neue Bestellung ${order.number} – ${formatMoney(order.total)}${order.paymentStatus === 'bezahlt' ? ' (bezahlt)' : ' (Zahlung offen)'}`,
		...layout(
			s,
			'de',
			`Neue Bestellung ${order.number}`,
			[p(`${b.firstName} ${b.lastName}${b.company ? `, ${b.company}` : ''} · ${order.email}\nZahlung: ${order.paymentMethod} · ${order.paymentStatus === 'bezahlt' ? 'bezahlt' : 'offen'}`), orderSummary(order, items, 'de')],
			{ label: 'Im Admin öffnen', url: adminUrl(`/admin/bestellungen/${order.id}`) }
		)
	};
}

export async function teamNoticeMail(subject: string, text: string, path: string): Promise<MailContent> {
	const s = await getSettings();
	return { subject, ...layout(s, 'de', subject, [p(text)], { label: 'Im Admin öffnen', url: adminUrl(path) }) };
}

export async function teamInquiryMail(inq: Inquiry): Promise<MailContent> {
	const s = await getSettings();
	const about = inq.productTitle ? `${inq.kind === 'fahrzeug' ? 'Fahrzeug' : 'Artikel'}: ${inq.productTitle}` : '';
	return {
		subject: `Neue Anfrage: ${inq.productTitle || inq.subject || inq.name}`,
		...layout(
			s,
			'de',
			'Neue Anfrage',
			[p(`${inq.name} · ${inq.email}${inq.phone ? ` · ${inq.phone}` : ''}`), ...(about ? [p(about)] : []), ...(inq.subject ? [p(`Betreff: ${inq.subject}`)] : []), p(inq.message)],
			{ label: 'Im Admin öffnen', url: adminUrl(`/admin/anfragen`) }
		)
	};
}

/** Eingangsbestätigung an den Absender – mit seiner Nachricht zur Kontrolle */
export async function inquiryReceivedMail(inq: Inquiry): Promise<MailContent> {
	const s = await getSettings();
	const L = (de: string, en: string) => (inq.locale === 'en' ? en : de);
	const blocks: Block[] = [
		p(inq.locale === 'en' ? `Hi ${inq.name},` : `Hallo ${inq.name},`),
		p(
			inq.productTitle
				? L(`danke für deine Anfrage zu „${inq.productTitle}“. Wir melden uns so schnell wie möglich bei dir.`, `thanks for your inquiry about "${inq.productTitle}". We'll get back to you as soon as possible.`)
				: L('danke für deine Nachricht. Wir melden uns so schnell wie möglich bei dir.', "thanks for your message. We'll get back to you as soon as possible.")
		),
		raw(`<blockquote style="margin:0 0 16px;padding:10px 16px;border-left:3px solid #e52521;font-size:14px;color:#3f3f46">${nl2br(inq.message)}</blockquote>`, `„${inq.message}“\n`)
	];
	return {
		subject: L(`Deine Anfrage bei ${s.company.brand}`, `Your inquiry at ${s.company.brand}`),
		...layout(s, inq.locale, L('Anfrage erhalten', 'Inquiry received'), blocks)
	};
}

export const dueDateText = (order: Order, days: number) => formatDate(new Date(order.createdAt.getTime() + days * 86_400_000), order.locale);
