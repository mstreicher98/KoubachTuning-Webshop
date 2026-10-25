import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type {
	AddressSnapshot,
	LineConfig,
	LineConfigSnapshot,
	PersonalizationField,
	ProductOption,
	StockMove,
	InvoiceData,
	ProductSpec
} from '$lib/shop-types';

const bool = (name: string) => integer(name, { mode: 'boolean' });
const stamp = (name: string) => integer(name, { mode: 'timestamp_ms' });
const created = () =>
	stamp('created_at')
		.notNull()
		.$defaultFn(() => new Date());
const json = <T>(name: string) => text(name, { mode: 'json' }).$type<T>();

const timestamps = {
	createdAt: created(),
	updatedAt: stamp('updated_at')
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
};

/* ================================================================ Team (interner Bereich) */

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	name: text('name').notNull(),
	email: text('email'),
	role: text('role', { enum: ['admin', 'mitarbeiter'] })
		.notNull()
		.default('mitarbeiter'),
	passwordHash: text('password_hash').notNull(),
	mustChangePassword: bool('must_change_password').notNull().default(true),
	/** Base32-Geheimnis der Authenticator-App; null = noch nicht eingerichtet */
	totpSecret: text('totp_secret'),
	totpEnabled: bool('totp_enabled').notNull().default(false),
	/** Zuletzt benutzter 30-Sekunden-Schritt – ein Code gilt nur einmal */
	totpLastStep: integer('totp_last_step'),
	/** Der erste Admin: kann nicht gelöscht oder herabgestuft werden */
	owner: bool('owner').notNull().default(false),
	active: bool('active').notNull().default(true),
	/** Neue Bestellungen, Nachrichten und Freigaben per E-Mail melden */
	notifyEmail: bool('notify_email').notNull().default(true),
	/** … und als Push-Nachricht an alle Geräte, auf denen sie eingeschaltet ist */
	notifyPush: bool('notify_push').notNull().default(true),
	lastLoginAt: stamp('last_login_at'),
	...timestamps
});

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: stamp('expires_at').notNull(),
		persistent: bool('persistent').notNull().default(false),
		userAgent: text('user_agent'),
		createdAt: created()
	},
	(t) => [index('sessions_user_idx').on(t.userId)]
);

/** Zwischenschritt nach richtigem Passwort, bis der 2FA-Code eingegeben ist */
export const loginChallenges = sqliteTable('login_challenges', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	persistent: bool('persistent').notNull().default(false),
	attempts: integer('attempts').notNull().default(0),
	expiresAt: stamp('expires_at').notNull()
});

/** Web-Push: ein Eintrag je Gerät und Browser */
export const pushSubscriptions = sqliteTable('push_subscriptions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	endpoint: text('endpoint').notNull().unique(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	userAgent: text('user_agent'),
	createdAt: created()
});

/* ================================================================ Medien */

/** Öffentliche Bilder (Produkte, Startseite, Projekte) als WebP in mehreren Größen */
export const media = sqliteTable('media', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kind: text('kind', { enum: ['bild', 'dokument'] })
		.notNull()
		.default('bild'),
	file: text('file').notNull().unique(),
	originalName: text('original_name').notNull().default(''),
	widths: text('widths').notNull(),
	width: integer('width').notNull(),
	height: integer('height').notNull(),
	sizeBytes: integer('size_bytes').notNull().default(0),
	alt: text('alt').notNull().default(''),
	uploadedById: integer('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
	createdAt: created()
});

/**
 * Nicht öffentliche Dateien: Fotos und Logos, die Kunden hochladen, und
 * Entwürfe des Teams. Abrufbar nur über den zufälligen Schlüssel.
 */
export const files = sqliteTable(
	'files',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		/** Zufälliger Schlüssel in der Adresse /datei/<key> */
		key: text('key').notNull().unique(),
		originalName: text('original_name').notNull(),
		mime: text('mime').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		/** Vorschau als WebP (nur bei Bildern) */
		hasPreview: bool('has_preview').notNull().default(false),
		width: integer('width'),
		height: integer('height'),
		source: text('source', { enum: ['kunde', 'team'] }).notNull(),
		cartId: text('cart_id'),
		orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
		userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
		createdAt: created()
	},
	(t) => [index('files_order_idx').on(t.orderId), index('files_cart_idx').on(t.cartId)]
);

