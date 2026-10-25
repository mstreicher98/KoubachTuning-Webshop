import fs from 'node:fs';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { generatePassword, hashPassword } from '../auth';
import { storeImage } from '../media';
import { db } from './index';
import { getSettings, saveSettings } from '../settings';
import { categories, pages, shippingCountries, users } from './schema';
import { SEED_PAGES } from './seed-pages';

const count = async (table: typeof users | typeof categories | typeof pages | typeof shippingCountries) =>
	Number((await db.select({ n: sql<number>`count(*)` }).from(table).get())?.n ?? 0);

/** Grunddaten für eine brandneue Installation – bestehende Daten bleiben unberührt */
export async function bootstrap() {
	if ((await count(users)) === 0) await createInitialAdmin();
	if ((await count(shippingCountries)) === 0) await seedCountries();
	if ((await count(pages)) === 0) for (const p of SEED_PAGES) await db.insert(pages).values(p);
	if ((await count(categories)) === 0) {
		await seedCategories();
		await seedHero();
	}
}

async function createInitialAdmin() {
	const username = (env.INITIAL_ADMIN_USERNAME || 'admin').trim().toLowerCase();
	const fromEnv = env.INITIAL_ADMIN_PASSWORD;
	const password = fromEnv || (dev ? 'kt-admin-2026' : generatePassword(16));
	await db.insert(users).values({
		username,
		name: env.INITIAL_ADMIN_NAME || 'Administrator',
		email: (env.INITIAL_ADMIN_EMAIL || 'office@astronox.dev').trim().toLowerCase(),
		role: 'admin',
		owner: true,
		passwordHash: await hashPassword(password),
		mustChangePassword: !dev
	});
	const line = '─'.repeat(60);
	console.info(
		`\n${line}\n  Erster Admin-Zugang angelegt\n  Adresse:      /admin\n  Benutzername: ${username}\n  Passwort:     ${fromEnv ? '(aus INITIAL_ADMIN_PASSWORD)' : password}\n  Beim ersten Login werden ein neues Passwort und die\n  Zwei-Faktor-Anmeldung (Authenticator-App) eingerichtet.\n${line}\n`
	);
}

/** Bilder aus seed/ in die Mediathek übernehmen (fehlt die Datei, bleibt das Bild leer) */
async function seedImage(rel: string, alt: string): Promise<number | null> {
	const file = path.resolve('seed', rel);
	if (!fs.existsSync(file)) return null;
	try {
		const m = await storeImage(fs.readFileSync(file), path.basename(file), null);
		if (alt) await db.run(sql`UPDATE media SET alt = ${alt} WHERE id = ${m.id}`);
		return m.id;
	} catch (err) {
		console.error('[grunddaten]', rel, err);
		return null;
	}
}

async function seedCategories() {
	type C = { slug: string; name: string; nameEn: string; tagline: string; taglineEn: string; children?: Omit<C, 'children'>[] };
	const tree: C[] = [
		{
			slug: 'neuteile',
			name: 'Neuteile',
			nameEn: 'New parts',
			tagline: 'Für dein nächstes Upgrade',
			taglineEn: 'For your next upgrade',
			children: [
				{ slug: 'motor-zylinder', name: 'Motor & Zylinder', nameEn: 'Engine & cylinder', tagline: 'Zylinderkits, Kolben, Kurbelwellen', taglineEn: 'Cylinder kits, pistons, crankshafts' },
				{ slug: 'auspuff', name: 'Auspuff', nameEn: 'Exhaust', tagline: 'Anlagen & Endschalldämpfer', taglineEn: 'Systems & silencers' },
				{ slug: 'vergaser-ansaugung', name: 'Vergaser & Ansaugung', nameEn: 'Carburettor & intake', tagline: 'Vergaser, Düsen, Membranen', taglineEn: 'Carbs, jets, reeds' },
				{ slug: 'kupplung-antrieb', name: 'Kupplung & Antrieb', nameEn: 'Clutch & drive', tagline: 'Kupplung, Kette, Ritzel', taglineEn: 'Clutch, chain, sprockets' },
				{ slug: 'fahrwerk-bremsen', name: 'Fahrwerk & Bremsen', nameEn: 'Chassis & brakes', tagline: 'Federung, Scheiben, Beläge', taglineEn: 'Suspension, discs, pads' },
				{ slug: 'elektrik-zuendung', name: 'Elektrik & Zündung', nameEn: 'Electrics & ignition', tagline: 'Zündung, Licht, Kabel', taglineEn: 'Ignition, lights, wiring' },
				{ slug: 'verkleidung-optik', name: 'Verkleidung & Optik', nameEn: 'Bodywork & styling', tagline: 'Plastik, Lenker, Griffe', taglineEn: 'Plastics, bars, grips' },
				{ slug: 'werkzeug-pflege', name: 'Werkzeug & Pflege', nameEn: 'Tools & care', tagline: 'Öl, Pflege, Werkstatt', taglineEn: 'Oil, care, workshop' }
			]
		},
		{ slug: 'gebrauchtteile', name: 'Gebrauchtteile', nameEn: 'Used parts', tagline: 'Zweite Runde. Volle Leistung.', taglineEn: 'Second round. Full power.' },
		{
			slug: 'reifen',
			name: 'Reifen',
			nameEn: 'Tyres',
			tagline: 'Grip für deinen Weg',
			taglineEn: 'Grip for your ride',
			children: [
				{ slug: 'reifen-moped-roller', name: 'Moped & Roller', nameEn: 'Moped & scooter', tagline: '10 bis 17 Zoll', taglineEn: '10 to 17 inch' },
				{ slug: 'reifen-motorrad', name: 'Motorrad', nameEn: 'Motorcycle', tagline: 'Straße, Supermoto, Offroad', taglineEn: 'Road, supermoto, offroad' }
			]
		},
		{ slug: 'fahrzeuge', name: 'Fahrzeuge', nameEn: 'Vehicles', tagline: 'Dein nächstes Projekt wartet', taglineEn: 'Your next project is waiting' },
		{ slug: 'gutscheine', name: 'Gutscheine', nameEn: 'Gift cards', tagline: 'Zum Verschenken', taglineEn: 'To give away' }
	];
	for (const [i, c] of tree.entries()) {
		const parent = await db
			.insert(categories)
			.values({ slug: c.slug, name: c.name, nameEn: c.nameEn, tagline: c.tagline, taglineEn: c.taglineEn, sortOrder: i })
			.returning()
			.get();
		for (const [j, ch] of (c.children ?? []).entries()) {
			await db.insert(categories).values({ slug: ch.slug, name: ch.name, nameEn: ch.nameEn, tagline: ch.tagline, taglineEn: ch.taglineEn, parentId: parent.id, sortOrder: j });
		}
	}
}

