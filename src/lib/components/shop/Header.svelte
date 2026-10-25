<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Menu from '@lucide/svelte/icons/menu';
	import Search from '@lucide/svelte/icons/search';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import UserRound from '@lucide/svelte/icons/user-round';
	import X from '@lucide/svelte/icons/x';
	import PackageSearch from '@lucide/svelte/icons/package-search';
	import { fade, fly, slide } from 'svelte/transition';
	import { cubicIn, expoOut } from 'svelte/easing';
	import { getI18n, switchLocalePath } from '$lib/i18n.svelte';
	import { dur } from '$lib/motion';
	import type { CategoryNode } from '$lib/server/shop/catalog';
	import MegaMenu from './MegaMenu.svelte';

	interface Props {
		menu: CategoryNode[];
		cartCount: number;
		loggedIn: boolean;
		onCart: () => void;
	}

	let { menu, cartCount, loggedIn, onCart }: Props = $props();
	const i = getI18n();

	let open = $state<number | null>(null);
	let drawer = $state(false);
	let searching = $state(false);
	let expanded = $state<number | null>(null);
	let closeTimer: ReturnType<typeof setTimeout> | null = null;

	afterNavigate(() => {
		open = null;
		drawer = false;
		searching = false;
	});

	function enter(id: number) {
		if (closeTimer) clearTimeout(closeTimer);
		open = id;
	}
	function leave() {
		if (closeTimer) clearTimeout(closeTimer);
		closeTimer = setTimeout(() => (open = null), 160);
	}

	const other = $derived(i.locale === 'de' ? 'en' : 'de');
	const switchHref = $derived(switchLocalePath(page.url.pathname, page.url.search, other));
	const current = $derived(menu.find((m) => m.id === open) ?? null);

	function focusSearch(node: HTMLInputElement) {
		node.focus();
	}

	// Beim Scrollen: halbtransparent mit Unschärfe; nach unten weg, nach oben wieder da
	let scrolled = $state(false);
	let tucked = $state(false);
	let lastY = 0;
	function onScroll() {
		const y = window.scrollY;
		scrolled = y > 8;
		if (open !== null || searching || y < 320) tucked = false;
		else if (y > lastY + 8) tucked = true;
		else if (y < lastY - 8) tucked = false;
		lastY = y;
	}
</script>

<svelte:window
	onscroll={onScroll}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			open = null;
			searching = false;
			drawer = false;
		}
	}}
/>

