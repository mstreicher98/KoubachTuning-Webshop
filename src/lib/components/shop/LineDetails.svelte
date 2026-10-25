<script lang="ts">
	import { getI18n } from '$lib/i18n.svelte';
	import type { LineConfigSnapshot } from '$lib/shop-types';

	/** Ausführung, Zusatzangaben, Dateien und Bundle-Inhalt einer Zeile */
	let { config, variantTitle = '', files = {} }: { config: LineConfigSnapshot; variantTitle?: string; files?: Record<number, { key: string; name: string }> } = $props();
	const i = getI18n();
</script>

<dl class="details">
	{#if variantTitle}<div><dt class="sr-only">{i.tr('Ausführung', 'Option')}</dt><dd>{variantTitle}</dd></div>{/if}
	{#each config.fields ?? [] as f (f.key)}<div><dt>{f.label}:</dt><dd class="pre">{f.value}</dd></div>{/each}
	{#each config.files ?? [] as f (f.key)}
		<div>
			<dt>{f.label}:</dt>
			<dd>
				{#each f.fileIds as id, n (id)}{#if files[id]}<a class="link" href="/datei/{files[id].key}" target="_blank" rel="noopener">{files[id].name}</a>{:else}{i.tr(`Datei ${n + 1}`, `File ${n + 1}`)}{/if}{#if n < f.fileIds.length - 1},{' '}{/if}{/each}
			</dd>
		</div>
	{/each}
	{#each config.bundle ?? [] as b (b.title + b.variantTitle)}<div><dd>{b.quantity}× {b.title}{b.variantTitle ? ` (${b.variantTitle})` : ''}</dd></div>{/each}
	{#if config.gift && (config.gift.name || config.gift.email)}<div><dt>{i.tr('Für', 'For')}:</dt><dd>{config.gift.name} {config.gift.email}</dd></div>{/if}
</dl>

<style>
	.details {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.85rem;
		color: var(--s-ink-3);
	}
	.details div {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	dt {
		color: var(--s-ink-4);
	}
	.pre {
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
</style>
