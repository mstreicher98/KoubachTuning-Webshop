/**
 * Typen, die Server und Oberfläche teilen. Beträge immer in Cent,
 * Steuersätze in Basispunkten (2000 = 20 %).
 */

export type Locale = 'de' | 'en';

/** Auswahlmöglichkeit eines Produkts, z. B. Größe mit S, M, L */
export interface ProductOption {
	name: string;
	nameEn: string;
	values: { de: string; en: string }[];
}

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'datei';

/** Zusätzliche Angabe beim Bestellen (z. B. Fahrgestellnummer), im Admin je Produkt angelegt */
export interface PersonalizationField {
	key: string;
	type: FieldType;
	label: string;
	labelEn: string;
	help: string;
	helpEn: string;
	placeholder: string;
	placeholderEn: string;
	required: boolean;
	/** Nur bei select: eine Auswahl je Zeile */
	choices: { de: string; en: string }[];
	maxLength: number;
	/** Aufpreis in Cent, wenn das Feld ausgefüllt wird (0 = kein Aufpreis) */
	surcharge: number;
	/** Nur bei datei: bis zu so viele Dateien */
	maxFiles: number;
}

/** Technische Angabe eines Produkts, z. B. Hubraum: 70 ccm */
export interface ProductSpec {
	label: string;
	labelEn: string;
	value: string;
	valueEn: string;
}

export type Condition = 'neu' | 'gebraucht' | 'ueberholt';

export const CONDITION_LABELS: Record<Condition, { de: string; en: string }> = {
	neu: { de: 'Neu', en: 'New' },
	gebraucht: { de: 'Gebraucht', en: 'Used' },
	ueberholt: { de: 'Generalüberholt', en: 'Refurbished' }
};

/** Was der Kunde beim Hinzufügen in den Warenkorb gewählt hat */
export interface LineConfig {
	/** Personalisierung: Feld → Text */
	fields?: Record<string, string>;
	/** Datei-Felder: Feld → Datei-IDs */
	files?: Record<string, number[]>;
	/** Bundle: Bestandteil → gewählte Variante */
	bundle?: Record<string, number>;
	/** Gutschein: Empfänger */
	gift?: { name: string; email: string; message: string };
}

/** Gespeicherte, lesbare Fassung in der Bestellung (Bezeichnungen können sich später ändern) */
export interface LineConfigSnapshot {
	fields?: { key: string; label: string; value: string; surcharge: number }[];
	files?: { key: string; label: string; fileIds: number[] }[];
	bundle?: { title: string; variantTitle: string; quantity: number }[];
	gift?: { name: string; email: string; message: string };
}

export interface StockMove {
	variantId: number;
	quantity: number;
}

export interface AddressSnapshot {
	firstName: string;
	lastName: string;
	company: string;
	street: string;
	zip: string;
	city: string;
	country: string;
	phone: string;
}

export type TaxCase = 'normal' | 'reverse_charge' | 'export' | 'kleinunternehmer';

export interface InvoiceLine {
	title: string;
	detail: string;
	quantity: number;
	unitPrice: number;
	total: number;
	taxRate: number;
	/** Differenzbesteuert (§ 24 UStG): keine USt. ausgewiesen */
	margin?: boolean;
}

export interface InvoiceData {
	company: {
		name: string;
		street: string;
		zip: string;
		city: string;
		country: string;
		email: string;
		phone: string;
		uid: string;
		fn: string;
		court: string;
		iban: string;
		bic: string;
		bank: string;
		web: string;
	};
	customer: AddressSnapshot & { email: string; vatId: string };
	orderNumber: number;
	orderDate: string;
	paymentMethod: string;
	paid: boolean;
	lines: InvoiceLine[];
	/** Abzüge wie Rabatt */
	deductions: { label: string; amount: number }[];
	net: number;
	tax: number;
	total: number;
	taxBreakdown: { rate: number; net: number; tax: number; margin?: boolean }[];
	taxCase: TaxCase;
	notes: string[];
	title: string;
	refNumber?: string;
	locale: Locale;
}

export const ORDER_STATUS = ['zahlung_offen', 'in_bearbeitung', 'abholbereit', 'versendet', 'abgeschlossen', 'storniert'] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

/** Hochgeladene Datei, wie die Oberfläche sie kennt */
export interface UploadedFile {
	id: number;
	key: string;
	name: string;
	mime: string;
	size: number;
	preview: boolean;
}