<header class="head zone-dark" class:scrolled class:tucked onfocusin={() => (tucked = false)}>
	<div class="bar wrap">
		<button type="button" class="icon-btn only-mobile" aria-label={i.tr('Menü öffnen', 'Open menu')} onclick={() => (drawer = true)}><Menu size={24} /></button>

		<a href={i.href('/')} class="logo" aria-label="Koubach Tuning – {i.tr('Startseite', 'Home')}">
			<img src="/bilder/logo.webp" alt="" width="640" height="145" />
		</a>

		<nav class="nav only-desktop" aria-label={i.tr('Hauptmenü', 'Main menu')}>
			{#each menu as item (item.id)}
				{#if item.children.length}
					<div class="nav-item" role="presentation" onmouseenter={() => enter(item.id)} onmouseleave={leave}>
						<button type="button" class="nav-link" aria-expanded={open === item.id} aria-controls="mega" onclick={() => (open = open === item.id ? null : item.id)}>
							{item.name}
							<ChevronDown size={15} />
						</button>
					</div>
				{:else}
					<a class="nav-link" href={i.href(`/kategorie/${item.slug}`)}>{item.name}</a>
				{/if}
			{/each}
		</nav>

		<div class="tools">
			<button type="button" class="icon-btn only-desktop" aria-label={i.tr('Suchen', 'Search')} onclick={() => (searching = !searching)}><Search size={21} /></button>
			<a href={i.href('/sendungsverfolgung')} class="icon-btn only-desktop" title={i.tr('Sendung verfolgen', 'Track parcel')} aria-label={i.tr('Sendung verfolgen', 'Track parcel')}><PackageSearch size={21} /></a>
			<a href={switchHref} class="lang only-desktop" hreflang={other} lang={other} aria-label={other === 'en' ? 'English' : 'Deutsch'}>{other.toUpperCase()}</a>
			<a href={i.href('/konto')} class="icon-btn" aria-label={loggedIn ? i.tr('Mein Konto', 'My account') : i.tr('Anmelden', 'Log in')}><UserRound size={22} /></a>
			<button type="button" class="icon-btn cart" aria-label={i.tr(`Warenkorb, ${cartCount} Artikel`, `Cart, ${cartCount} items`)} onclick={onCart}>
				<ShoppingBag size={22} />
				{#if cartCount > 0}{#key cartCount}<span class="count">{cartCount > 99 ? '99+' : cartCount}</span>{/key}{/if}
			</button>
		</div>
	</div>

	{#if searching}
		<form class="search wrap" out:fade={{ duration: dur(120) }} action={i.href('/produkte')} method="GET" role="search">
			<Search size={20} />
			<input use:focusSearch name="q" type="search" placeholder={i.tr('Zylinder, Auspuff, Reifendimension …', 'Cylinder, exhaust, tyre size …')} aria-label={i.tr('Suchbegriff', 'Search term')} />
			<button class="btn btn-sm">{i.tr('Suchen', 'Search')}</button>
		</form>
	{/if}

	{#if current}
		<div id="mega" class="mega only-desktop" role="presentation" onmouseenter={() => enter(current.id)} onmouseleave={leave} out:fade={{ duration: dur(140) }}>
			{#key current.id}<MegaMenu category={current} />{/key}
		</div>
	{/if}
</header>

{#if drawer}
	<div class="scrim" onclick={() => (drawer = false)} aria-hidden="true" out:fade={{ duration: dur(220) }}></div>
	<div class="drawer zone-dark" role="dialog" out:fly={{ x: -380, duration: dur(260), easing: cubicIn, opacity: 1 }} aria-modal="true" aria-label={i.tr('Menü', 'Menu')}>
		<div class="drawer-head">
			<img src="/bilder/logo.webp" alt="Koubach Tuning" width="640" height="145" />
			<!-- svelte-ignore a11y_autofocus -->
			<button type="button" class="icon-btn" aria-label={i.tr('Menü schließen', 'Close menu')} onclick={() => (drawer = false)} autofocus><X size={24} /></button>
		</div>
		<form class="drawer-search" action={i.href('/produkte')} method="GET" role="search">
			<input class="input" name="q" type="search" placeholder={i.tr('Suchen …', 'Search …')} aria-label={i.tr('Suchbegriff', 'Search term')} />
		</form>
		<ul class="drawer-nav">
			{#each menu as item, n (item.id)}
				<li style="--i: {n}">
					{#if item.children.length}
						<button type="button" class="d-link" aria-expanded={expanded === item.id} onclick={() => (expanded = expanded === item.id ? null : item.id)}>
							{item.name}
							<ChevronDown size={18} />
						</button>
						{#if expanded === item.id}
							<ul class="d-sub" transition:slide={{ duration: dur(280), easing: expoOut }}>
								<li><a href={i.href(`/kategorie/${item.slug}`)}>{i.tr('Alle', 'All')} {item.name}</a></li>
								{#each item.children as child (child.id)}
									<li><a href={i.href(`/kategorie/${child.slug}`)}>{child.name}</a></li>
								{/each}
							</ul>
						{/if}
					{:else}
						<a class="d-link" href={i.href(`/kategorie/${item.slug}`)}>{item.name}</a>
					{/if}
				</li>
			{/each}
			<li style="--i: {menu.length}"><a class="d-link" href={i.href('/sendungsverfolgung')}><span><PackageSearch size={18} /> {i.tr('Sendung verfolgen', 'Track parcel')}</span></a></li>
			<li style="--i: {menu.length + 1}"><a class="d-link" href={i.href('/konto')}>{loggedIn ? i.tr('Mein Konto', 'My account') : i.tr('Anmelden', 'Log in')}</a></li>
			<li style="--i: {menu.length + 2}"><a class="d-link" href={i.href('/kontakt')}>{i.tr('Kontakt', 'Contact')}</a></li>
			<li style="--i: {menu.length + 3}"><a class="d-link" href={switchHref} hreflang={other} lang={other}>{other === 'en' ? 'English' : 'Deutsch'}</a></li>
		</ul>
	</div>
{/if}

<style>
	.head {
		position: sticky;
		top: 0;
		z-index: 40;
		background: var(--s-bg);
		view-transition-name: site-header;
		transition:
			transform 420ms var(--ease-expo),
			background-color 300ms,
			border-color 300ms;
	}
	/* Rot-Weiß-Rot als feine Kante unter dem Kopf */
	.head::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -3px;
		height: 3px;
		background: var(--rwr);
		pointer-events: none;
	}
	.head.scrolled {
		background: rgb(18 19 22 / 0.78);
		-webkit-backdrop-filter: blur(18px) saturate(1.6);
		backdrop-filter: blur(18px) saturate(1.6);
	}
	.head.tucked {
		transform: translateY(-100%);
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		height: var(--header-h);
	}
	.logo {
		display: block;
		flex-shrink: 0;
		transition: opacity 200ms;
	}
	.logo:hover {
		opacity: 0.8;
	}
	.logo img {
		height: 2.1rem;
		width: auto;
	}
	@media (max-width: 1023px) {
		.logo {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}
	}
	@media (min-width: 1024px) {
		.logo img {
			height: 2.6rem;
		}
	}
	.nav {
		display: flex;
		align-items: stretch;
		height: 100%;
		margin-left: 1.75rem;
	}
	.nav-item {
		display: flex;
	}
	.nav-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0 0.65rem;
		white-space: nowrap;
		color: var(--s-strong);
		font-size: 0.875rem;
		font-weight: 700;
		font-stretch: 112%;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-decoration: none;
	}
	/* Verlaufs-Strich an der Unterkante, wächst von links */
	.nav-link::after {
		content: '';
		position: absolute;
		left: 0.65rem;
		right: 0.65rem;
		bottom: -1px;
		height: 2px;
		background: var(--grad);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 380ms var(--ease-expo);
	}
	.nav-link:hover::after,
	.nav-link[aria-expanded='true']::after {
		transform: none;
	}
	.nav-link :global(svg) {
		transition: transform 300ms var(--ease-expo);
	}
	.nav-link[aria-expanded='true'] :global(svg) {
		transform: rotate(180deg);
	}
	.tools {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		margin-left: auto;
	}
	@media (min-width: 1280px) {
		.nav-link {
			padding: 0 0.9rem;
		}
	}
	.lang {
		display: inline-grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		color: var(--s-ink-3);
		font-size: 0.8rem;
		font-weight: 750;
		letter-spacing: 0.05em;
		text-decoration: none;
	}
	.lang:hover {
		color: var(--s-strong);
	}
	.cart {
		position: relative;
	}
	.count {
		position: absolute;
		top: 0.2rem;
		right: 0.05rem;
		min-width: 1.15rem;
		height: 1.15rem;
		padding: 0 0.25rem;
		border-radius: 999px;
		background: var(--grad);
		color: #fff;
		box-shadow: 0 0 0 2px var(--s-bg);
		animation: pop 460ms var(--ease-spring);
		font-size: 0.68rem;
		font-weight: 800;
		line-height: 1.15rem;
		text-align: center;
	}
	@keyframes pop {
		from {
			transform: scale(0.3);
		}
	}
	.only-desktop {
		display: none;
	}
	@media (min-width: 1024px) {
		.only-desktop {
			display: inline-flex;
		}
		.only-mobile {
			display: none;
		}
	}
	.search {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-block: 0.9rem;
		border-top: 1px solid var(--s-line);
		color: var(--s-ink-3);
		animation: search-in 360ms var(--ease-expo);
	}
	@keyframes search-in {
		from {
			opacity: 0;
			transform: translateY(-0.5rem);
		}
	}
	.search input {
		flex: 1;
		min-width: 0;
		height: 2.75rem;
		background: transparent;
		border: 0;
		border-bottom: 1px solid var(--s-line-strong);
		color: var(--s-strong);
		font-size: 1.1rem;
	}
	.search input:focus {
		outline: none;
		border-bottom-color: var(--red);
	}

	/* Mega-Menü */
	.mega {
		position: absolute;
		left: 0;
		right: 0;
		top: 100%;
		background: var(--s-bg);
		border-bottom: 1px solid var(--s-line);
		box-shadow: 0 40px 80px -30px rgb(0 0 0 / 0.7);
		animation: drop 420ms var(--ease-expo);
	}
	@keyframes drop {
		from {
			clip-path: inset(0 0 100% 0);
		}
		to {
			clip-path: inset(0 0 -6rem 0);
		}
	}
	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateX(-1.25rem);
		}
	}

	/* Mobiles Menü */
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgb(0 0 0 / 0.7);
		-webkit-backdrop-filter: blur(4px);
		backdrop-filter: blur(4px);
		animation: fade-in 240ms var(--ease-out);
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	.drawer {
		position: fixed;
		z-index: 61;
		top: 0;
		bottom: 0;
		left: 0;
		width: min(22rem, 88vw);
		overflow-y: auto;
		overflow-x: hidden;
		background: var(--s-bg);
		border-right: 1px solid var(--s-line);
		padding: 0.75rem 1rem 2rem;
		animation: slide 420ms var(--ease-expo);
	}
	@keyframes slide {
		from {
			transform: translateX(-100%);
		}
	}
	.drawer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	.drawer-head img {
		height: 1.9rem;
		width: auto;
	}
	.drawer-search {
		margin-bottom: 0.75rem;
	}
	.drawer-nav > li {
		border-bottom: 1px solid var(--s-line);
		animation: row-in 560ms var(--ease-expo) both;
		animation-delay: calc(120ms + var(--i, 0) * 40ms);
	}
	.d-link :global(svg) {
		transition: transform 300ms var(--ease-expo);
	}
	.d-link[aria-expanded='true'] :global(svg) {
		transform: rotate(180deg);
	}
	.d-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-height: 3.4rem;
		color: var(--s-strong);
		font-weight: 750;
		font-stretch: 112%;
		text-transform: uppercase;
		text-decoration: none;
		letter-spacing: 0.03em;
	}
	.d-link span {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.d-sub {
		padding: 0 0 0.75rem 0.75rem;
	}
	.d-sub a {
		display: block;
		padding: 0.55rem 0;
		color: var(--s-ink-2);
		text-decoration: none;
	}
</style>
