#!/usr/bin/env node
/**
 * Beispieldaten zum Ausprobieren: Neuteile, Gebrauchtteile, Reifen, ein Fahrzeug und ein Gutschein
 * (angelehnt an die Beispiele aus dem Prototyp). Die Produkte beginnen mit „demo-“ in der Adresse
 * und lassen sich wieder entfernen. Preise und Angaben sind Platzhalter.
 *
 *   node scripts/demo.mjs              anlegen
 *   node scripts/demo.mjs --entfernen  Demo-Produkte löschen (nur solche ohne Bestellungen)
 *
 * Voraussetzung: der Shop wurde einmal gestartet (Datenbank und Grunddaten existieren).
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@libsql/client';

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const db = createClient({ url: `file:${path.join(DATA_DIR, 'shop.db')}` });
const one = async (sql, args = []) => (await db.execute({ sql, args })).rows[0];
const all = async (sql, args = []) => (await db.execute({ sql, args })).rows;
const run = (sql, args = []) => db.execute({ sql, args });

if (!(await one("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'"))) {
	console.error('Keine Datenbank gefunden – bitte den Shop zuerst einmal starten.');
	process.exit(1);
}

if (process.argv.includes('--entfernen')) {
	const rows = await all("SELECT id, title FROM products WHERE slug LIKE 'demo-%' AND id NOT IN (SELECT product_id FROM order_items WHERE product_id IS NOT NULL)");
	for (const r of rows) await run('DELETE FROM products WHERE id = ?', [r.id]);
	console.log(`${rows.length} Demo-Produkte entfernt.`);
	process.exit(0);
}

/** Bild aus seed/ wie media.ts ablegen (WebP in 400/800/1600) */
async function image(rel, alt) {
	const file = path.resolve('seed', rel);
	if (!fs.existsSync(file)) return null;
	const meta = await sharp(file).metadata();
	const widths = [400, 800, 1600].filter((w) => w <= meta.width);
	if (!widths.length || widths.at(-1) < meta.width) widths.push(Math.min(meta.width, 1600));
	const name = randomBytes(10).toString('hex');
	let info;
	for (const w of [...new Set(widths)]) info = await sharp(file).resize({ width: w }).webp({ quality: 80 }).toFile(path.join(UPLOAD_DIR, `${name}-${w}.webp`));
	const r = await one('INSERT INTO media (kind, file, original_name, widths, width, height, size_bytes, alt, created_at) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id', [
		'bild',
		name,
		path.basename(file),
		[...new Set(widths)].join(','),
		info.width,
		info.height,
		info.size,
		alt,
		Date.now()
	]);
	return Number(r.id);
}

const cat = async (slug) => Number((await one('SELECT id FROM categories WHERE slug = ?', [slug]))?.id ?? 0) || null;
const html = (text) =>
	text
		.split('\n\n')
		.map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
		.join('');
const spec = (label, value, labelEn = label, valueEn = '') => ({ label, labelEn, value, valueEn });

