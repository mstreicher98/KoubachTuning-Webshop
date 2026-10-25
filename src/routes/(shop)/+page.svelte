<script lang="ts">
	import Bike from '@lucide/svelte/icons/bike';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import Cog from '@lucide/svelte/icons/cog';
	import Gift from '@lucide/svelte/icons/gift';
	import Recycle from '@lucide/svelte/icons/recycle';
	import Search from '@lucide/svelte/icons/search';
	import Star from '@lucide/svelte/icons/star';
	import Store from '@lucide/svelte/icons/store';
	import Truck from '@lucide/svelte/icons/truck';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Picture from '$lib/components/shop/Picture.svelte';
	import ProductCard from '$lib/components/shop/ProductCard.svelte';
	import Seo from '$lib/components/shop/Seo.svelte';
	import { getI18n } from '$lib/i18n.svelte';
	import { reveal } from '$lib/motion';

	let { data } = $props();
	const i = getI18n();

	// „Parts. Passion. Performance.“ → eine Zeile je Satz
	const heroLines = $derived(
		data.hero.title
			.split(/(?<=\.)\s+/)
			.map((s) => s.trim())
			.filter(Boolean)
	);

	const ICONS: Record<string, typeof Cog> = { neuteile: Cog, gebrauchtteile: Recycle, reifen: CircleDot, fahrzeuge: Bike, gutscheine: Gift };
	const main = $derived(data.categories.find((c) => c.children.length >= 3) ?? null);
	const others = $derived(data.categories.filter((c) => c !== main));

	const PAYMENT_NAMES: Record<string, [string, string]> = {
		stripe: ['Karte, Apple Pay, Google Pay, EPS, Klarna', 'Card, Apple Pay, Google Pay, EPS, Klarna'],
		paypal: ['PayPal', 'PayPal'],
		ueberweisung: ['Vorkasse per Überweisung', 'Bank transfer in advance'],
		bar: ['Bar bei Abholung', 'Cash on pickup']
	};
	const payments = $derived(data.service.payments.map((m) => i.tr(...(PAYMENT_NAMES[m] ?? [m, m]))));
	const countText = (n: number) => (n === 1 ? i.tr('1 Angebot', '1 listing') : i.tr(`${n} Angebote`, `${n} listings`));
</script>

<Seo title="Koubach Tuning" description={data.hero.text} image="/bilder/vorschau.jpg" />

