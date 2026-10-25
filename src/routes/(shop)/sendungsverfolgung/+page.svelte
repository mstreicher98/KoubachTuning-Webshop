<script lang="ts">
	import { enhance } from '$app/forms';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import PackageSearch from '@lucide/svelte/icons/package-search';
	import Seo from '$lib/components/shop/Seo.svelte';
	import { getI18n } from '$lib/i18n.svelte';

	let { data, form } = $props();
	const i = getI18n();
	let busy = $state(false);
	const r = $derived(form?.result ?? null);

	const steps = $derived.by(() => {
		if (!r) return [];
		const pickup = r.shippingMethod === 'abholung';
		return [
			{ label: i.tr('Bestellt', 'Ordered'), done: true },
			{ label: r.paymentMethod === 'bar' ? i.tr('Bestätigt', 'Confirmed') : i.tr('Bezahlt', 'Paid'), done: r.paymentMethod === 'bar' || r.paymentStatus === 'bezahlt' || r.status !== 'zahlung_offen' },
			{ label: i.tr('In Arbeit', 'Being prepared'), done: ['in_bearbeitung', 'abholbereit', 'versendet', 'abgeschlossen'].includes(r.status) },
			{ label: pickup ? i.tr('Abholbereit', 'Ready for pickup') : i.tr('Versendet', 'Shipped'), done: ['abholbereit', 'versendet', 'abgeschlossen'].includes(r.status) }
		];
	});
	const reached = $derived(steps.filter((s) => s.done).length - 1);
	const headline = $derived.by(() => {
		if (!r) return '';
		switch (r.status) {
			case 'storniert':
				return i.tr('Diese Bestellung wurde storniert.', 'This order has been cancelled.');
			case 'zahlung_offen':
				return r.paymentMethod === 'bar'
					? i.tr('Wir stellen deine Bestellung zusammen. Bezahlt wird bei der Abholung.', 'We are preparing your order. You pay on pickup.')
					: i.tr('Wir warten noch auf die Zahlung.', 'We are still waiting for the payment.');
			case 'in_bearbeitung':
				return i.tr('Wir packen gerade deine Bestellung.', 'We are preparing your order.');
			case 'abholbereit':
				return i.tr('Deine Bestellung liegt zur Abholung bereit.', 'Your order is ready for pickup.');
			case 'versendet':
				return i.tr('Dein Paket ist unterwegs.', 'Your parcel is on its way.');
			default:
				return i.tr('Die Bestellung ist abgeschlossen.', 'The order is complete.');
		}
	});
</script>

<Seo title={i.tr('Sendung verfolgen', 'Track parcel')} description={i.tr('Status deiner Bestellung bei Koubach Tuning abrufen.', 'Check the status of your Koubach Tuning order.')} />

<div class="wrap page-top section narrow">
	<PackageSearch size={34} strokeWidth={1.75} class="icon" aria-hidden="true" />
	<h1 class="display h1">{i.tr('Sendung verfolgen', 'Track parcel')}</h1>
	<p class="lead">{i.tr('Gib deine Bestellnummer mit der E-Mail-Adresse der Bestellung ein – oder direkt die Sendungsnummer aus der Versandmail.', 'Enter your order number together with the email address of the order – or the tracking number from the shipping email.')}</p>

	<form
		method="POST"
		class="panel lookup"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				busy = false;
				await update({ reset: false });
			};
		}}
	>
		<div class="grid-2">
			<label class="field">
				<span class="label">{i.tr('Bestell- oder Sendungsnummer', 'Order or tracking number')}</span>
				<input class="input" name="nummer" required maxlength="40" value={form?.values?.number ?? ''} autocomplete="off" />
			</label>
			<label class="field">
				<span class="label">{i.tr('E-Mail (bei Bestellnummer)', 'Email (with order number)')}</span>
				<input class="input" name="email" type="email" maxlength="200" value={form?.values?.email ?? data.email} autocomplete="email" />
			</label>
		</div>
		{#if form?.error}<p class="alert alert-error" role="alert">{form.error}</p>{/if}
		<button class="btn" aria-busy={busy} disabled={busy}>{busy ? i.tr('Suche …', 'Searching …') : i.tr('Status anzeigen', 'Show status')}</button>
	</form>

	{#if r}
		<section class="result panel" aria-live="polite">
			<p class="muted small">{i.tr('Bestellung', 'Order')} {r.number} · {i.date(r.createdAt)}</p>
			<h2 class="h3">{headline}</h2>
			{#if r.status !== 'storniert'}
				<ol class="progress">
					{#each steps as s, n (s.label)}
						<li class:done={s.done} aria-current={n === reached ? 'step' : undefined}>{s.label}</li>
					{/each}
				</ol>
			{/if}
			{#if r.trackingNumber}
				<div class="parcel">
					<div>
						<p class="muted small">{r.trackingCarrier || i.tr('Versanddienst', 'Carrier')}</p>
						<p class="tn tabular">{r.trackingNumber}</p>
						{#if r.shippedAt}<p class="muted small">{i.tr('Versendet am', 'Shipped on')} {i.date(r.shippedAt)}</p>{/if}
					</div>
					{#if r.trackingUrl}<a class="btn btn-ghost" href={r.trackingUrl} target="_blank" rel="noopener noreferrer">{i.tr('Beim Versanddienst ansehen', 'View at carrier')} <ExternalLink size={16} /></a>{/if}
				</div>
				<p class="hint">{i.tr('Den genauen Paketverlauf zeigt der Versanddienst.', 'The carrier shows the detailed parcel history.')}</p>
			{/if}
		</section>
	{/if}
</div>

<style>
	.narrow {
		max-width: 46rem;
	}
	.narrow :global(.icon) {
		color: var(--red);
		margin-bottom: 0.75rem;
	}
	.lead {
		margin-top: 0.75rem;
	}
	.lookup {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
		margin-top: 2rem;
	}
	.lookup .grid-2 {
		width: 100%;
	}
	.result {
		margin-top: 1.25rem;
		border-top: 4px solid var(--red);
		animation: alert-in 500ms var(--ease-expo);
	}
	.result h2 {
		margin-top: 0.3rem;
	}
	.progress {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.35rem;
		margin: 1.5rem 0 0.5rem;
	}
	.progress li {
		padding-top: 0.6rem;
		border-top: 3px solid var(--s-line);
		font-size: 0.8rem;
		font-weight: 650;
		color: var(--s-ink-4);
	}
	.progress li.done {
		border-top-color: var(--red);
		color: var(--s-ink-2);
	}
	.progress li[aria-current='step'] {
		color: var(--s-strong);
	}
	.parcel {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid var(--s-line);
	}
	.tn {
		font-size: 1.25rem;
		font-weight: 750;
		font-stretch: 110%;
		letter-spacing: 0.02em;
	}
	.hint {
		margin-top: 0.75rem;
	}
	@keyframes alert-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
	}
</style>
