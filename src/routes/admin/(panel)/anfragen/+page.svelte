<script lang="ts">
	import { enhance } from '$app/forms';
	import Mail from '@lucide/svelte/icons/mail';
	import { formatStamp } from '$lib/format';
	import { submitting } from '$lib/formEnhance';
	import { INQUIRY_KIND_LABEL } from '$lib/admin-labels';

	let { data } = $props();
	let busy = $state(false);
	const setBusy = (b: boolean) => (busy = b);
	const STATUS: Record<string, [string, string]> = { neu: ['Neu', 'badge-warn'], in_bearbeitung: ['In Bearbeitung', 'badge-info'], erledigt: ['Erledigt', 'badge-ok'] };
	const reply = (r: (typeof data.rows)[number]) =>
		`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.productTitle || r.subject || (r.locale === 'en' ? 'Your request' : 'Deine Anfrage')}`)}&body=${encodeURIComponent(`\n\n---\n${r.message}`)}`;
</script>

<svelte:head><title>Anfragen | KT Intern</title></svelte:head>

<div class="page-head">
	<div>
		<h1 class="page-title">Anfragen</h1>
		<p class="page-sub">Aus dem Kontaktformular und von Fahrzeug- und Produktseiten. Antworten gehen per E-Mail aus deinem Mailprogramm.</p>
	</div>
	<div class="row">
		<nav class="tabs-inline" aria-label="Art">
			{#each [['', 'Alle'], ['fahrzeug', 'Fahrzeuge'], ['produkt', 'Artikel'], ['kontakt', 'Kontakt']] as [k, label] (k)}
				<a class="btn btn-sm" class:btn-primary={(data.kind ?? '') === k} href="/admin/anfragen?{new URLSearchParams({ ...(k ? { art: k } : {}), ...(data.all ? { alle: '' } : {}) })}">{label}</a>
			{/each}
		</nav>
		<a class="btn btn-ghost" href={data.all ? '/admin/anfragen' : '/admin/anfragen?alle'}>{data.all ? 'Nur offene' : 'Auch erledigte'}</a>
	</div>
</div>

{#if data.rows.length}
	<ul class="list">
		{#each data.rows as r (r.id)}
			<li class="card card-pad" id="anfrage-{r.id}">
				<div class="head">
					<div>
						<span class="badge">{INQUIRY_KIND_LABEL[r.kind]}</span>
						<strong>{#if r.productId}<a href="/admin/produkte/{r.productId}">{r.productTitle}</a>{:else}{r.productTitle || r.subject || 'Anfrage'}{/if}</strong>{#if r.productTitle && r.subject}<span class="muted small"> · {r.subject}</span>{/if}
						<span class="muted small"> · {r.name} · {formatStamp(r.createdAt)}{r.locale === 'en' ? ' · EN' : ''}</span>
					</div>
					<span class="badge {STATUS[r.status][1]}">{STATUS[r.status][0]}</span>
				</div>
				<p class="msg">{r.message}</p>
				<p class="small"><a href="mailto:{r.email}">{r.email}</a>{#if r.phone} · <a href="tel:{r.phone}">{r.phone}</a>{/if}</p>
				<form method="POST" action="?/status" class="row" use:enhance={submitting(setBusy)}>
					<input type="hidden" name="id" value={r.id} />
					<input class="input grow" name="notiz" value={r.internalNote} placeholder="Interne Notiz" aria-label="Notiz" />
					<a class="btn btn-sm" href={reply(r)}><Mail size={15} /> Antworten</a>
					{#if r.status !== 'in_bearbeitung'}<button class="btn btn-sm" name="status" value="in_bearbeitung" disabled={busy}>In Bearbeitung</button>{/if}
					{#if r.status !== 'erledigt'}<button class="btn btn-sm btn-primary" name="status" value="erledigt" disabled={busy}>Erledigt</button>{:else}<button class="btn btn-sm" name="status" value="neu" disabled={busy}>Wieder öffnen</button>{/if}
				</form>
			</li>
		{/each}
	</ul>
{:else}
	<p class="empty card card-pad">Keine offenen Anfragen.</p>
{/if}

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.msg {
		margin: 0.75rem 0;
		white-space: pre-line;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.75rem;
	}
	.tabs-inline {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.grow {
		flex: 1;
		min-width: 12rem;
	}
</style>
