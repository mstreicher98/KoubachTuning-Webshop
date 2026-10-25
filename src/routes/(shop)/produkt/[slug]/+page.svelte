<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import FileField from '$lib/components/shop/FileField.svelte';
	import Picture from '$lib/components/shop/Picture.svelte';
	import ProductCard from '$lib/components/shop/ProductCard.svelte';
	import Seo from '$lib/components/shop/Seo.svelte';
	import { cartUi } from '$lib/cart-ui.svelte';
	import { getI18n } from '$lib/i18n.svelte';
	import { fade, slide } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import { dur, reveal } from '$lib/motion';
	import { mediaSrc } from '$lib/media';
	import type { UploadedFile } from '$lib/shop-types';
	import { htmlText } from '$lib/text';

	let { data, form } = $props();
	const i = getI18n();
	const p = $derived(data.product);
	const vehicle = $derived(p.kind === 'fahrzeug');

	/* ---------------- Bilder */
	let shown = $state(0);
	$effect.pre(() => {
		void data.product.id;
		shown = 0;
	});

	/* ---------------- Varianten */
	// Startauswahl schon beim Server-Rendern setzen (sonst zeigt die Seite ohne JavaScript 0 € / ausverkauft);
	// beim Wechsel auf ein anderes Produkt (gleiche Komponente) neu setzen
	const startValues = () => [...((data.variants.find((v) => v.limit !== 0) ?? data.variants[0])?.values ?? [])];
	let selected = $state<string[]>(startValues());
	let shownProduct = data.product.id;
	$effect.pre(() => {
		if (data.product.id === shownProduct) return;
		shownProduct = data.product.id;
		selected = startValues();
		fieldValues = {};
		fileLists = {};
		asking = false;
	});
	const variant = $derived(data.options.length ? data.variants.find((v) => v.values.every((val, n) => val === selected[n])) : data.variants[0]);
	/** Gibt es mit diesem Wert (und den übrigen Auswahlen) eine bestellbare Variante? */
	function possible(optIndex: number, value: string) {
		return data.variants.some((v) => v.values[optIndex] === value && v.limit !== 0 && v.values.every((val, n) => n === optIndex || n > optIndex || val === selected[n]));
	}

	/* ---------------- Zusatzangaben */
	let fieldValues = $state<Record<string, string>>({});
	let fileLists = $state<Record<string, UploadedFile[]>>({});
	const surcharges = $derived(
		data.fields.reduce((a, f) => a + (f.surcharge && (f.type === 'datei' ? (fileLists[f.key]?.length ?? 0) > 0 : (fieldValues[f.key] ?? '').trim()) ? f.surcharge : 0), 0)
	);
	const unit = $derived((variant?.price ?? 0) + surcharges);
	let qty = $state(1);
	const soldOut = $derived(!variant || variant.limit === 0);
	const fixedQty = $derived(p.kind === 'gutschein');

	let busy = $state(false);
	let added = $state(false);
	const errors = $derived(((form as { errors?: Record<string, string> } | null)?.errors ?? {}) as Record<string, string>);

	/* ---------------- Anfrage (Fahrzeuge immer, Teile auf Wunsch) */
	let asking = $state(false);
	let sending = $state(false);
	const sent = $derived(!!(form as { sent?: boolean } | null)?.sent);
	const inquiryValues = $derived((form as { values?: Record<string, string> } | null)?.values ?? null);

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: p.title,
			description: htmlText(p.descriptionHtml).slice(0, 500),
			image: data.images.map((m) => `${page.url.origin}${mediaSrc(m, 1200)}`),
			brand: { '@type': 'Brand', name: p.brand || 'Koubach Tuning' },
			itemCondition: p.condition === 'neu' ? 'https://schema.org/NewCondition' : p.condition === 'ueberholt' ? 'https://schema.org/RefurbishedCondition' : 'https://schema.org/UsedCondition',
			offers: data.variants
				.filter((v) => v.price > 0)
				.map((v) => ({
					'@type': 'Offer',
					price: (v.price / 100).toFixed(2),
					priceCurrency: 'EUR',
					availability: v.limit === 0 ? 'https://schema.org/OutOfStock' : p.releaseDate ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
					url: page.url.href
				}))
		}).replace(/</g, '\\u003c')
	);
	const surchargeText = (n: number) => (n > 0 ? `+ ${i.money(n)}` : i.tr('inklusive', 'included'));
	const defaultMessage = $derived(
		vehicle
			? i.tr(`Hallo, ich interessiere mich für „${p.title}“. Ist es noch zu haben, und wann könnte ich es mir ansehen?`, `Hi, I'm interested in "${p.title}". Is it still available, and when could I come and see it?`)
			: i.tr(`Hallo, ich habe eine Frage zu „${p.title}“: `, `Hi, I have a question about "${p.title}": `)
	);
