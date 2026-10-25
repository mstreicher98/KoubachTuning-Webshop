<script lang="ts">
	import { getI18n } from '$lib/i18n.svelte';

	interface Props {
		pages: { slug: string; title: string; group: string }[];
		company: {
			brand: string;
			name: string;
			street: string;
			zip: string;
			city: string;
			email: string;
			phone: string;
			phoneHref: string;
			whatsappHref: string;
			instagram: string;
			facebook: string;
			tiktok: string;
			youtube: string;
		};
		taxMode: 'kleinunternehmer' | 'regel';
	}

	let { pages, company, taxMode }: Props = $props();
	const i = getI18n();
	const group = (g: string) => pages.filter((p) => p.group === g);
	const social = $derived(
		[
			['Instagram', company.instagram],
			['Facebook', company.facebook],
			['TikTok', company.tiktok],
			['YouTube', company.youtube]
		].filter(([, url]) => url)
	);
</script>

<footer class="foot zone-dark">
	<span class="rwr" aria-hidden="true"></span>
	<div class="wrap grid">
		<div class="brand">
			<img src="/bilder/logo.webp" alt={company.brand} width="640" height="145" />
			<p class="muted small">{i.tr('Teile, Reifen und Fahrzeuge für Moped und Motorrad – aus Hollabrunn, mit Versand nach Österreich und Deutschland.', 'Parts, tyres and vehicles for mopeds and motorcycles – from Hollabrunn, shipping to Austria and Germany.')}</p>
		</div>
		<nav aria-label={i.tr('Bestellung', 'Ordering')}>
			<h2>{i.tr('Bestellung', 'Ordering')}</h2>
			<ul>
				{#each group('bestellung') as p (p.slug)}<li><a href={i.href(`/info/${p.slug}`)}>{p.title}</a></li>{/each}
				<li><a href={i.href('/gutschein')}>{i.tr('Gutschein prüfen', 'Check gift card')}</a></li>
			</ul>
		</nav>
		<nav aria-label={i.tr('Hilfe', 'Help')}>
			<h2>{i.tr('Hilfe', 'Help')}</h2>
			<ul>
				{#each group('hilfe') as p (p.slug)}<li><a href={i.href(`/info/${p.slug}`)}>{p.title}</a></li>{/each}
				<li><a href={i.href('/sendungsverfolgung')}>{i.tr('Sendung verfolgen', 'Track parcel')}</a></li>
				<li><a href={i.href('/kontakt')}>{i.tr('Anfrage stellen', 'Send a request')}</a></li>
			</ul>
		</nav>
		<div>
			<h2>{i.tr('Kontakt', 'Contact')}</h2>
			<ul>
				{#if company.street}<li class="addr">{company.street}<br />{company.zip} {company.city}</li>{/if}
				{#if company.phone}<li><a href={company.phoneHref}>{company.phone}</a></li>{/if}
				{#if company.email}<li><a href="mailto:{company.email}">{company.email}</a></li>{/if}
				{#if company.whatsappHref}<li><a href={company.whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>{/if}
				{#each social as [name, url] (name)}<li><a href={url} target="_blank" rel="noopener noreferrer">{name}</a></li>{/each}
			</ul>
		</div>
	</div>
	<div class="wrap bottom">
		<p>© {new Date().getFullYear()} {company.name}</p>
		<nav aria-label={i.tr('Rechtliches', 'Legal')}>
			{#each group('rechtliches') as p (p.slug)}<a href={i.href(`/info/${p.slug}`)}>{p.title}</a>{/each}
		</nav>
		<p class="tax">
			{taxMode === 'kleinunternehmer'
				? i.tr('Alle Preise sind Endpreise. Keine Umsatzsteuer gemäß Kleinunternehmerregelung.', 'All prices are final prices. No VAT charged (small business regulation).')
				: i.tr('Alle Preise inkl. USt., zzgl. Versand.', 'All prices incl. VAT, plus shipping.')}
		</p>
	</div>
</footer>

<style>
	.foot {
		margin-top: auto;
		background: var(--s-bg);
	}
	.foot > .rwr {
		height: 0.45rem;
		clip-path: none;
	}
	.grid {
		display: grid;
		gap: 2rem;
		padding-block: 3rem 2rem;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: 1.3fr 1fr 1fr 1fr;
		}
	}
	.brand p {
		max-width: 34ch;
	}
	.addr {
		color: var(--s-ink-3);
		font-size: 0.925rem;
		line-height: 1.45;
	}
	.brand img {
		width: 11rem;
		height: auto;
		margin-bottom: 0.75rem;
	}
	h2 {
		margin-bottom: 0.75rem;
		font-size: 0.95rem;
		font-weight: 750;
		font-stretch: 115%;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	a {
		color: var(--s-ink-3);
		text-decoration: none;
		font-size: 0.925rem;
		transition: color 180ms;
	}
	a:hover {
		color: var(--s-strong);
	}
	.bottom {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.5rem;
		padding-block: 1.25rem 2rem;
		border-top: 1px solid var(--s-line);
		font-size: 0.8rem;
		color: var(--s-ink-4);
	}
	.bottom nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
	}
	.bottom a {
		font-size: 0.8rem;
	}
	.tax {
		width: 100%;
	}
</style>