const products = [
	{
		slug: 'demo-voca-warrior',
		title: 'Warrior Auspuff 50/70 ccm',
		brand: 'VOCA',
		subtitle: 'Sportauspuff mit rotem Endschalldämpfer',
		desc: 'Resonanzauspuff für Derbi-Motoren. Beispielangebot – Passform und Zulassung vor dem Kauf prüfen.',
		cats: ['neuteile', 'auspuff'],
		specs: [spec('Passend für', 'Derbi EBE / EBS / D50B', 'Fits'), spec('Hubraum', '50–70 ccm', 'Displacement'), spec('Straßenzulassung', 'Nein (Rennsport)', 'Road approval', 'No (racing)')],
		variants: [{ values: [], price: 20990, stock: 4 }],
		stock: true,
		featured: true
	},
	{
		slug: 'demo-krm-pro-ride',
		title: 'Pro Ride 80–90 ccm',
		brand: 'KRM',
		subtitle: 'Auspuffanlage für Minarelli AM6',
		desc: 'Auspuffanlage für dein AM6-Setup. Beispielprodukt; Preis und Bestand sind vor Verkaufsstart zu bestätigen.',
		cats: ['neuteile', 'auspuff'],
		specs: [spec('Passend für', 'Minarelli AM6', 'Fits'), spec('Hubraum', '80–90 ccm', 'Displacement')],
		variants: [{ values: [], price: 32950, stock: 2 }],
		stock: true,
		featured: true,
		fields: true
	},
	{
		slug: 'demo-zylinderkit-70',
		title: 'Zylinderkit 70 ccm',
		brand: 'Malossi',
		subtitle: 'Grauguss, inkl. Kolben und Dichtungen',
		desc: 'Platzhalter für ein Zylinderkit. Hersteller, technische Daten und Lieferumfang im Adminbereich ergänzen.',
		cats: ['neuteile', 'motor-zylinder'],
		specs: [spec('Passend für', 'Minarelli AM6', 'Fits'), spec('Bohrung', '47,6 mm', 'Bore'), spec('Material', 'Grauguss', 'Material', 'Cast iron')],
		options: [{ name: 'Ausführung', nameEn: 'Version', values: [{ de: 'Ohne Kopf', en: 'Without head' }, { de: 'Mit Zylinderkopf', en: 'With cylinder head' }] }],
		variants: [
			{ values: ['Ohne Kopf'], price: 15990, stock: 3 },
			{ values: ['Mit Zylinderkopf'], price: 19490, stock: 1 }
		],
		stock: true,
		featured: true
	},
	{
		slug: 'demo-vergaser-17-5',
		title: 'Original-Vergaser 17,5 mm',
		brand: 'Dell’Orto',
		condition: 'gebraucht',
		conditionNote: 'Ausgebaut aus einer Derbi Senda, gereinigt, Schwimmernadel neu. Leichte Gebrauchsspuren am Gehäuse.',
		desc: 'Beispiel eines Gebrauchtteils. Hier dokumentiert ihr Zustand, Laufleistung und sichtbare Gebrauchsspuren mit eigenen Fotos.',
		cats: ['gebrauchtteile'],
		specs: [spec('Durchlass', '17,5 mm', 'Bore'), spec('Passend für', 'Derbi Senda 50', 'Fits')],
		variants: [{ values: [], price: 4500, stock: 1 }],
		stock: true,
		margin: true,
		featured: true
	},
	{
		slug: 'demo-felgensatz-17',
		title: 'Supermoto-Felgensatz 17 Zoll',
		condition: 'gebraucht',
		conditionNote: 'Felgen gerade, Lager laufen sauber. Kratzer an der Hinterradfelge.',
		desc: 'Beispielangebot für gebrauchte Felgen. Tatsächlichen Zustand und Achsmaße vor Veröffentlichung ergänzen.',
		cats: ['gebrauchtteile'],
		specs: [spec('Größe', '17 Zoll vorne und hinten', 'Size', '17 inch front and rear'), spec('Achse', 'Maße bitte ergänzen', 'Axle', 'Please add dimensions')],
		variants: [{ values: [], price: 24900, stock: 1 }],
		stock: true,
		margin: true
	},
	{
		slug: 'demo-sportreifen-130-70-17',
		title: 'Sportreifen 130/70-17',
		brand: 'Michelin',
		subtitle: 'Hinterreifen',
		desc: 'Neureifen-Beispiel für den Hinterreifen. Geschwindigkeitsindex, Tragfähigkeit und DOT werden vor Verkaufsstart ergänzt.',
		cats: ['reifen', 'reifen-motorrad'],
		specs: [spec('Dimension', '130/70-17', 'Size'), spec('Last-/Geschwindigkeitsindex', '62H', 'Load/speed index'), spec('Einsatz', 'Straße, Supermoto', 'Use', 'Road, supermoto')],
		variants: [{ values: [], price: 6990, stock: 6 }],
		stock: true
	},
	{
		slug: 'demo-sportreifen-100-80-17',
		title: 'Sportreifen 100/80-17',
		brand: 'Michelin',
		subtitle: 'Vorderreifen',
		desc: 'Beispiel für einen neuen Vorderreifen. Verbindliche Produktdaten und Verfügbarkeit im Adminbereich eintragen.',
		cats: ['reifen', 'reifen-motorrad'],
		specs: [spec('Dimension', '100/80-17', 'Size'), spec('Last-/Geschwindigkeitsindex', '52H', 'Load/speed index')],
		variants: [{ values: [], price: 5990, stock: 4 }],
		stock: true
	},
	{
		slug: 'demo-supermoto-50',
		kind: 'fahrzeug',
		title: 'Supermoto 50 Projektbike',
		brand: 'Koubach Tuning',
		condition: 'gebraucht',
		subtitle: '50 ccm, aufgebaut in unserer Werkstatt',
		conditionNote: 'Beispielinserat: Zustand, Kilometerstand und Umbauten bei echten Inseraten selbst eintragen.',
		desc: 'So könnte ein Fahrzeug-Inserat aussehen. Das Bild ist eine Visualisierung und zeigt kein tatsächlich angebotenes Fahrzeug.',
		cats: ['fahrzeuge'],
		image: 'startseite/hero.jpg',
		specs: [spec('Erstzulassung', '2014', 'First registration'), spec('Kilometerstand', 'ca. 8.500 km', 'Mileage', 'approx. 8,500 km'), spec('Hubraum', '50 ccm', 'Displacement', '50 cc'), spec('Typisierung', 'Moped, 45 km/h', 'Type approval', 'Moped, 45 km/h')],
		variants: [{ values: [], price: 249000, stock: 1 }],
		stock: true,
		margin: true,
		noShipping: true
	},
	{
		slug: 'demo-gutschein',
		kind: 'gutschein',
		title: 'Gutschein',
		titleEn: 'Gift card',
		subtitle: 'Per E-Mail, sofort',
		subtitleEn: 'By email, instantly',
		desc: 'Der Gutschein kommt per E-Mail – an dich oder direkt an die beschenkte Person.',
		cats: ['gutscheine'],
		options: [{ name: 'Wert', nameEn: 'Value', values: ['25 €', '50 €', '100 €'].map((v) => ({ de: v, en: v })) }],
		variants: [
			{ values: ['25 €'], price: 2500 },
			{ values: ['50 €'], price: 5000 },
			{ values: ['100 €'], price: 10000 }
		],
		noShipping: true
	}
];

