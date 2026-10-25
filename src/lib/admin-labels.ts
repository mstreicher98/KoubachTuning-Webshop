/** Bezeichnungen und Farben für Status im Admin */

export type Tone = 'ok' | 'warn' | 'red' | 'info' | '';

export const ORDER_STATUS_LABEL: Record<string, [string, Tone]> = {
	zahlung_offen: ['Zahlung offen', 'warn'],
	in_bearbeitung: ['In Bearbeitung', 'info'],
	abholbereit: ['Abholbereit', 'info'],
	versendet: ['Versendet', 'ok'],
	abgeschlossen: ['Abgeschlossen', ''],
	storniert: ['Storniert', 'red']
};

export const PAYMENT_STATUS_LABEL: Record<string, [string, Tone]> = {
	offen: ['offen', 'warn'],
	bezahlt: ['bezahlt', 'ok'],
	erstattet: ['erstattet', ''],
	fehlgeschlagen: ['fehlgeschlagen', 'red'],
	abgebrochen: ['abgebrochen', '']
};

export const KIND_LABEL: Record<string, string> = {
	standard: 'Artikel',
	fahrzeug: 'Fahrzeug (Anfrage)',
	gutschein: 'Gutschein',
	bundle: 'Bundle'
};

export const INVOICE_KIND_LABEL: Record<string, string> = {
	rechnung: 'Rechnung',
	storno: 'Stornorechnung'
};

export const CONDITION_LABEL: Record<string, string> = {
	neu: 'Neu',
	gebraucht: 'Gebraucht',
	ueberholt: 'Generalüberholt'
};

export const INQUIRY_KIND_LABEL: Record<string, string> = {
	kontakt: 'Kontakt',
	fahrzeug: 'Fahrzeug',
	produkt: 'Artikel'
};

export const TAX_CASE_LABEL: Record<string, string> = {
	normal: 'mit USt.',
	kleinunternehmer: 'Kleinunternehmer',
	reverse_charge: 'Reverse Charge',
	export: 'Ausfuhr'
};

export const badgeClass = (tone: Tone) => (tone ? `badge badge-${tone}` : 'badge');

const eur = new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' });
export const euro = (cents: number) => eur.format(cents / 100);

/** "12,50" oder "12.50" oder "12" → 1250; leer/ungültig → null */
export function parseEuro(v: FormDataEntryValue | null | undefined): number | null {
	const s = String(v ?? '')
		.trim()
		.replace(/\s|€/g, '');
	if (!s) return null;
	const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
	const n = Number(normalized);
	return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** 1250 → "12,50" (für Eingabefelder) */
export const euroInput = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2).replace('.', ','));