<section class="hero zone-dark">
	<div class="hero-media" aria-hidden="true">
		{#if data.hero.image}
			<Picture media={data.hero.image} sizes="100vw" want={1600} eager alt="" />
		{:else}
			<img src="/bilder/hero.webp" alt="" width="2000" height="1125" fetchpriority="high" />
		{/if}
	</div>
	<div class="hero-text wrap">
		<h1 class="display">
			{#each heroLines as line, n (n)}<span class="line" style="--i: {n}"><span>{line}</span></span>{/each}
		</h1>
		<p class="lead">{data.hero.text}</p>
		<form class="finder" action={i.href('/produkte')} method="GET" role="search">
			<label class="sr-only" for="hero-suche">{i.tr('Was braucht dein Moped? Teil suchen', 'What does your moped need? Search parts')}</label>
			<Search size={22} aria-hidden="true" />
			<input id="hero-suche" name="q" type="search" placeholder={i.tr('Teil suchen, z. B. Zylinder 70', 'Search parts, e.g. cylinder 70')} />
			<button class="btn">{i.tr('Suchen', 'Search')}</button>
		</form>
		<nav class="quick" aria-label={i.tr('Bereiche', 'Sections')}>
			{#each data.categories.filter((c) => c.slug !== 'gutscheine') as c (c.id)}<a href={i.href(`/kategorie/${c.slug}`)}>{c.name}</a>{/each}
		</nav>
	</div>
	<!-- Rot-Weiß-Rot wie am Helm: zieht sich einmal beim Laden quer übers Bild -->
	<span class="hero-stripe" aria-hidden="true"></span>
</section>

{#if data.categories.length}
	<section class="wrap section">
		<div class="cats" use:reveal={{ group: true, stagger: 90 }}>
			{#if main}
				{@const Icon = ICONS[main.slug] ?? Cog}
				<div class="cat cat-main">
					<a class="cat-head" href={i.href(`/kategorie/${main.slug}`)}>
						<Icon size={30} strokeWidth={1.75} aria-hidden="true" />
						<span class="cat-name display">{main.name}</span>
						<span class="cat-tag">{main.tagline}</span>
					</a>
					<ul class="subs">
						{#each main.children as ch (ch.slug)}<li><a href={i.href(`/kategorie/${ch.slug}`)}>{ch.name}</a></li>{/each}
					</ul>
					{#if main.count}<span class="cat-count">{countText(main.count)}</span>{/if}
				</div>
			{/if}
			{#each others as c (c.id)}
				{@const Icon = ICONS[c.slug] ?? Cog}
				<a class="cat" class:cat-vehicles={c.slug === 'fahrzeuge'} href={i.href(`/kategorie/${c.slug}`)}>
					<Icon size={26} strokeWidth={1.75} aria-hidden="true" />
					<span class="cat-name display">{c.name}</span>
					<span class="cat-tag">{c.tagline}</span>
					{#if c.count}<span class="cat-count">{countText(c.count)}</span>{/if}
				</a>
			{/each}
		</div>
	</section>
{/if}

<section class="wrap section featured">
	<div class="sec-head">
		<h2 class="display h2">{i.tr('Gerade in der Werkstatt', 'In the workshop right now')}</h2>
		{#if data.featured.length}<a class="link" href={i.href('/produkte')}>{i.tr('Alle Teile', 'All parts')}</a>{/if}
	</div>
	{#if data.featured.length}
		<div class="grid" use:reveal={{ group: true }}>
			{#each data.featured as p, n (p.id)}<ProductCard {p} eager={n < 4} />{/each}
		</div>
	{:else}
		<div class="empty panel">
			<p>{i.tr('Der Shop wird gerade befüllt. Du suchst ein bestimmtes Teil? Schreib uns – vieles bestellen wir für dich.', "We're stocking the shop right now. Looking for a specific part? Write to us – we can order a lot for you.")}</p>
			<a class="btn" href={i.href('/kontakt')}>{i.tr('Teil anfragen', 'Ask for a part')}</a>
		</div>
	{/if}
</section>

{#if data.vehicles.length}
	<section class="vehicles zone-dark">
		<div class="wrap section">
			<div class="sec-head">
				<div>
					<h2 class="display h2">{i.tr('Fahrzeuge von uns', 'Our vehicles')}</h2>
					<p class="muted">{i.tr('Aufgebaut, durchgesehen, fahrbereit. Nur auf Anfrage – Probefahrt in Hollabrunn nach Termin.', 'Built, checked, ready to ride. On request only – test rides in Hollabrunn by appointment.')}</p>
				</div>
				<a class="link" href={i.href('/kategorie/fahrzeuge')}>{i.tr('Alle Fahrzeuge', 'All vehicles')}</a>
			</div>
			<ul class="rail">
				{#each data.vehicles as p (p.id)}<li><ProductCard {p} /></li>{/each}
			</ul>
		</div>
	</section>
{/if}

{#if data.newest.length}
	<section class="wrap section">
		<div class="sec-head">
			<h2 class="display h2">{i.tr('Neu reingekommen', 'Just arrived')}</h2>
		</div>
		<div class="grid" use:reveal={{ group: true }}>
			{#each data.newest as p (p.id)}<ProductCard {p} />{/each}
		</div>
	</section>
{/if}

{#if data.gallery.length}
	<section class="section gallery-sec">
		<div class="wrap sec-head">
			<h2 class="display h2">{i.tr('Projekte aus der Werkstatt', 'Workshop projects')}</h2>
		</div>
		<ul class="gallery" aria-label={i.tr('Projekte', 'Projects')}>
			{#each data.gallery as g (g.id)}
				<li>
					<figure>
						<Picture media={g.image} sizes="(min-width: 1024px) 30vw, 80vw" want={900} />
						{#if g.title || g.vehicle}<figcaption><strong>{g.title}</strong>{#if g.vehicle}<span class="muted"> {g.vehicle}</span>{/if}</figcaption>{/if}
					</figure>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if data.reviews.length}
	<section class="wrap section">
		<h2 class="display h2">{i.tr('Das sagen unsere Kunden', 'What our customers say')}</h2>
		<div class="reviews">
			{#each data.reviews as r (r.id)}
				<figure class="review">
					<span class="stars" aria-label={i.tr(`${r.rating} von 5 Sternen`, `${r.rating} out of 5 stars`)}>
						{#each Array(5) as _, n (n)}<Star size={16} fill={n < r.rating ? 'currentColor' : 'none'} />{/each}
					</span>
					<blockquote>{r.text}</blockquote>
					<figcaption><strong>{r.name}</strong>{#if r.vehicle}<span class="muted">, {r.vehicle}</span>{/if}</figcaption>
				</figure>
			{/each}
		</div>
	</section>
{/if}

<section class="service">
	<div class="wrap service-in">
		<div class="fact">
			<Truck size={24} strokeWidth={1.75} aria-hidden="true" />
			<h2>{i.tr('Versand', 'Shipping')}</h2>
			<p>
				{#each data.service.countries as c, n (c.code)}{n ? ', ' : ''}{c.name} {i.money(c.price)}{/each}.
				{#if data.service.freeFrom}{i.tr(`Ab ${i.money(data.service.freeFrom)} versandkostenfrei nach Österreich.`, `Free shipping within Austria from ${i.money(data.service.freeFrom)}.`)}{/if}
			</p>
			<a class="link" href={i.href('/sendungsverfolgung')}>{i.tr('Sendung verfolgen', 'Track parcel')}</a>
		</div>
		{#if data.service.pickup}
			<div class="fact">
				<Store size={24} strokeWidth={1.75} aria-hidden="true" />
				<h2>{i.tr('Abholen in Hollabrunn', 'Pickup in Hollabrunn')}</h2>
				<p>{data.service.pickup}. {i.tr('Kostenlos, nach Terminvereinbarung.', 'Free of charge, by appointment.')}</p>
			</div>
		{/if}
		{#if payments.length}
			<div class="fact">
				<Wallet size={24} strokeWidth={1.75} aria-hidden="true" />
				<h2>{i.tr('Bezahlen', 'Payment')}</h2>
				<p>{payments.join(', ')}.</p>
			</div>
		{/if}
	</div>
</section>

<style>
	/* ---------------- Titelbild
	   Ein abgestimmter Einstieg: Bild setzt sich, Zeilen steigen auf, dann zieht der Rot-Weiß-Rot-Streifen quer durch. */
	.hero {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		min-height: min(86svh, 50rem);
		overflow: hidden;
		isolation: isolate;
	}
	.hero-media {
		position: absolute;
		inset: 0;
		z-index: -1;
	}
	.hero-media :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 72% 50%;
		animation: settle 2200ms var(--ease-expo) both;
	}
	@keyframes settle {
		from {
			opacity: 0;
			transform: scale(1.08);
		}
	}
	.hero-media::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(to top, var(--s-bg) 0%, rgb(18 19 22 / 0.78) 42%, rgb(18 19 22 / 0.25) 80%),
			linear-gradient(to right, rgb(18 19 22 / 0.7), transparent 80%);
	}
	@media (min-width: 1024px) {
		.hero-media::after {
			background:
				linear-gradient(to right, var(--s-bg) 0%, rgb(18 19 22 / 0.86) 26%, rgb(18 19 22 / 0.2) 58%, transparent 75%),
				linear-gradient(to top, rgb(18 19 22 / 0.7), transparent 30%);
		}
	}
	.hero-text {
		position: relative;
		align-self: end;
		padding-block: 3rem 4.5rem;
	}
	@media (min-width: 1024px) {
		.hero-text {
			align-self: center;
			padding-block: 4rem 5.5rem;
		}
	}
	h1 {
		display: flex;
		flex-direction: column;
		font-size: clamp(2.1rem, 0.9rem + 6.2vw, 6rem);
		max-width: 11ch;
	}
	.line + .line {
		margin-top: 0.04em;
	}
	/* Maske je Zeile; Innenabstand, damit Umlaute und Unterlängen nicht abgeschnitten werden */
	.line {
		display: block;
		overflow: hidden;
		padding: 0.12em 0.1em 0.04em 0;
		margin: -0.12em -0.1em -0.04em 0;
	}
	.line > span {
		display: block;
		animation: rise 1000ms var(--ease-expo) both;
		animation-delay: calc(250ms + var(--i) * 110ms);
	}
	@keyframes rise {
		from {
			transform: translateY(110%);
		}
	}
	.hero-text .lead {
		margin-top: 1.4rem;
		animation: fade-up 800ms var(--ease-expo) 700ms both;
	}
	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
	}

	/* Suche als Hauptaufgabe der Seite */
	.finder {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		max-width: 40rem;
		margin-top: 1.75rem;
		padding: 0.4rem 0.4rem 0.4rem 1rem;
		background: #fff;
		color: #5d616a;
		box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.8);
		animation: fade-up 800ms var(--ease-expo) 800ms both;
	}
	.finder input {
		flex: 1;
		min-width: 0;
		height: 2.9rem;
		border: 0;
		background: transparent;
		color: #15161a;
		font-size: 1.05rem;
	}
	.finder input::placeholder {
		color: #868a93;
	}
	.finder input:focus {
		outline: none;
	}
	.finder:focus-within {
		box-shadow:
			0 0 0 3px var(--red),
			0 24px 60px -24px rgb(0 0 0 / 0.8);
	}
	@media (max-width: 479px) {
		.finder :global(svg) {
			display: none;
		}
		.finder .btn {
			padding: 0 1.1rem;
		}
	}
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.4rem;
		margin-top: 1.1rem;
		animation: fade-up 800ms var(--ease-expo) 900ms both;
	}
	.quick a {
		color: var(--s-ink-2);
		font-weight: 650;
		font-size: 0.95rem;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition:
			color 160ms,
			border-color 160ms;
	}
	.quick a:hover {
		color: #fff;
		border-bottom-color: var(--red);
	}
	.hero-stripe {
		position: absolute;
		left: -2%;
		right: -2%;
		bottom: 1.4rem;
		height: 1.1rem;
		background: var(--rwr);
		transform: skewY(-1.2deg);
		transform-origin: left;
		animation: stripe 1100ms var(--ease-expo) 1050ms both;
	}
	@keyframes stripe {
		from {
			clip-path: inset(0 100% 0 0);
		}
		to {
			clip-path: inset(0 0 0 0);
		}
	}

	/* ---------------- Bereiche */
	.cats {
		display: grid;
		gap: 0.75rem;
	}
	@media (min-width: 768px) {
		.cats {
			grid-template-columns: 1.35fr 1fr 1fr;
		}
		.cat-main {
			grid-row: span 2;
		}
		/* Fahrzeuge als breite Kachel, wenn sie die letzte ist (ohne Gutscheine) */
		.cat-vehicles:last-child {
			grid-column: span 2;
		}
	}
	.cat {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1.4rem 1.4rem 1.5rem;
		background: var(--s-surface);
		color: var(--s-ink);
		text-decoration: none;
		overflow: hidden;
		transition: box-shadow 300ms var(--ease-out);
	}
	/* Rot-Weiß-Rot schiebt sich beim Überfahren an der linken Kante ein */
	.cat::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: linear-gradient(90deg, var(--red) 0 33.4%, #fff 33.4% 66.6%, var(--red) 66.6%);
		transform: scaleY(0);
		transform-origin: top;
		transition: transform 450ms var(--ease-expo);
	}
	@media (hover: hover) {
		a.cat:hover::before,
		.cat-main:hover::before {
			transform: none;
		}
		a.cat:hover,
		.cat-main:hover {
			box-shadow: 0 18px 40px -24px rgb(21 22 26 / 0.45);
		}
	}
	.cat :global(svg) {
		color: var(--red);
		margin-bottom: 0.5rem;
	}
	.cat-head {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		color: inherit;
		text-decoration: none;
	}
	.cat-name {
		font-size: clamp(1.4rem, 1rem + 1.3vw, 2.1rem);
	}
	.cat-main .cat-name {
		font-size: clamp(1.8rem, 1.1rem + 2.2vw, 3rem);
	}
	.cat-tag {
		color: var(--s-ink-3);
	}
	.cat-count {
		margin-top: auto;
		padding-top: 1rem;
		font-size: 0.85rem;
		font-weight: 650;
		color: var(--s-ink-3);
	}
	.subs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0 1.25rem;
		margin-top: 1.25rem;
	}
	.subs a {
		display: block;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--s-line);
		color: var(--s-ink-2);
		font-weight: 600;
		text-decoration: none;
		transition:
			color 160ms,
			padding-left 300ms var(--ease-expo);
	}
	.subs a:hover {
		color: var(--s-accent);
		padding-left: 0.3rem;
	}
	@media (max-width: 420px) {
		.subs {
			grid-template-columns: 1fr;
		}
	}

	/* ---------------- Produkte */
	.sec-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.75rem 2rem;
		margin-bottom: 1.5rem;
	}
	.sec-head p {
		margin-top: 0.5rem;
		max-width: 52ch;
	}
	.featured {
		padding-top: 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}
	.empty {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem 2rem;
	}
	.empty p {
		max-width: 56ch;
		color: var(--s-ink-2);
	}

	/* ---------------- Fahrzeuge (dunkle Zone, waagrecht scrollbar) */
	.vehicles {
		position: relative;
	}
	.vehicles::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 4px;
		background: var(--rwr);
	}
	.rail {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding-bottom: 0.75rem;
		scrollbar-width: thin;
	}
	.rail li {
		flex: 0 0 min(78vw, 22rem);
		scroll-snap-align: start;
	}

	/* ---------------- Projekte, Stimmen */
	.gallery {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding: 0 1rem 1rem;
		scrollbar-width: thin;
	}
	@media (min-width: 1024px) {
		.gallery {
			padding-inline: max(2.25rem, calc((100vw - 82rem) / 2 + 2.25rem));
		}
	}
	.gallery li {
		flex: 0 0 min(80vw, 26rem);
		scroll-snap-align: start;
	}
	.gallery figure :global(img) {
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		background: var(--s-surface-2);
	}
	figcaption {
		margin-top: 0.6rem;
		font-size: 0.9rem;
	}
	.reviews {
		display: grid;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	@media (min-width: 768px) {
		.reviews {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.review {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		background: var(--s-surface);
	}
	.stars {
		display: flex;
		gap: 0.15rem;
		color: var(--red);
	}
	blockquote {
		color: var(--s-ink-2);
		line-height: 1.6;
	}

	/* ---------------- Service: echte Angaben statt Symbolleiste */
	.service {
		border-top: 1px solid var(--s-line);
		background: var(--s-surface);
	}
	.service-in {
		display: grid;
		gap: 2rem;
		padding-block: 2.75rem;
	}
	@media (min-width: 768px) {
		.service-in {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.fact {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
	}
	.fact :global(svg) {
		color: var(--red);
	}
	.fact h2 {
		font-size: 1.05rem;
		font-weight: 750;
		font-stretch: 112%;
	}
	.fact p {
		color: var(--s-ink-2);
		font-size: 0.95rem;
		max-width: 38ch;
	}
	.fact .link {
		margin-top: 0.25rem;
		font-size: 0.9rem;
	}
</style>