</script>

<Seo
	title={p.brand && !p.title.startsWith(p.brand) ? `${p.brand} ${p.title}` : p.title}
	description={p.subtitle || htmlText(p.descriptionHtml).slice(0, 180)}
	image={data.images[0] ? mediaSrc(data.images[0], 1200) : null}
	type="product"
	noindex={p.status !== 'aktiv'}
/>
<svelte:head>{@html `<script type="application/ld+json">${jsonLd}</script>`}</svelte:head>

<div class="wrap page-top">
	{#if p.status !== 'aktiv'}<p class="alert alert-info draft">{i.tr('Vorschau: Dieses Produkt ist noch nicht veröffentlicht.', 'Preview: this product is not published yet.')}</p>{/if}

	<div class="layout">
		<div class="gallery">
			<div class="main-img">
				{#if data.images[shown]}
					{#key shown}
						<div class="frame" in:fade={{ duration: dur(380) }}>
							<Picture media={data.images[shown]} sizes="(min-width: 1024px) 55vw, 100vw" want={1600} eager />
						</div>
					{/key}
				{:else}
					<span class="ph" aria-hidden="true"><img src="/bilder/helm.png" alt="" width="200" height="200" /></span>
				{/if}
			</div>
			{#if data.images.length > 1}
				<div class="thumbs" role="group" aria-label={i.tr('Bilder', 'Images')}>
					{#each data.images as m, n (m.id)}
						<button type="button" class="thumb" aria-pressed={n === shown} aria-label={i.tr(`Bild ${n + 1}`, `Image ${n + 1}`)} onclick={() => (shown = n)}>
							<Picture media={m} sizes="120px" want={400} alt="" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="info">
			{#if p.brand}<p class="brand">{p.brand}</p>{/if}
			<h1 class="display title">{p.title}</h1>
			{#if p.subtitle}<p class="sub">{p.subtitle}</p>{/if}

			<div class="facts">
				{#if p.condition !== 'neu'}<span class="badge badge-dark">{p.conditionLabel}</span>{/if}
				{#if p.releaseDate}<span class="badge">{i.tr(`Vorbestellung, ab ${i.date(p.releaseDate)}`, `Pre-order, from ${i.date(p.releaseDate)}`)}</span>{/if}
				{#if !vehicle && p.condition !== 'neu' && variant?.limit === 1}<span class="muted small">{i.tr('Einzelstück', 'Single item')}</span>{:else if !vehicle && variant && variant.limit != null && variant.limit > 0 && variant.limit <= 3}<span class="stock-low">{variant.limit === 1 ? i.tr('Nur noch 1 Stück', 'Only 1 left') : i.tr(`Nur noch ${variant.limit} Stück`, `Only ${variant.limit} left`)}</span>{/if}
				{#if p.leadTime}<span class="muted small">{i.tr('Lieferzeit', 'Delivery time')}: {p.leadTime}</span>{/if}
			</div>

			<div class="price-block">
				{#if vehicle && unit === 0}
					<span class="price">{i.tr('Preis auf Anfrage', 'Price on request')}</span>
				{:else}
					{#key unit}<span class="price tabular">{i.money(unit)}</span>{/key}
					{#if variant?.compareAt && variant.compareAt > variant.price}<s class="muted">{i.money(variant.compareAt + surcharges)}</s>{/if}
				{/if}
			</div>
			{#if !(vehicle && unit === 0)}
				<p class="muted small">
					{p.marginScheme
						? i.tr('Differenzbesteuert nach § 24 UStG, USt. nicht ausweisbar', 'Margin scheme (§ 24 UStG), VAT not shown')
						: page.data.taxMode === 'kleinunternehmer'
							? i.tr('Endpreis, keine USt. (Kleinunternehmer)', 'Final price, no VAT (small business)')
							: i.tr('inkl. 20 % USt.', 'incl. 20 % VAT')}{#if !vehicle},
						<a class="link" href={i.href('/info/versand')}>{i.tr('zzgl. Versand', 'plus shipping')}</a>{/if}
				</p>
			{/if}

			{#if p.conditionNote}
				<div class="condition">
					<p class="label">{i.tr('Zustand', 'Condition')}: {p.conditionLabel}</p>
					<p>{p.conditionNote}</p>
				</div>
			{/if}

			{#if p.specs.length}
				<dl class="specs">
					{#each p.specs as s (s.label)}<div><dt>{s.label}</dt><dd>{s.value}</dd></div>{/each}
				</dl>
			{/if}

			{#if vehicle}
				<div class="ask-box">
					<h2 class="h3">{i.tr('Fahrzeug anfragen', 'Ask about this vehicle')}</h2>
					<p class="muted small">{i.tr('Fahrzeuge verkaufen wir nicht online. Schreib uns – wir melden uns mit allen Details und einem Termin zur Besichtigung in Hollabrunn.', "We don't sell vehicles online. Write to us – we'll reply with all details and an appointment to view it in Hollabrunn.")}</p>
					{@render inquiry()}
				</div>
			{:else}
				<form
					method="POST"
					action="?/add"
					class="config"
					use:enhance={() => {
						busy = true;
						added = false;
						return async ({ result, update }) => {
							busy = false;
							if (result.type === 'success') {
								added = true;
								await invalidateAll();
								cartUi.open = true;
							} else {
								await update({ reset: false });
							}
						};
					}}
				>
					<input type="hidden" name="variante" value={variant?.id ?? ''} />

					{#each data.options as opt, n (opt.name)}
						<fieldset class="group">
							<legend class="label">{opt.name}{#if selected[n]}: <span class="muted">{opt.values.find((v) => v.value === selected[n])?.label}</span>{/if}</legend>
							<div class="chips">
								{#each opt.values as v (v.value)}
									<label class="chip">
										<input type="radio" name="opt-{n}" value={v.value} bind:group={selected[n]} disabled={!possible(n, v.value) && selected[n] !== v.value} />
										<span>{v.label}</span>
									</label>
								{/each}
							</div>
						</fieldset>
					{/each}

					{#each data.bundle as b (b.id)}
						{#if b.variants.length > 1}
							<label class="field">
								<span class="label">{b.quantity > 1 ? `${b.quantity}× ` : ''}{b.title}</span>
								<select class="select" name="bundle[{b.id}]" required aria-invalid={!!errors[`bundle_${b.id}`]}>
									<option value="">{i.tr('Bitte wählen', 'Please choose')}</option>
									{#each b.variants as v (v.id)}<option value={v.id} disabled={v.soldOut}>{v.label}{v.soldOut ? ` (${i.tr('ausverkauft', 'sold out')})` : ''}</option>{/each}
								</select>
							</label>
						{:else}
							<p class="small muted">{b.quantity}× {b.title}</p>
						{/if}
					{/each}

					{#each data.fields as f (f.key)}
						{#if f.type === 'datei'}
							<div>
								<FileField name="files[{f.key}]" label={f.label + (f.surcharge ? ` (${surchargeText(f.surcharge)})` : '')} help={f.help} required={f.required} max={f.maxFiles} invalid={!!errors[f.key]} bind:files={() => fileLists[f.key] ?? [], (v) => (fileLists[f.key] = v)} />
								{#if errors[f.key]}<p class="error-text">{errors[f.key]}</p>{/if}
							</div>
						{:else}
							<label class="field">
								<span class="label">{f.label}{#if f.surcharge}<span class="muted"> ({surchargeText(f.surcharge)})</span>{/if}{#if f.required}<span class="req"> *</span>{/if}</span>
								{#if f.help}<span class="hint">{f.help}</span>{/if}
								{#if f.type === 'textarea'}
									<textarea class="textarea" name="fields[{f.key}]" placeholder={f.placeholder} maxlength={f.maxLength || 2000} required={f.required} aria-invalid={!!errors[f.key]} bind:value={fieldValues[f.key]}></textarea>
								{:else if f.type === 'select'}
									<select class="select" name="fields[{f.key}]" required={f.required} aria-invalid={!!errors[f.key]} bind:value={fieldValues[f.key]}>
										<option value="">{i.tr('Bitte wählen', 'Please choose')}</option>
										{#each f.choices as c (c.value)}<option value={c.value}>{c.label}</option>{/each}
									</select>
								{:else}
									<input class="input" name="fields[{f.key}]" type="text" inputmode={f.type === 'number' ? 'decimal' : undefined} placeholder={f.placeholder} maxlength={f.maxLength || 120} required={f.required} aria-invalid={!!errors[f.key]} bind:value={fieldValues[f.key]} />
								{/if}
								{#if errors[f.key]}<span class="error-text">{errors[f.key]}</span>{/if}
							</label>
						{/if}
					{/each}

					{#if p.kind === 'gutschein'}
						<fieldset class="group">
							<legend class="label">{i.tr('Direkt verschenken (optional)', 'Send as a gift (optional)')}</legend>
							<p class="hint">{i.tr('Leer lassen, dann schicken wir den Gutschein an dich.', "Leave empty and we'll send the gift card to you.")}</p>
							<div class="grid-2">
								<label class="field"><span class="label">{i.tr('Name', 'Name')}</span><input class="input" name="gift[name]" maxlength="80" /></label>
								<label class="field"><span class="label">{i.tr('E-Mail', 'Email')}</span><input class="input" name="gift[email]" type="email" maxlength="200" aria-invalid={!!errors.gift} /></label>
							</div>
							<label class="field"><span class="label">{i.tr('Nachricht', 'Message')}</span><textarea class="textarea" name="gift[message]" maxlength="500"></textarea></label>
						</fieldset>
					{/if}

					{#if form?.error && !inquiryValues}<p class="alert alert-error" role="alert">{form.error}</p>{/if}

					<div class="buy">
						{#if !fixedQty}
							<label class="qty">
								<span class="sr-only">{i.tr('Menge', 'Quantity')}</span>
								<button type="button" onclick={() => (qty = Math.max(1, qty - 1))} aria-label={i.tr('Weniger', 'Less')}>−</button>
								<input name="menge" type="number" min="1" max={variant?.limit ?? 99} bind:value={qty} inputmode="numeric" />
								<button type="button" onclick={() => (qty = Math.min(variant?.limit ?? 99, qty + 1))} aria-label={i.tr('Mehr', 'More')}>+</button>
							</label>
						{:else}
							<input type="hidden" name="menge" value="1" />
						{/if}
						<button class="btn add" aria-busy={busy} disabled={busy || soldOut || p.status !== 'aktiv'}>
							{#if soldOut}
								{i.tr('Ausverkauft', 'Sold out')}
							{:else if busy}
								{i.tr('Wird hinzugefügt …', 'Adding …')}
							{:else if p.releaseDate}
								{i.tr('Vorbestellen', 'Pre-order')}
							{:else}
								{i.tr('In den Warenkorb', 'Add to cart')}
							{/if}
						</button>
					</div>
					{#if added}<p class="alert alert-ok" role="status">{i.tr('Im Warenkorb.', 'Added to cart.')} <a class="link" href={i.href('/kasse')}>{i.tr('Zur Kasse', 'Checkout')}</a></p>{/if}
				</form>

				<div class="ask-inline">
					<button type="button" class="ask-toggle" aria-expanded={asking || sent || !!inquiryValues} onclick={() => (asking = !asking)}>
						<MessageSquare size={18} />
						{soldOut ? i.tr('Ausverkauft? Frag uns, ob wir es besorgen können', 'Sold out? Ask us whether we can get it') : i.tr('Passt das auf mein Fahrzeug? Frag uns', 'Will it fit my vehicle? Ask us')}
					</button>
					{#if asking || sent || inquiryValues}
						<div transition:slide={{ duration: dur(380), easing: expoOut }}>{@render inquiry()}</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if p.descriptionHtml}
		<section class="details">
			<h2 class="display h2">{i.tr('Beschreibung', 'Description')}</h2>
			<div class="prose">{@html p.descriptionHtml}</div>
		</section>
	{/if}

	{#if data.related.length}
		<section class="section">
			<h2 class="display h2">{i.tr('Aus derselben Kategorie', 'From the same category')}</h2>
			<div class="related" use:reveal={{ group: true }}>
				{#each data.related as r (r.id)}<ProductCard p={r} />{/each}
			</div>
		</section>
	{/if}
</div>

{#snippet inquiry()}
	{#if sent}
		<p class="alert alert-ok" role="status">{i.tr('Danke! Deine Anfrage ist bei uns. Eine Bestätigung ist per E-Mail unterwegs.', 'Thanks! We have your inquiry. A confirmation is on its way by email.')}</p>
	{:else}
		<form
			method="POST"
			action="?/anfrage"
			class="inquiry"
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					sending = false;
					await update({ reset: false });
				};
			}}
		>
			<div class="grid-2">
				<label class="field"><span class="label">{i.tr('Name', 'Name')}<span class="req"> *</span></span><input class="input" name="name" required maxlength="120" autocomplete="name" value={inquiryValues?.name ?? data.contact.name} /></label>
				<label class="field"><span class="label">{i.tr('E-Mail', 'Email')}<span class="req"> *</span></span><input class="input" name="email" type="email" required maxlength="200" autocomplete="email" value={inquiryValues?.email ?? data.contact.email} /></label>
			</div>
			<label class="field"><span class="label">{i.tr('Telefon (für Rückruf)', 'Phone (for a call back)')}</span><input class="input" name="telefon" type="tel" maxlength="40" autocomplete="tel" value={inquiryValues?.phone ?? data.contact.phone} /></label>
			<label class="field"><span class="label">{i.tr('Nachricht', 'Message')}<span class="req"> *</span></span><textarea class="textarea" name="nachricht" required maxlength="5000">{inquiryValues?.message ?? defaultMessage}</textarea></label>
			<label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
			<label class="check small">
				<input type="checkbox" name="datenschutz" required />
				<span>{i.tr('Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden.', 'I agree that my details are stored to handle my inquiry.')} <a class="link" href={i.href('/info/datenschutz')}>{i.tr('Datenschutz', 'Privacy')}</a></span>
			</label>
			{#if form?.error && inquiryValues}<p class="alert alert-error" role="alert">{form.error}</p>{/if}
			<button class="btn" aria-busy={sending} disabled={sending}>{sending ? i.tr('Wird gesendet …', 'Sending …') : i.tr('Anfrage senden', 'Send inquiry')}</button>
		</form>
	{/if}
{/snippet}

<style>
	.draft {
		margin-bottom: 1rem;
	}
	.layout {
		display: grid;
		gap: 2rem;
	}
	@media (min-width: 1024px) {
		.layout {
			grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
			gap: 3.5rem;
			align-items: start;
		}
		.gallery {
			position: sticky;
			top: calc(var(--header-h) + 1.5rem);
		}
	}
	.main-img {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--s-surface);
		overflow: hidden;
	}
	.frame {
		position: absolute;
		inset: 0;
	}
	.main-img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.ph {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}
	.ph img {
		width: 22%;
		opacity: 0.3;
		filter: grayscale(1);
	}
	.thumbs {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.6rem;
		overflow-x: auto;
	}
	.thumb {
		flex: 0 0 5.5rem;
		aspect-ratio: 4 / 3;
		background: var(--s-surface);
		overflow: hidden;
		opacity: 0.6;
		transition: opacity 200ms;
	}
	.thumb:hover {
		opacity: 0.9;
	}
	.thumb[aria-pressed='true'] {
		opacity: 1;
		outline: 2px solid var(--red);
		outline-offset: -2px;
	}
	.thumb :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.brand {
		margin-bottom: 0.35rem;
		color: var(--s-ink-3);
		font-weight: 700;
		font-stretch: 110%;
	}
	.title {
		font-size: clamp(1.75rem, 1.2rem + 2.2vw, 2.9rem);
	}
	.sub {
		margin-top: 0.5rem;
		color: var(--s-ink-2);
		font-size: 1.05rem;
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.9rem;
		margin-top: 0.9rem;
	}
	.facts:empty {
		display: none;
	}
	.stock-low {
		color: var(--s-accent);
		font-weight: 700;
		font-size: 0.9rem;
	}
	.price-block {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.6rem;
		margin-top: 1.1rem;
	}
	.price {
		display: inline-block;
		font-size: 1.9rem;
		font-weight: 800;
		font-stretch: 110%;
		animation: tick 420ms var(--ease-expo);
	}
	/* Preis rollt beim Ändern der Auswahl kurz nach */
	@keyframes tick {
		from {
			opacity: 0.2;
			transform: translateY(-0.35em);
		}
	}
	.condition {
		margin-top: 1.4rem;
		padding: 1rem 1.15rem;
		background: var(--s-surface);
		border-left: 4px solid var(--red);
	}
	.condition p + p {
		margin-top: 0.3rem;
		color: var(--s-ink-2);
	}
	/* Technische Daten als ruhige Tabelle */
	.specs {
		margin-top: 1.5rem;
		background: var(--s-surface);
	}
	.specs div {
		display: grid;
		grid-template-columns: minmax(7rem, 40%) 1fr;
		gap: 1rem;
		padding: 0.6rem 1rem;
		border-bottom: 1px solid var(--s-line);
	}
	.specs div:last-child {
		border-bottom: 0;
	}
	.specs dt {
		color: var(--s-ink-3);
		font-size: 0.9rem;
	}
	.specs dd {
		font-weight: 650;
	}
	.config {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.75rem;
		padding-top: 1.75rem;
		border-top: 1px solid var(--s-line);
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border: 0;
		padding: 0;
		margin: 0;
	}
	.group legend {
		margin-bottom: 0.6rem;
	}
	.buy {
		display: flex;
		gap: 0.75rem;
		align-items: stretch;
	}
	.add {
		flex: 1;
	}
	.qty {
		display: flex;
		align-items: stretch;
		background: var(--s-surface);
		box-shadow: inset 0 0 0 1px var(--s-line-strong);
	}
	.qty button {
		width: 2.6rem;
		font-size: 1.2rem;
		color: var(--s-strong);
		transition: background-color 160ms;
	}
	.qty:focus-within {
		box-shadow: inset 0 0 0 1px var(--red);
	}
	.qty button:hover {
		background: var(--s-surface-2);
	}
	.qty input {
		width: 3rem;
		background: transparent;
		border: 0;
		color: var(--s-strong);
		text-align: center;
		font-weight: 700;
		font-size: 1rem;
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.qty input::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}
	.ask-box {
		margin-top: 1.75rem;
		padding: 1.4rem;
		background: var(--s-surface);
		border-top: 4px solid var(--red);
	}
	.ask-box .muted {
		margin: 0.4rem 0 1.25rem;
	}
	.ask-inline {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--s-line);
	}
	.ask-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--s-ink-2);
		font-weight: 650;
		text-align: left;
		transition: color 160ms;
	}
	.ask-toggle:hover {
		color: var(--s-accent);
	}
	.ask-inline .inquiry {
		margin-top: 1rem;
	}
	.inquiry {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.inquiry .btn {
		align-self: flex-start;
	}
	.hp {
		position: absolute;
		left: -9999px;
	}
	.details {
		margin-top: 4rem;
		padding-top: 2.5rem;
		border-top: 1px solid var(--s-line);
	}
	.details .h2 {
		margin-bottom: 1rem;
	}
	.related {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	@media (min-width: 1024px) {
		.related {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}
</style>