/* ================================================================ Einstellungen, Protokoll */

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

/** Fortlaufende Nummern (Bestellungen, Rechnungen je Jahr) */
export const counters = sqliteTable('counters', {
	key: text('key').primaryKey(),
	value: integer('value').notNull()
});

export const auditLog = sqliteTable(
	'audit_log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
		action: text('action').notNull(),
		entity: text('entity').notNull(),
		entityId: integer('entity_id'),
		label: text('label').notNull().default(''),
		createdAt: created()
	},
	(t) => [index('audit_created_idx').on(t.createdAt)]
);

export const pageViews = sqliteTable(
	'page_views',
	{
		day: text('day').notNull(),
		path: text('path').notNull(),
		views: integer('views').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.day, t.path] })]
);

/** Jede verschickte (oder gescheiterte) E-Mail – zur Fehlersuche im Admin */
export const mailLog = sqliteTable(
	'mail_log',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		to: text('to').notNull(),
		subject: text('subject').notNull(),
		template: text('template').notNull(),
		status: text('status', { enum: ['gesendet', 'fehler', 'nicht_eingerichtet'] }).notNull(),
		error: text('error'),
		orderId: integer('order_id'),
		createdAt: created()
	},
	(t) => [index('mail_created_idx').on(t.createdAt)]
);

/* ================================================================ Kunden */

export const customers = sqliteTable('customers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	/** null = bisher nur Anmeldung per Link */
	passwordHash: text('password_hash'),
	emailVerifiedAt: stamp('email_verified_at'),
	firstName: text('first_name').notNull().default(''),
	lastName: text('last_name').notNull().default(''),
	phone: text('phone').notNull().default(''),
	company: text('company').notNull().default(''),
	vatId: text('vat_id').notNull().default(''),
	/** Ergebnis der letzten UID-Prüfung (VIES) */
	vatIdValid: bool('vat_id_valid'),
	vatIdCheckedAt: stamp('vat_id_checked_at'),
	locale: text('locale', { enum: ['de', 'en'] })
		.notNull()
		.default('de'),
	active: bool('active').notNull().default(true),
	internalNote: text('internal_note').notNull().default(''),
	lastLoginAt: stamp('last_login_at'),
	...timestamps
});

export const customerSessions = sqliteTable(
	'customer_sessions',
	{
		id: text('id').primaryKey(),
		customerId: integer('customer_id')
			.notNull()
			.references(() => customers.id, { onDelete: 'cascade' }),
		expiresAt: stamp('expires_at').notNull(),
		persistent: bool('persistent').notNull().default(false),
		createdAt: created()
	},
	(t) => [index('customer_sessions_customer_idx').on(t.customerId)]
);

/** Einmal-Links: Anmelden per Mail, E-Mail bestätigen, Passwort zurücksetzen */
export const customerTokens = sqliteTable('customer_tokens', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
	purpose: text('purpose', { enum: ['login', 'verify', 'reset'] }).notNull(),
	expiresAt: stamp('expires_at').notNull(),
	usedAt: stamp('used_at'),
	createdAt: created()
});

export const addresses = sqliteTable('addresses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	customerId: integer('customer_id')
		.notNull()
		.references(() => customers.id, { onDelete: 'cascade' }),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	company: text('company').notNull().default(''),
	street: text('street').notNull(),
	zip: text('zip').notNull(),
	city: text('city').notNull(),
	country: text('country').notNull(),
	phone: text('phone').notNull().default(''),
	isDefault: bool('is_default').notNull().default(false),
	createdAt: created()
});

/* ================================================================ Sortiment */

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	parentId: integer('parent_id'),
	name: text('name').notNull(),
	nameEn: text('name_en').notNull().default(''),
	/** Kurzer Zusatz im Menü, z. B. „Für dein nächstes Upgrade“ */
	tagline: text('tagline').notNull().default(''),
	taglineEn: text('tagline_en').notNull().default(''),
	descriptionHtml: text('description_html').notNull().default(''),
	descriptionHtmlEn: text('description_html_en').notNull().default(''),
	mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
	sortOrder: integer('sort_order').notNull().default(0),
	active: bool('active').notNull().default(true),
	showInMenu: bool('show_in_menu').notNull().default(true)
});

