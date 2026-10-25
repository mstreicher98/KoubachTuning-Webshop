<script lang="ts">
	import { page } from '$app/state';
	import { delocalizePath, getI18n } from '$lib/i18n.svelte';

	let { data, children } = $props();
	const i = getI18n();
	const path = $derived(delocalizePath(page.url.pathname));
	const nav = $derived([
		{ href: '/konto', label: i.tr('Bestellungen', 'Orders'), active: path === '/konto' || path.startsWith('/konto/bestellungen') },
		{ href: '/konto/adressen', label: i.tr('Adressen', 'Addresses'), active: path === '/konto/adressen' },
		{ href: '/konto/profil', label: i.tr('Profil', 'Profile'), active: path === '/konto/profil' }
	]);
</script>

<div class="wrap page-top section">
	<div class="head">
		<div>
			<p class="muted">{i.tr('Mein Konto', 'My account')}</p>
			<h1 class="display h1">{i.tr('Hallo', 'Hi')} {data.me.firstName || data.me.email}</h1>
		</div>
		<form method="POST" action={i.href('/konto/abmelden')}><button class="btn btn-ghost btn-sm">{i.tr('Abmelden', 'Log out')}</button></form>
	</div>
	<nav class="tabs" aria-label={i.tr('Konto', 'Account')}>
		{#each nav as n (n.href)}<a href={i.href(n.href)} aria-current={n.active ? 'page' : undefined}>{n.label}</a>{/each}
	</nav>
	{@render children()}
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
	}
	.tabs {
		display: flex;
		gap: 0.25rem;
		margin: 1.75rem 0 2rem;
		overflow-x: auto;
		overflow-y: hidden;
		border-bottom: 1px solid var(--s-line);
	}
	.tabs a {
		padding: 0.8rem 1rem;
		color: var(--s-ink-3);
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		border-bottom: 3px solid transparent;
		margin-bottom: -1px;
		transition: color 180ms;
	}
	.tabs a:hover {
		color: var(--s-strong);
	}
	.tabs a[aria-current='page'] {
		color: var(--s-strong);
		border-image: var(--grad) 1;
	}
</style>