/** Vorlage „Fahrzeugangaben“ wie im Produkt-Editor */
const vehicleFields = [
	{ key: 'fahrzeug', type: 'text', label: 'Dein Fahrzeug (Marke und Modell)', labelEn: 'Your vehicle (make and model)', help: '', helpEn: '', placeholder: 'z. B. Derbi Senda DRD Pro 50', placeholderEn: 'e.g. Derbi Senda DRD Pro 50', required: true, choices: [], maxLength: 80, surcharge: 0, maxFiles: 1 },
	{ key: 'baujahr', type: 'text', label: 'Baujahr', labelEn: 'Year', help: '', helpEn: '', placeholder: 'z. B. 2012', placeholderEn: 'e.g. 2012', required: false, choices: [], maxLength: 4, surcharge: 0, maxFiles: 1 }
];

let created = 0;
for (const [i, p] of products.entries()) {
	if (await one('SELECT id FROM products WHERE slug = ?', [p.slug])) continue;
	const now = Date.now();
	const row = await one(
		`INSERT INTO products (slug, kind, status, title, title_en, subtitle, subtitle_en, description_html, description_html_en, brand, condition, condition_note, condition_note_en, specs, margin_scheme,
			options, stock_mode, backorder, lead_time, lead_time_en, fields, requires_shipping, featured, sort_order, created_at, updated_at)
		 VALUES (?,?,'aktiv',?,?,?,?,?,'',?,?,?,'',?,?,?,?,0,?,?,?,?,?,?,?,?) RETURNING id`,
		[
			p.slug,
			p.kind ?? 'standard',
			p.title,
			p.titleEn ?? '',
			p.subtitle ?? '',
			p.subtitleEn ?? '',
			html(p.desc),
			p.brand ?? '',
			p.condition ?? 'neu',
			p.conditionNote ?? '',
			JSON.stringify(p.specs ?? []),
			p.margin ? 1 : 0,
			JSON.stringify(p.options ?? []),
			p.stock ? 'bestand' : 'auf_bestellung',
			p.leadTime ?? '',
			p.leadTimeEn ?? '',
			JSON.stringify(p.fields ? vehicleFields : []),
			p.noShipping ? 0 : 1,
			p.featured ? 1 : 0,
			i,
			now + i,
			now + i
		]
	);
	const id = Number(row.id);
	for (const [j, v] of p.variants.entries()) {
		await run('INSERT INTO variants (product_id, sku, option_values, price, compare_at_price, stock, active, sort_order) VALUES (?,?,?,?,?,?,1,?)', [
			id,
			`${p.slug.replace('demo-', '').toUpperCase()}${v.values.length ? `-${v.values.join('-')}` : ''}`.slice(0, 40),
			JSON.stringify(v.values),
			v.price,
			v.compare ?? null,
			v.stock ?? 0,
			j
		]);
	}
	for (const slug of p.cats) {
		const c = await cat(slug);
		if (c) await run('INSERT INTO product_categories (product_id, category_id) VALUES (?,?)', [id, c]);
	}
	if (p.image) {
		const m = await image(p.image, p.title);
		if (m) await run('INSERT INTO product_images (product_id, media_id, sort_order) VALUES (?,?,0)', [id, m]);
	}
	created++;
}
console.log(`${created} Demo-Produkte angelegt.`);