export const products = sqliteTable(
	'products',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		slug: text('slug').notNull().unique(),
		/** fahrzeug = Inserat, nur auf Anfrage (kein Warenkorb) */
		kind: text('kind', { enum: ['standard', 'fahrzeug', 'gutschein', 'bundle'] })
			.notNull()
			.default('standard'),
		status: text('status', { enum: ['entwurf', 'aktiv', 'archiviert'] })
			.notNull()
			.default('entwurf'),
		title: text('title').notNull(),
		titleEn: text('title_en').notNull().default(''),
		subtitle: text('subtitle').notNull().default(''),
		subtitleEn: text('subtitle_en').notNull().default(''),
		descriptionHtml: text('description_html').notNull().default(''),
		descriptionHtmlEn: text('description_html_en').notNull().default(''),
		/** Hersteller, z. B. Malossi, Polini, Michelin */
		brand: text('brand').notNull().default(''),
		condition: text('condition', { enum: ['neu', 'gebraucht', 'ueberholt'] })
			.notNull()
			.default('neu'),
		/** Zustand im Detail (Gebrauchsspuren, Laufleistung …) */
		conditionNote: text('condition_note').notNull().default(''),
		conditionNoteEn: text('condition_note_en').notNull().default(''),
		/** Technische Daten als Liste, z. B. Hubraum, Passend für, Reifendimension, DOT */
		specs: json<ProductSpec[]>('specs').notNull().default([]),
		/** Differenzbesteuerung nach § 24 UStG (z. B. gebraucht von Privat angekauft) */
		marginScheme: bool('margin_scheme').notNull().default(false),
		/** Auswahlmöglichkeiten wie Größe oder Farbe; jede Kombination ist eine Variante */
		options: json<ProductOption[]>('options').notNull().default([]),
		/** bestand = Lager führen, auf_bestellung = wird bei Bestellung gefertigt */
		stockMode: text('stock_mode', { enum: ['bestand', 'auf_bestellung'] })
			.notNull()
			.default('auf_bestellung'),
		/** Bei Bestand 0 trotzdem bestellbar (Nachlieferung) */
		backorder: bool('backorder').notNull().default(false),
		/** Vorbestellung: erscheint erst ab diesem Tag (YYYY-MM-DD) */
		releaseDate: text('release_date'),
		leadTime: text('lead_time').notNull().default(''),
		leadTimeEn: text('lead_time_en').notNull().default(''),
		/** Zusätzliche Angaben beim Bestellen, im Admin je Produkt zusammengestellt */
		fields: json<PersonalizationField[]>('fields').notNull().default([]),
		requiresShipping: bool('requires_shipping').notNull().default(true),
		featured: bool('featured').notNull().default(false),
		sortOrder: integer('sort_order').notNull().default(0),
		...timestamps
	},
	(t) => [index('products_status_idx').on(t.status)]
);

