<script lang="ts">
	import { getI18n } from '$lib/i18n.svelte';
	import type { ProductCard } from '$lib/server/shop/catalog';
	import Picture from './Picture.svelte';

	let { p, eager = false }: { p: ProductCard; eager?: boolean } = $props();
	const i = getI18n();

	const condition = $derived(p.condition === 'gebraucht' ? i.tr('Gebraucht', 'Used') : p.condition === 'ueberholt' ? i.tr('Überholt', 'Refurbished') : null);
</script>

<a class="card" href={i.href(`/produkt/${p.slug}`)}>
	<span class="img" class:has2={!!p.image2}>
		{#if p.image}
			<Picture media={p.image} sizes="(min-width: 1024px) 25vw, 50vw" want={800} alt="" {eager} />
			{#if p.image2}<span class="img2"><Picture media={p.image2} sizes="(min-width: 1024px) 25vw, 50vw" want={800} alt="" /></span>{/if}
		{:else}
			<span class="ph" aria-hidden="true"><img src="/bilder/zeichen.svg" alt="" width="120" height="120" loading="lazy" /></span>
		{/if}
		<span class="tags">
			{#if p.soldOut}<span class="badge badge-dark">{i.tr('Ausverkauft', 'Sold out')}</span>{/if}
			{#if condition}<span class="badge badge-dark">{condition}</span>{/if}
			{#if p.preorder}<span class="badge">{i.tr('Vorbestellung', 'Pre-order')}</span>{/if}
			{#if p.compareAt && p.compareAt > p.priceFrom}<span class="badge">{i.tr('Angebot', 'Sale')}</span>{/if}
		</span>
	</span>
	<span class="body">
		{#if p.brand}<span class="kind">{p.brand}</span>{/if}
		<span class="title">{p.title}</span>
		{#if p.subtitle}<span class="sub">{p.subtitle}</span>{/if}
		<span class="price">
			{#if p.kind === 'fahrzeug' && p.priceFrom === 0}
				<strong>{i.tr('Preis auf Anfrage', 'Price on request')}</strong>
			{:else}
				{#if p.multiplePrices}{i.tr('ab', 'from')}{/if}
				<strong>{i.money(p.priceFrom)}</strong>
				{#if p.compareAt && p.compareAt > p.priceFrom}<s>{i.money(p.compareAt)}</s>{/if}
			{/if}
		</span>
		{#if p.kind === 'fahrzeug'}
			<span class="stock">{i.tr('Nur auf Anfrage', 'On request only')}</span>
		{:else if p.lowStock}
			<span class="stock low">{p.lowStock === 1 ? i.tr('Nur noch 1 Stück', 'Only 1 left') : i.tr(`Nur noch ${p.lowStock} Stück`, `Only ${p.lowStock} left`)}</span>
		{/if}
	</span>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--s-surface);
		color: var(--s-ink);
		text-decoration: none;
		transition: box-shadow 300ms var(--ease-out);
	}
	.img {
		position: relative;
		display: block;
		aspect-ratio: 4 / 3;
		background: var(--s-surface-2);
		overflow: hidden;
	}
	.img :global(img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 900ms var(--ease-expo);
	}
	.img2 {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 400ms var(--ease-out);
	}
	/* Verlaufs-Strich an der Unterkante, läuft in den Anschnitt */
	.img::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 4px;
		background: var(--rwr);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 500ms var(--ease-expo);
	}
	@media (hover: hover) {
		.card:hover .img2 {
			opacity: 1;
		}
		.card:hover .img :global(img) {
			transform: scale(1.05);
		}
		.card:hover .img::after {
			transform: none;
		}
		.card:hover {
			box-shadow: 0 18px 40px -22px rgb(21 22 26 / 0.45);
		}
	}
	.card:focus-visible {
		outline-offset: 4px;
	}
	.ph {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}
	.ph img {
		width: 28%;
		height: auto;
		opacity: 0.35;
		filter: grayscale(1);
	}
	.tags {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		display: flex;
		gap: 0.35rem;
	}
	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.1rem;
		padding: 0.85rem 0.95rem 1rem;
	}
	.kind {
		font-size: 0.75rem;
		font-weight: 650;
		color: var(--s-ink-3);
	}
	.title {
		font-weight: 750;
		font-stretch: 108%;
		text-transform: uppercase;
		line-height: 1.2;
		letter-spacing: 0.01em;
	}
	.title {
		transition: color 200ms;
	}
	.card:hover .title {
		color: var(--s-accent);
	}
	.sub {
		font-size: 0.875rem;
		color: var(--s-ink-3);
	}
	.price {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem;
		margin-top: auto;
		padding-top: 0.45rem;
		font-size: 0.9rem;
		color: var(--s-ink-2);
	}
	.price strong {
		color: var(--s-strong);
		font-size: 1.05rem;
		font-stretch: 108%;
	}
	s {
		color: var(--s-ink-4);
	}
	.stock {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--s-ink-3);
	}
	.stock.low {
		color: var(--s-accent);
	}
</style>