/** Titelbild der Startseite aus seed/ übernehmen */
async function seedHero() {
	const s = await getSettings();
	if (s.home.heroMediaId) return;
	const id = await seedImage('startseite/hero.jpg', 'Supermoto in einer Werkstatt mit roter Beleuchtung');
	if (id) await saveSettings('home', { heroMediaId: id });
}

/** EU-Länder mit Normalsteuersatz (für OSS) und die häufigsten Nachbarn außerhalb der EU */
async function seedCountries() {
	const rows: [string, string, string, boolean, number][] = [
		['AT', 'Österreich', 'Austria', true, 2000],
		['DE', 'Deutschland', 'Germany', true, 1900],
		['IT', 'Italien', 'Italy', true, 2200],
		['CH', 'Schweiz', 'Switzerland', false, 0],
		['LI', 'Liechtenstein', 'Liechtenstein', false, 0],
		['SI', 'Slowenien', 'Slovenia', true, 2200],
		['HU', 'Ungarn', 'Hungary', true, 2700],
		['SK', 'Slowakei', 'Slovakia', true, 2300],
		['CZ', 'Tschechien', 'Czechia', true, 2100],
		['HR', 'Kroatien', 'Croatia', true, 2500],
		['PL', 'Polen', 'Poland', true, 2300],
		['NL', 'Niederlande', 'Netherlands', true, 2100],
		['BE', 'Belgien', 'Belgium', true, 2100],
		['LU', 'Luxemburg', 'Luxembourg', true, 1700],
		['FR', 'Frankreich', 'France', true, 2000],
		['ES', 'Spanien', 'Spain', true, 2100],
		['PT', 'Portugal', 'Portugal', true, 2300],
		['DK', 'Dänemark', 'Denmark', true, 2500],
		['SE', 'Schweden', 'Sweden', true, 2500],
		['FI', 'Finnland', 'Finland', true, 2550],
		['IE', 'Irland', 'Ireland', true, 2300],
		['GR', 'Griechenland', 'Greece', true, 2400],
		['RO', 'Rumänien', 'Romania', true, 2100],
		['BG', 'Bulgarien', 'Bulgaria', true, 2000],
		['EE', 'Estland', 'Estonia', true, 2400],
		['LV', 'Lettland', 'Latvia', true, 2100],
		['LT', 'Litauen', 'Lithuania', true, 2100],
		['CY', 'Zypern', 'Cyprus', true, 1900],
		['MT', 'Malta', 'Malta', true, 1800],
		['GB', 'Vereinigtes Königreich', 'United Kingdom', false, 0],
		['NO', 'Norwegen', 'Norway', false, 0]
	];
	for (const [i, [code, name, nameEn, eu, vatRate]] of rows.entries()) {
		// Aktiv sind zu Beginn nur Österreich und Deutschland – Preise im Admin anpassen
		const active = code === 'AT' || code === 'DE';
		await db.insert(shippingCountries).values({ code, name, nameEn, eu, vatRate, active, price: code === 'AT' ? 590 : code === 'DE' ? 990 : 1590, sortOrder: i });
	}
}