export const productCategories = sqliteTable(
	'product_categories',
	{
		productId: integer('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.productId, t.categoryId] }), index('product_categories_cat_idx').on(t.categoryId)]
);

export const productImages = sqliteTable(
	'product_images',
	{
		productId: integer('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		mediaId: integer('media_id')
			.notNull()
			.references(() => media.id, { onDelete: 'cascade' }),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [primaryKey({ columns: [t.productId, t.mediaId] })]
);

export const variants = sqliteTable(
	'variants',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		productId: integer('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		sku: text('sku').notNull().default(''),
		/** Gewählte Werte in der Reihenfolge der Produkt-Optionen, z. B. ["M", "Schwarz"] */
		optionValues: json<string[]>('option_values').notNull().default([]),
		/** Preis in Cent inkl. USt. */
		price: integer('price').notNull(),
		/** Durchgestrichener Vergleichspreis */
		compareAtPrice: integer('compare_at_price'),
		stock: integer('stock').notNull().default(0),
		active: bool('active').notNull().default(true),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [index('variants_product_idx').on(t.productId)]
);

/** Bestandteile eines Bundles; bei mehreren Varianten wählt der Kunde */
export const bundleItems = sqliteTable('bundle_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	bundleId: integer('bundle_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	productId: integer('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'restrict' }),
	quantity: integer('quantity').notNull().default(1),
	sortOrder: integer('sort_order').notNull().default(0)
});

/* ================================================================ Warenkorb */

export const carts = sqliteTable('carts', {
	/** SHA-256 des Cookie-Werts */
	id: text('id').primaryKey(),
	customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
	country: text('country').notNull().default('AT'),
	discountCode: text('discount_code'),
	giftCardCodes: json<string[]>('gift_card_codes').notNull().default([]),
	...timestamps
});

export const cartItems = sqliteTable(
	'cart_items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		cartId: text('cart_id')
			.notNull()
			.references(() => carts.id, { onDelete: 'cascade' }),
		productId: integer('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		variantId: integer('variant_id')
			.notNull()
			.references(() => variants.id, { onDelete: 'cascade' }),
		quantity: integer('quantity').notNull().default(1),
		config: json<LineConfig>('config').notNull().default({}),
		/** Gleiche Konfiguration → Menge erhöhen statt neue Zeile */
		configKey: text('config_key').notNull().default(''),
		createdAt: created()
	},
	(t) => [index('cart_items_cart_idx').on(t.cartId)]
);

/* ================================================================ Bestellungen */

export const orders = sqliteTable(
	'orders',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		number: integer('number').notNull().unique(),
		/** Zufälliger Schlüssel für den Link in den E-Mails (auch ohne Konto) */
		token: text('token').notNull().unique(),
		customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
		email: text('email').notNull(),
		phone: text('phone').notNull().default(''),
		locale: text('locale', { enum: ['de', 'en'] })
			.notNull()
			.default('de'),
		status: text('status', {
			enum: ['zahlung_offen', 'in_bearbeitung', 'abholbereit', 'versendet', 'abgeschlossen', 'storniert']
		})
			.notNull()
			.default('zahlung_offen'),
		paymentStatus: text('payment_status', { enum: ['offen', 'bezahlt', 'erstattet', 'fehlgeschlagen'] })
			.notNull()
			.default('offen'),
		paymentMethod: text('payment_method').notNull(),
		billingAddress: json<AddressSnapshot>('billing_address').notNull(),
		shippingAddress: json<AddressSnapshot>('shipping_address'),
		shippingMethod: text('shipping_method', { enum: ['versand', 'abholung', 'keiner'] }).notNull(),
		shippingCountry: text('shipping_country'),
		/** Beträge in Cent */
		subtotal: integer('subtotal').notNull(),
		discountTotal: integer('discount_total').notNull().default(0),
		shippingTotal: integer('shipping_total').notNull().default(0),
		taxTotal: integer('tax_total').notNull().default(0),
		total: integer('total').notNull(),
		giftCardTotal: integer('gift_card_total').notNull().default(0),
		/** Was noch über die Zahlungsart zu zahlen ist (Summe minus Gutscheine) */
		amountDue: integer('amount_due').notNull(),
		taxMode: text('tax_mode', { enum: ['kleinunternehmer', 'regel'] }).notNull(),
		/** normal, reverse_charge oder export – bestimmt den Hinweis auf der Rechnung */
		taxCase: text('tax_case', { enum: ['normal', 'reverse_charge', 'export', 'kleinunternehmer'] }).notNull(),
		/** Steuersatz in Basispunkten (2000 = 20 %) */
		taxRate: integer('tax_rate').notNull().default(0),
		vatId: text('vat_id').notNull().default(''),
		discountCode: text('discount_code'),
		customerNote: text('customer_note').notNull().default(''),
		internalNote: text('internal_note').notNull().default(''),
		paidAt: stamp('paid_at'),
		trackingCarrier: text('tracking_carrier').notNull().default(''),
		trackingNumber: text('tracking_number').notNull().default(''),
		trackingUrl: text('tracking_url').notNull().default(''),
		shippedAt: stamp('shipped_at'),
		cancelledAt: stamp('cancelled_at'),
		...timestamps
	},
	(t) => [index('orders_customer_idx').on(t.customerId), index('orders_email_idx').on(t.email), index('orders_status_idx').on(t.status)]
);

export const orderItems = sqliteTable(
	'order_items',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
		variantId: integer('variant_id').references(() => variants.id, { onDelete: 'set null' }),
		kind: text('kind', { enum: ['standard', 'fahrzeug', 'gutschein', 'bundle'] }).notNull(),
		title: text('title').notNull(),
		variantTitle: text('variant_title').notNull().default(''),
		sku: text('sku').notNull().default(''),
		quantity: integer('quantity').notNull(),
		/** Stückpreis inkl. Aufpreisen */
		unitPrice: integer('unit_price').notNull(),
		lineTotal: integer('line_total').notNull(),
		/** Anteil am Rabatt (für Rechnung und Steuer) */
		discountShare: integer('discount_share').notNull().default(0),
		/** Differenzbesteuert nach § 24 UStG – keine ausgewiesene USt. */
		marginScheme: bool('margin_scheme').notNull().default(false),
		config: json<LineConfigSnapshot>('config').notNull().default({}),
		/** Abgebuchter Lagerbestand – wird beim Stornieren zurückgebucht */
		stockMoves: json<StockMove[]>('stock_moves').notNull().default([])
	},
	(t) => [index('order_items_order_idx').on(t.orderId)]
);

export const payments = sqliteTable(
	'payments',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		purpose: text('purpose', { enum: ['bestellung'] }).notNull().default('bestellung'),
		method: text('method').notNull(),
		amount: integer('amount').notNull(),
		status: text('status', { enum: ['offen', 'bezahlt', 'fehlgeschlagen', 'abgebrochen', 'erstattet'] })
			.notNull()
			.default('offen'),
		/** Checkout-Session (Stripe) bzw. Order-ID (PayPal) */
		providerRef: text('provider_ref'),
		/** Schlüssel für den Zahlungslink /zahlung/<token> */
		token: text('token').notNull().unique(),
		note: text('note').notNull().default(''),
		paidAt: stamp('paid_at'),
		createdAt: created()
	},
	(t) => [index('payments_order_idx').on(t.orderId), index('payments_ref_idx').on(t.providerRef)]
);

export const invoices = sqliteTable(
	'invoices',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		number: text('number').notNull().unique(),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'restrict' }),
		paymentId: integer('payment_id'),
		kind: text('kind', { enum: ['rechnung', 'storno'] }).notNull(),
		/** Bei Storno: die stornierte Rechnung */
		refInvoiceId: integer('ref_invoice_id'),
		issuedAt: stamp('issued_at').notNull(),
		net: integer('net').notNull(),
		tax: integer('tax').notNull(),
		total: integer('total').notNull(),
		/** Vollständiger Stand zum Ausstellungszeitpunkt – spätere Änderungen wirken nicht zurück */
		data: json<InvoiceData>('data').notNull()
	},
	(t) => [index('invoices_order_idx').on(t.orderId), index('invoices_issued_idx').on(t.issuedAt)]
);

