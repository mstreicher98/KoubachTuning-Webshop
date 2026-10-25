<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import X from '@lucide/svelte/icons/x';
	import { flip } from 'svelte/animate';
	import { expoOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { getI18n } from '$lib/i18n.svelte';
	import { dur, reveal } from '$lib/motion';
	import type { ProductCard as Card } from '$lib/server/shop/catalog';
	import ProductCard from './ProductCard.svelte';

	interface Props {
		products: Card[];
		total: number;
		page: number;
		pages: number;
		sort: string;
		q: string;
		brand: string | null;
		condition: string | null;
		brands: string[];
		/** Zustand-Filter nur zeigen, wo es Gebrauchtes geben kann */
		showCondition?: boolean;
	}

	let { products, total, page: current, pages, sort, q, brand, condition, brands, showCondition = true }: Props = $props();
	const i = getI18n();

	function withParam(key: string, value: string | null) {
		const u = new URL(page.url);
		if (value == null) u.searchParams.delete(key);
		else u.searchParams.set(key, value);
		if (key !== 'seite') u.searchParams.delete('seite');
		return `${u.pathname}${u.search}`;
	}
</script>

<div class="bar">
	<p class="muted small">
		{total === 1 ? i.tr('1 Produkt', '1 product') : i.tr(`${total} Produkte`, `${total} products`)}
		{#if q}{i.tr(` für „${q}“`, ` for "${q}"`)}{/if}
	</p>
	<div class="filters">
		{#if showCondition}
			<div class="seg" role="group" aria-label={i.tr('Zustand', 'Condition')}>
				{#each [[null, i.tr('Alle', 'All')], ['neu', i.tr('Neu', 'New')], ['gebraucht', i.tr('Gebraucht', 'Used')]] as [value, label] (label)}
					<a href={withParam('zustand', value)} aria-current={condition === value ? 'true' : undefined} data-sveltekit-noscroll>{label}</a>
				{/each}
			</div>
		{/if}
		{#if brand}
			<a class="pill" href={withParam('marke', null)} title={i.tr('Filter entfernen', 'Remove filter')} data-sveltekit-noscroll>
				{brand} <X size={14} />
			</a>
		{:else if brands.length > 1}
			<label class="sort">
				<span class="sr-only">{i.tr('Hersteller', 'Brand')}</span>
				<select class="select" value="" onchange={(e) => goto(withParam('marke', e.currentTarget.value || null), { noScroll: true })}>
					<option value="">{i.tr('Alle Hersteller', 'All brands')}</option>
					{#each brands as b (b)}<option value={b}>{b}</option>{/each}
				</select>
			</label>
		{/if}
		<label class="sort">
			<span class="sr-only">{i.tr('Sortierung', 'Sort')}</span>
			<select class="select" value={sort} onchange={(e) => goto(withParam('sortierung', e.currentTarget.value === 'empfohlen' ? null : e.currentTarget.value), { noScroll: true })}>
				<option value="empfohlen">{i.tr('Empfohlen', 'Featured')}</option>
				<option value="neu">{i.tr('Neueste', 'Newest')}</option>
				<option value="preis_auf">{i.tr('Preis aufsteigend', 'Price: low to high')}</option>
				<option value="preis_ab">{i.tr('Preis absteigend', 'Price: high to low')}</option>
			</select>
		</label>
	</div>
</div>

{#if products.length}
	<div class="grid" use:reveal={{ group: true }}>
		{#each products as p, n (p.id)}
			<div animate:flip={{ duration: dur(550), easing: expoOut }} in:fade={{ duration: dur(300) }}><ProductCard {p} eager={n < 4} /></div>
		{/each}
	</div>
	{#if pages > 1}
		<nav class="pager" aria-label={i.tr('Seiten', 'Pages')}>
			{#each Array(pages) as _, n (n)}
				<a href={withParam('seite', n === 0 ? null : String(n + 1))} aria-current={n + 1 === current ? 'page' : undefined}>{n + 1}</a>
			{/each}
		</nav>
	{/if}
{:else}
	<div class="empty">
		<p class="h3">{i.tr('Nichts gefunden', 'Nothing found')}</p>
		<p class="muted">
			{brand || condition
				? i.tr('Mit diesen Filtern gibt es gerade nichts. Nimm einen Filter weg oder frag uns direkt – vieles bestellen wir für dich.', 'Nothing matches these filters right now. Remove a filter or just ask us – we can order a lot for you.')
				: i.tr('Probier einen anderen Suchbegriff oder frag uns direkt – vieles bestellen wir für dich.', 'Try another search term or just ask us – we can order a lot for you.')}
		</p>
		<div class="empty-actions">
			{#if brand || condition}<a class="btn btn-ghost" href={withParam('marke', null).replace(/([?&])zustand=[^&]*&?/, '$1').replace(/[?&]$/, '')}>{i.tr('Filter entfernen', 'Remove filters')}</a>{/if}
			<a class="btn" href={i.href('/kontakt')}>{i.tr('Teil anfragen', 'Ask for a part')}</a>
		</div>
	</div>
{/if}

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1.75rem;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		height: 2.5rem;
		padding: 0 0.9rem;
		background: var(--grad);
		color: #fff;
		font-size: 0.85rem;
		font-weight: 700;
		text-decoration: none;
		transition: box-shadow 250ms;
	}
	.pill:hover {
		box-shadow: var(--glow);
	}
	/* Zustand als Segment-Schalter */
	.seg {
		display: inline-flex;
		box-shadow: inset 0 0 0 1px var(--s-line-strong);
	}
	.seg a {
		display: inline-grid;
		place-items: center;
		height: 2.5rem;
		padding: 0 0.9rem;
		color: var(--s-ink-2);
		font-size: 0.85rem;
		font-weight: 650;
		text-decoration: none;
		transition:
			background-color 180ms,
			color 180ms;
	}
	.seg a:hover {
		color: var(--s-strong);
	}
	.seg a[aria-current='true'] {
		background: var(--s-ink);
		color: var(--s-bg);
	}
	.sort .select {
		min-height: 2.5rem;
		padding-block: 0.3rem;
		font-size: 0.9rem;
		width: auto;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	@media (min-width: 768px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1280px) {
		.grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}
	.pager {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-top: 2.5rem;
	}
	.pager a {
		display: grid;
		place-items: center;
		min-width: 2.6rem;
		height: 2.6rem;
		color: var(--s-strong);
		text-decoration: none;
		box-shadow: inset 0 0 0 1px var(--s-line-strong);
		font-weight: 650;
		transition: box-shadow 200ms;
	}
	.pager a:hover {
		box-shadow: inset 0 0 0 1px var(--red);
	}
	.pager a[aria-current='page'] {
		background: var(--grad);
		color: #fff;
		box-shadow: none;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6rem;
		padding: 2.5rem 0;
	}
	.empty-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.75rem;
	}
</style>
