<script lang="ts">
	import '$lib/shop.css';
	import { afterNavigate, onNavigate } from '$app/navigation';
	import CartDrawer from '$lib/components/shop/CartDrawer.svelte';
	import Footer from '$lib/components/shop/Footer.svelte';
	import Header from '$lib/components/shop/Header.svelte';
	import { cartUi } from '$lib/cart-ui.svelte';
	import { I18n, setI18n } from '$lib/i18n.svelte';
	import { prefersReducedMotion } from 'svelte/motion';

	let { data, children } = $props();

	const i18n = new I18n(data.locale);
	setI18n(i18n);
	$effect.pre(() => {
		i18n.locale = data.locale;
	});

	// Besucherzählung ohne Cookies: nur echte Seitenwechsel, keine vorab geladenen Daten
	afterNavigate(({ to }) => {
		if (!to?.url || typeof navigator.sendBeacon !== 'function') return;
		navigator.sendBeacon('/api/aufruf', to.url.pathname);
	});

	// Weicher Seitenwechsel; Filter und Auswahl auf derselben Seite wechseln ohne Überblendung
	onNavigate((nav) => {
		if (!document.startViewTransition || prefersReducedMotion.current) return;
		if (!nav.to || nav.from?.url.pathname === nav.to.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="manifest" href="/shop.webmanifest" />
</svelte:head>

<div class="shop">
	<a href="#inhalt" class="skip">{i18n.tr('Zum Inhalt springen', 'Skip to content')}</a>
	{#if data.notice}
		<p class="notice">{data.notice}</p>
	{/if}
	<Header menu={data.menu} cartCount={data.cart.count} loggedIn={!!data.customer} onCart={() => (cartUi.open = true)} />
	<main id="inhalt" class="main">
		{@render children()}
	</main>
	<Footer pages={data.footerPages} company={data.company} taxMode={data.taxMode} />
	<CartDrawer open={cartUi.open} lines={data.cart.lines} total={data.cart.total} onClose={() => (cartUi.open = false)} />
</div>


<style>
	.skip {
		position: absolute;
		left: -999px;
		top: 0.5rem;
		z-index: 100;
		padding: 0.6rem 1rem;
		background: var(--grad);
		color: #fff;
		font-weight: 700;
	}
	.skip:focus {
		left: 0.5rem;
	}
	.notice {
		padding: 0.5rem 1rem;
		background: var(--grad);
		color: #fff;
		font-size: 0.85rem;
		font-weight: 650;
		text-align: center;
	}
	.main {
		flex: 1;
	}
</style>