/** Nachrichten zwischen Kunde und Team zu einer Bestellung */
export const messages = sqliteTable(
	'messages',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		author: text('author', { enum: ['kunde', 'team', 'system'] }).notNull(),
		userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
		body: text('body').notNull(),
		fileIds: json<number[]>('file_ids').notNull().default([]),
		readByTeamAt: stamp('read_by_team_at'),
		readByCustomerAt: stamp('read_by_customer_at'),
		createdAt: created()
	},
	(t) => [index('messages_order_idx').on(t.orderId)]
);

/* ------------------------------------------------------------ Gutscheine & Rabatte */

export const giftCards = sqliteTable('gift_cards', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull().unique(),
	initialValue: integer('initial_value').notNull(),
	balance: integer('balance').notNull(),
	/** Kauf im Shop (null = im Admin angelegt) */
	orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
	orderItemId: integer('order_item_id'),
	recipientName: text('recipient_name').notNull().default(''),
	recipientEmail: text('recipient_email').notNull().default(''),
	message: text('message').notNull().default(''),
	active: bool('active').notNull().default(true),
	sentAt: stamp('sent_at'),
	note: text('note').notNull().default(''),
	createdAt: created()
});

export const giftCardTransactions = sqliteTable('gift_card_transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	giftCardId: integer('gift_card_id')
		.notNull()
		.references(() => giftCards.id, { onDelete: 'cascade' }),
	orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
	/** negativ = eingelöst, positiv = aufgeladen / zurückgebucht */
	amount: integer('amount').notNull(),
	note: text('note').notNull().default(''),
	createdAt: created()
});

export const discountCodes = sqliteTable('discount_codes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull().unique(),
	kind: text('kind', { enum: ['prozent', 'betrag', 'versandfrei'] }).notNull(),
	/** Prozent (ganze Zahl) oder Betrag in Cent */
	value: integer('value').notNull().default(0),
	minOrder: integer('min_order'),
	validFrom: text('valid_from'),
	validUntil: text('valid_until'),
	maxUses: integer('max_uses'),
	usedCount: integer('used_count').notNull().default(0),
	oncePerCustomer: bool('once_per_customer').notNull().default(false),
	/** leer = alle Kategorien */
	categoryIds: json<number[]>('category_ids').notNull().default([]),
	active: bool('active').notNull().default(true),
	note: text('note').notNull().default(''),
	createdAt: created()
});

export const discountRedemptions = sqliteTable(
	'discount_redemptions',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		codeId: integer('code_id')
			.notNull()
			.references(() => discountCodes.id, { onDelete: 'cascade' }),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		createdAt: created()
	},
	(t) => [uniqueIndex('discount_redemptions_order_idx').on(t.orderId)]
);

/* ------------------------------------------------------------ Versand */

export const shippingCountries = sqliteTable('shipping_countries', {
	/** ISO-3166 Alpha-2, z. B. AT */
	code: text('code').primaryKey(),
	name: text('name').notNull(),
	nameEn: text('name_en').notNull(),
	active: bool('active').notNull().default(false),
	/** Pauschale in Cent inkl. USt. */
	price: integer('price').notNull().default(0),
	/** Versandkostenfrei ab (Warenwert in Cent) */
	freeFrom: integer('free_from'),
	eu: bool('eu').notNull().default(false),
	/** Normalsteuersatz des Landes (Basispunkte) – nur für OSS */
	vatRate: integer('vat_rate').notNull().default(0),
	sortOrder: integer('sort_order').notNull().default(0)
});

/* ================================================================ Inhalte */

export const pages = sqliteTable('pages', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	titleEn: text('title_en').notNull().default(''),
	contentHtml: text('content_html').notNull().default(''),
	contentHtmlEn: text('content_html_en').notNull().default(''),
	/** Spalte im Footer */
	group: text('group', { enum: ['bestellung', 'hilfe', 'rechtliches', 'keine'] })
		.notNull()
		.default('hilfe'),
	sortOrder: integer('sort_order').notNull().default(0),
	updatedAt: stamp('updated_at')
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
});

/** Projekte und Umbauten für die Galerie auf der Startseite */
export const showcase = sqliteTable('showcase', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	mediaId: integer('media_id')
		.notNull()
		.references(() => media.id, { onDelete: 'cascade' }),
	title: text('title').notNull().default(''),
	/** Fahrzeug, z. B. „Derbi Senda 50“ */
	vehicle: text('vehicle').notNull().default(''),
	productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
	sortOrder: integer('sort_order').notNull().default(0),
	active: bool('active').notNull().default(true),
	createdAt: created()
});

export const testimonials = sqliteTable('testimonials', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	text: text('text').notNull(),
	textEn: text('text_en').notNull().default(''),
	rating: integer('rating').notNull().default(5),
	/** Fahrzeug, z. B. „Derbi Senda 50“ */
	vehicle: text('vehicle').notNull().default(''),
	sortOrder: integer('sort_order').notNull().default(0),
	active: bool('active').notNull().default(true),
	createdAt: created()
});

export const inquiries = sqliteTable(
	'inquiries',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		email: text('email').notNull(),
		phone: text('phone').notNull().default(''),
		/** kontakt = allgemeines Formular, fahrzeug/produkt = Anfrage zu einem Inserat oder Artikel */
		kind: text('kind', { enum: ['kontakt', 'fahrzeug', 'produkt'] })
			.notNull()
			.default('kontakt'),
		productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
		productTitle: text('product_title').notNull().default(''),
		subject: text('subject').notNull().default(''),
		message: text('message').notNull(),
		locale: text('locale', { enum: ['de', 'en'] })
			.notNull()
			.default('de'),
		status: text('status', { enum: ['neu', 'in_bearbeitung', 'erledigt'] })
			.notNull()
			.default('neu'),
		internalNote: text('internal_note').notNull().default(''),
		createdAt: created()
	},
	(t) => [index('inquiries_status_idx').on(t.status)]
);

/* ================================================================ Typen */

export type User = typeof users.$inferSelect;
export type Media = typeof media.$inferSelect;
export type FileRow = typeof files.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GiftCard = typeof giftCards.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type ShippingCountry = typeof shippingCountries.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
