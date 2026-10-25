<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import Copy from '@lucide/svelte/icons/copy';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash from '@lucide/svelte/icons/trash-2';
	import GalleryField from '$lib/components/admin/GalleryField.svelte';
	import RichEditor from '$lib/components/admin/RichEditor.svelte';
	import SaveBar from '$lib/components/admin/SaveBar.svelte';
	import { euroInput, parseEuro } from '$lib/admin-labels';
	import { submitting } from '$lib/formEnhance';
	import { emptyField, FIELD_PRESETS, FIELD_TYPE_LABELS } from '$lib/product-presets';
	import type { Condition, FieldType, PersonalizationField, ProductOption, ProductSpec } from '$lib/shop-types';

	let { data } = $props();
	const p = data.product;

	let busy = $state(false);
	const setBusy = (b: boolean) => (busy = b);

	/* ---------------- Grunddaten */
	let kind = $state(p.kind);
	let condition = $state<Condition>(p.condition);
	let stockMode = $state(p.stockMode);
	let images = $state(data.images);
	let lang = $state<'de' | 'en'>('de');

	/* ---------------- Optionen und Varianten */
	let options = $state<ProductOption[]>(structuredClone(p.options));
	type Row = { id: number | null; values: string[]; sku: string; price: string; compareAt: string; stock: number; active: boolean };
	let rows = $state<Row[]>(
		data.variants.length
			? data.variants.map((v) => ({ id: v.id, values: v.values, sku: v.sku, price: euroInput(v.price), compareAt: euroInput(v.compareAt), stock: v.stock, active: v.active }))
			: [{ id: null, values: [], sku: '', price: '', compareAt: '', stock: data.newStock, active: true }]
	);

	function combos(opts: ProductOption[]): string[][] {
		return opts.reduce<string[][]>((acc, o) => acc.flatMap((a) => o.values.filter((v) => v.de.trim()).map((v) => [...a, v.de.trim()])), [[]]);
	}
	/** Varianten an die Optionen anpassen – vorhandene Preise bleiben erhalten */
	function syncRows() {
		const clean = options.filter((o) => o.name.trim() && o.values.some((v) => v.de.trim()));
		const wanted = combos(clean);
		const byKey = new Map(rows.map((r) => [JSON.stringify(r.values), r]));
		const template = rows[0];
		const used = new Set<Row>();
		rows = wanted.map((values) => {
			const exact = byKey.get(JSON.stringify(values));
			if (exact) {
				used.add(exact);
				return exact;
			}
			// Neue Option dazugekommen: die bisherige Variante lebt in der ersten passenden Kombination weiter
			// (gleiche ID → Lagerstand und Warenkörbe bleiben), weitere Kombinationen übernehmen die Preise
			const parent = rows.find((r) => r.values.length < values.length && r.values.every((v) => values.includes(v)));
			if (parent && !used.has(parent)) {
				used.add(parent);
				return { ...parent, values };
			}
			const base = parent ?? template;
			return { id: null, values, sku: '', price: base?.price ?? '', compareAt: base?.compareAt ?? '', stock: 0, active: true };
		});
	}
	const addOption = () => {
		options = [...options, { name: '', nameEn: '', values: [{ de: '', en: '' }] }];
	};

	/* ---------------- Technische Daten */
	let specs = $state<ProductSpec[]>(structuredClone(p.specs));
	/** Häufige Angaben je nach Bereich – ein Klick legt die Zeile an */
	const SPEC_SUGGESTIONS: Record<string, [string, string][]> = {
		teil: [
			['Passend für', 'Fits'],
			['Hubraum', 'Displacement'],
			['Motor', 'Engine'],
			['Material', 'Material'],
			['Herstellernummer', 'Manufacturer part no.'],
			['Straßenzulassung', 'Road approval']
		],
		reifen: [
			['Dimension', 'Size'],
			['Last-/Geschwindigkeitsindex', 'Load/speed index'],
			['Einsatz', 'Use'],
			['DOT', 'DOT'],
			['Profiltiefe', 'Tread depth']
		],
		fahrzeug: [
			['Marke und Modell', 'Make and model'],
			['Erstzulassung', 'First registration'],
			['Kilometerstand', 'Mileage'],
			['Hubraum', 'Displacement'],
			['Leistung', 'Power'],
			['Typisierung', 'Type approval'],
			['Umbauten', 'Modifications'],
			['Service', 'Service']
		]
	};
	let specSet = $state<'teil' | 'reifen' | 'fahrzeug'>(p.kind === 'fahrzeug' ? 'fahrzeug' : 'teil');
	$effect.pre(() => {
		if (kind === 'fahrzeug') specSet = 'fahrzeug';
	});
	const addSpec = (label = '', labelEn = '') => {
		specs = [...specs, { label, labelEn, value: '', valueEn: '' }];
	};

	/* ---------------- Zusatzangaben beim Bestellen */
	let fields = $state<PersonalizationField[]>(structuredClone(p.fields));
	let openField = $state<number | null>(null);
	function usePreset() {
		if (fields.length && !confirm('Die bisherigen Felder werden durch die Vorlage ersetzt. Fortfahren?')) return;
		fields = structuredClone(FIELD_PRESETS.fahrzeug);
	}
	function moveField(i: number, d: number) {
		const j = i + d;
		if (j < 0 || j >= fields.length) return;
		const next = [...fields];
		[next[i], next[j]] = [next[j], next[i]];
		fields = next;
	}

	/* ---------------- Bundle */
	let bundle = $state(structuredClone(data.bundle));

	const payload = $derived(
		JSON.stringify({
			options,
			variants: rows,
			fields,
			specs,
			bundle
		})
	);

	const topCats = $derived(data.categories.filter((c) => !c.parentId));
	const childCats = (id: number) => data.categories.filter((c) => c.parentId === id);
	const surchargeText = (n: number) => euroInput(n);
</script>

<svelte:head><title>{data.isNew ? 'Neues Produkt' : p.title} | KT Intern</title></svelte:head>

<a href="/admin/produkte" class="back"><ArrowLeft size={16} /> Produkte</a>
<div class="page-head">
	<div>
		<h1 class="page-title">{data.isNew ? 'Neues Produkt' : p.title}</h1>
		{#if !data.isNew}<p class="page-sub">/produkt/{p.slug}</p>{/if}
	</div>
	{#if !data.isNew}
		<div class="head-actions">
			<a class="btn btn-ghost" href="/admin/zum-shop?pfad=/produkt/{p.slug}" target="_blank" rel="noopener"><ExternalLink size={16} /> Ansehen</a>
			<form method="POST" action="?/kopieren" use:enhance><button class="btn btn-ghost"><Copy size={16} /> Kopieren</button></form>
		</div>
	{/if}
</div>

<form method="POST" action="?/speichern" class="editor" use:enhance={submitting(setBusy)}>
	<input type="hidden" name="daten" value={payload} />

	<div class="cols">
		<div class="main">
			<!-- Grunddaten -->
			<section class="card card-pad stack">
				<div class="lang" role="tablist" aria-label="Sprache">
					<button type="button" role="tab" aria-selected={lang === 'de'} onclick={() => (lang = 'de')}>Deutsch</button>
					<button type="button" role="tab" aria-selected={lang === 'en'} onclick={() => (lang = 'en')}>English</button>
				</div>
				<div class:hidden={lang !== 'de'} class="stack">
					<div class="grid-title">
						<label class="field"><span class="label">Hersteller</span><input class="input" name="hersteller" value={p.brand} maxlength="80" list="hersteller-liste" placeholder="z. B. Malossi" /></label>
						<label class="field"><span class="label">Titel</span><input class="input" name="titel" value={p.title} maxlength="150" required={lang === 'de'} /></label>
					</div>
					<datalist id="hersteller-liste">{#each data.brands as b (b)}<option value={b}></option>{/each}</datalist>
					<label class="field"><span class="label">Untertitel <span class="opt">(optional)</span></span><input class="input" name="untertitel" value={p.subtitle} maxlength="200" /></label>
					<RichEditor name="beschreibung" value={p.descriptionHtml} label="Beschreibung" />
					<label class="field"><span class="label">Lieferzeit <span class="opt">(z. B. „2–3 Wochen“)</span></span><input class="input" name="lieferzeit" value={p.leadTime} maxlength="80" /></label>
				</div>
				<div class:hidden={lang !== 'en'} class="stack">
					<p class="hint">Leere Felder zeigen im englischen Shop den deutschen Text.</p>
					<label class="field"><span class="label">Title</span><input class="input" name="titel_en" value={p.titleEn} maxlength="150" /></label>
					<label class="field"><span class="label">Subtitle</span><input class="input" name="untertitel_en" value={p.subtitleEn} maxlength="200" /></label>
					<RichEditor name="beschreibung_en" value={p.descriptionHtmlEn} label="Description" />
					<label class="field"><span class="label">Delivery time</span><input class="input" name="lieferzeit_en" value={p.leadTimeEn} maxlength="80" /></label>
				</div>
			</section>

			<section class="card card-pad">
				<GalleryField name="bilder" label="Bilder" bind:value={images} />
				<p class="hint">Das erste Bild erscheint in Listen, das zweite beim Darüberfahren. Querformat 4:3 passt am besten. Bei Gebrauchtem echte Fotos inklusive Gebrauchsspuren.</p>
			</section>

			{#if kind !== 'gutschein'}
				<!-- Zustand -->
				<section class="card card-pad stack">
					<div>
						<h2 class="card-title">Zustand</h2>
						<p class="card-sub">Bei Gebrauchtem bitte ehrlich beschreiben – das schützt vor Rücksendungen.</p>
					</div>
					<div class="segmented">
						<label><input type="radio" name="zustand" value="neu" bind:group={condition} /><span>Neu</span></label>
						<label><input type="radio" name="zustand" value="gebraucht" bind:group={condition} /><span>Gebraucht</span></label>
						<label><input type="radio" name="zustand" value="ueberholt" bind:group={condition} /><span>Generalüberholt</span></label>
					</div>
					{#if condition !== 'neu'}
						<div class="grid-2">
							<label class="field"><span class="label">Zustand im Detail</span><textarea class="textarea" name="zustand_text" rows="3" maxlength="1000" placeholder="z. B. Laufleistung ca. 3.000 km, leichte Kratzer am Krümmer, technisch einwandfrei">{p.conditionNote}</textarea></label>
							<label class="field"><span class="label">Englisch</span><textarea class="textarea" name="zustand_text_en" rows="3" maxlength="1000">{p.conditionNoteEn}</textarea></label>
						</div>
						<label class="check">
							<input type="checkbox" name="differenz" checked={p.marginScheme} />
							<span>Differenzbesteuerung (§ 24 UStG) – nur wenn von Privat oder differenzbesteuert angekauft. Die USt. wird dann nicht ausgewiesen; Einkaufspreis für die Buchhaltung festhalten.</span>
						</label>
					{:else}
						<input type="hidden" name="zustand_text" value="" />
					{/if}
				</section>

				<!-- Technische Daten -->
				<section class="card card-pad stack">
					<div class="sec-head">
						<div>
							<h2 class="card-title">Technische Daten</h2>
							<p class="card-sub">Erscheinen als Tabelle auf der Produktseite und werden bei der Suche gefunden.</p>
						</div>
						<select class="select sm-select" bind:value={specSet} aria-label="Vorschläge für">
							<option value="teil">Vorschläge: Teile</option>
							<option value="reifen">Vorschläge: Reifen</option>
							<option value="fahrzeug">Vorschläge: Fahrzeuge</option>
						</select>
					</div>
					{#each specs as sp, si (si)}
						<div class="spec-row">
							<input class="input" bind:value={sp.label} placeholder="Bezeichnung" aria-label="Bezeichnung" />
							<input class="input" bind:value={sp.value} placeholder="Wert" aria-label="Wert" />
							<input class="input" bind:value={sp.valueEn} placeholder="Wert englisch (optional)" aria-label="Wert englisch" />
							<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Zeile entfernen" onclick={() => (specs = specs.filter((_, k) => k !== si))}><Trash size={16} /></button>
						</div>
					{/each}
					<div class="row">
						{#each SPEC_SUGGESTIONS[specSet].filter(([de]) => !specs.some((s) => s.label === de)) as [de, en] (de)}
							<button type="button" class="btn btn-sm btn-ghost" onclick={() => addSpec(de, en)}><Plus size={14} /> {de}</button>
						{/each}
						<button type="button" class="btn btn-sm" onclick={() => addSpec()}><Plus size={15} /> Eigene Zeile</button>
					</div>
				</section>
			{/if}

			<!-- Varianten -->
			<section class="card card-pad stack">
				<div>
					<h2 class="card-title">{kind === 'gutschein' ? 'Gutscheinwerte' : 'Varianten & Preise'}</h2>
					<p class="card-sub">
						{kind === 'gutschein'
							? 'Lege eine Option „Wert“ mit z. B. 25 €, 50 €, 100 € an und trage den Preis = Wert ein.'
							: 'Preise inkl. USt. Ohne Optionen gibt es genau eine Variante.'}
					</p>
				</div>
				{#each options as opt, oi (oi)}
					<div class="option">
						<div class="grid-2">
							<label class="field"><span class="label">Option</span><input class="input" bind:value={opt.name} placeholder="z. B. Größe" onchange={syncRows} /></label>
							<label class="field"><span class="label">Englisch</span><input class="input" bind:value={opt.nameEn} placeholder="e.g. Size" /></label>
						</div>
						<div class="values">
							{#each opt.values as v, vi (vi)}
								<div class="value-row">
									<input class="input" bind:value={v.de} placeholder="Wert" aria-label="Wert" onchange={syncRows} />
									<input class="input" bind:value={v.en} placeholder="English" aria-label="Wert englisch" />
									<button type="button" class="btn btn-ghost btn-icon" aria-label="Wert entfernen" onclick={() => ((opt.values = opt.values.filter((_, k) => k !== vi)), syncRows())}><Trash size={16} /></button>
								</div>
							{/each}
						</div>
						<div class="row">
							<button type="button" class="btn btn-sm" onclick={() => (opt.values = [...opt.values, { de: '', en: '' }])}><Plus size={15} /> Wert</button>
							<button type="button" class="btn btn-sm btn-ghost" onclick={() => ((options = options.filter((_, k) => k !== oi)), syncRows())}>Option entfernen</button>
						</div>
					</div>
				{/each}
				{#if options.length < 3}<div><button type="button" class="btn btn-sm" onclick={addOption}><Plus size={15} /> Option hinzufügen (Größe, Farbe …)</button></div>{/if}

				<div class="table-wrap">
					<table class="table vtable">
						<thead>
							<tr>
								{#if options.length}<th>Variante</th>{/if}
								<th>Preis €</th>
								<th>Statt €</th>
								<th>Art.-Nr.</th>
								{#if stockMode === 'bestand'}<th>Bestand</th>{/if}
								<th>Aktiv</th>
							</tr>
						</thead>
						<tbody>
							{#each rows as r (JSON.stringify(r.values))}
								<tr>
									{#if options.length}<td class="vname">{r.values.join(' / ')}</td>{/if}
									<td><input class="input sm" bind:value={r.price} inputmode="decimal" required={kind !== 'fahrzeug'} placeholder={kind === 'fahrzeug' ? 'auf Anfrage' : ''} aria-label="Preis" /></td>
									<td><input class="input sm" bind:value={r.compareAt} inputmode="decimal" aria-label="Vergleichspreis" /></td>
									<td><input class="input sm" bind:value={r.sku} aria-label="Artikelnummer" /></td>
									{#if stockMode === 'bestand'}<td><input class="input sm" type="number" bind:value={r.stock} aria-label="Bestand" /></td>{/if}
									<td><input type="checkbox" bind:checked={r.active} aria-label="Aktiv" /></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<p class="hint">„Statt“ wird durchgestrichen angezeigt.{kind === 'fahrzeug' ? ' Fahrzeug ohne Preis = „Preis auf Anfrage“.' : ''}</p>
			</section>

			{#if kind === 'standard'}
				<!-- Zusatzangaben beim Bestellen -->
				<section class="card card-pad stack">
					<div class="sec-head">
						<div>
							<h2 class="card-title">Angaben beim Bestellen</h2>
							<p class="card-sub">Optional: Felder, die der Kunde beim Bestellen ausfüllt, z. B. sein Fahrzeug bei Teilen mit unterschiedlicher Passform. Aufpreise kommen dazu, wenn das Feld ausgefüllt ist.</p>
						</div>
						<button type="button" class="btn btn-sm" onclick={usePreset}>Vorlage „Fahrzeugangaben“ laden</button>
					</div>
					{#each fields as fld, i (fld.key + i)}
						<div class="fieldcard">
							<div class="fc-head">
								<button type="button" class="fc-title" onclick={() => (openField = openField === i ? null : i)} aria-expanded={openField === i}>
									<strong>{fld.label || 'Neues Feld'}</strong>
									<span class="muted small">{FIELD_TYPE_LABELS[fld.type]}{fld.required ? ' · Pflicht' : ''}{fld.surcharge ? ` · + ${surchargeText(fld.surcharge)} €` : ''}</span>
								</button>
								<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Nach oben" onclick={() => moveField(i, -1)}><ChevronUp size={16} /></button>
								<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Nach unten" onclick={() => moveField(i, 1)}><ChevronDown size={16} /></button>
								<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Feld entfernen" onclick={() => (fields = fields.filter((_, k) => k !== i))}><Trash size={16} /></button>
							</div>
							{#if openField === i}
								<div class="stack fc-body">
									<div class="grid-2">
										<label class="field">
											<span class="label">Art</span>
											<select class="select" bind:value={fld.type}>
												{#each Object.entries(FIELD_TYPE_LABELS) as [k, l] (k)}<option value={k as FieldType}>{l}</option>{/each}
											</select>
										</label>
										<label class="field"><span class="label">Aufpreis €</span><input class="input" inputmode="decimal" value={surchargeText(fld.surcharge)} onchange={(e) => (fld.surcharge = parseEuro(e.currentTarget.value) ?? 0)} /></label>
									</div>
									<div class="grid-2">
										<label class="field"><span class="label">Bezeichnung</span><input class="input" bind:value={fld.label} /></label>
										<label class="field"><span class="label">Englisch</span><input class="input" bind:value={fld.labelEn} /></label>
									</div>
									<div class="grid-2">
										<label class="field"><span class="label">Hilfetext</span><input class="input" bind:value={fld.help} /></label>
										<label class="field"><span class="label">Englisch</span><input class="input" bind:value={fld.helpEn} /></label>
									</div>
									{#if fld.type === 'text' || fld.type === 'textarea' || fld.type === 'number'}
										<div class="grid-2">
											<label class="field"><span class="label">Beispiel im Feld</span><input class="input" bind:value={fld.placeholder} /></label>
											<label class="field"><span class="label">Englisch</span><input class="input" bind:value={fld.placeholderEn} /></label>
										</div>
										<label class="field short"><span class="label">Max. Zeichen</span><input class="input" type="number" min="1" max="4000" bind:value={fld.maxLength} /></label>
									{/if}
									{#if fld.type === 'select'}
										<label class="field">
											<span class="label">Auswahl – eine je Zeile, Englisch nach „|“</span>
											<textarea
												class="textarea"
												rows="4"
												value={fld.choices.map((c) => (c.en ? `${c.de} | ${c.en}` : c.de)).join('\n')}
												onchange={(e) =>
													(fld.choices = e.currentTarget.value
														.split('\n')
														.map((l) => l.split('|').map((x) => x.trim()))
														.filter(([de]) => de)
														.map(([de, en]) => ({ de, en: en ?? '' })))}
											></textarea>
										</label>
									{/if}
									{#if fld.type === 'datei'}
										<label class="field short"><span class="label">Max. Dateien</span><input class="input" type="number" min="1" max="10" bind:value={fld.maxFiles} /></label>
									{/if}
									<label class="check"><input type="checkbox" bind:checked={fld.required} /><span>Pflichtfeld</span></label>
								</div>
							{/if}
						</div>
					{/each}
					<div><button type="button" class="btn btn-sm" onclick={() => ((fields = [...fields, emptyField()]), (openField = fields.length - 1))}><Plus size={15} /> Feld hinzufügen</button></div>
				</section>
			{/if}

			{#if kind === 'bundle'}
				<section class="card card-pad stack">
					<div>
						<h2 class="card-title">Im Bundle enthalten</h2>
						<p class="card-sub">Haben Bestandteile mehrere Varianten (z. B. Größe), wählt der Kunde beim Bestellen. Lager wird bei den Bestandteilen abgebucht.</p>
					</div>
					{#each bundle as b, i (i)}
						<div class="bundle-row">
							<select class="select grow" bind:value={b.productId} aria-label="Produkt">
								<option value={0}>Produkt wählen …</option>
								{#each data.others as o (o.id)}<option value={o.id}>{o.title}</option>{/each}
							</select>
							<input class="input sm" type="number" min="1" bind:value={b.quantity} aria-label="Menge" />
							<button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label="Entfernen" onclick={() => (bundle = bundle.filter((_, k) => k !== i))}><Trash size={16} /></button>
						</div>
					{/each}
					<div><button type="button" class="btn btn-sm" onclick={() => (bundle = [...bundle, { productId: 0, quantity: 1 }])}><Plus size={15} /> Bestandteil</button></div>
				</section>
			{/if}
		</div>

		<aside class="side">
			<section class="card card-pad stack">
				<label class="field">
					<span class="label">Status</span>
					<select class="select" name="status" value={p.status}>
						<option value="entwurf">Entwurf – nicht sichtbar</option>
						<option value="aktiv">Aktiv – im Shop</option>
						<option value="archiviert">Archiviert</option>
					</select>
				</label>
				<label class="field">
					<span class="label">Art</span>
					<select class="select" name="art" bind:value={kind}>
						<option value="standard">Teil / Artikel (kaufbar)</option>
						<option value="fahrzeug">Fahrzeug (nur Anfrage)</option>
						<option value="gutschein">Gutschein</option>
						<option value="bundle">Set / Bundle</option>
					</select>
				</label>
				{#if kind === 'fahrzeug'}<p class="hint">Fahrzeuge erscheinen mit Anfrageformular statt Warenkorb. Kategorie „Fahrzeuge“ ankreuzen.</p>{/if}
				<label class="check"><input type="checkbox" name="hervorgehoben" checked={p.featured} /><span>Auf der Startseite zeigen</span></label>
				<label class="field short"><span class="label">Sortierung</span><input class="input" type="number" name="sortierung" value={p.sortOrder} /></label>
				<label class="field"><span class="label">Adresse <span class="opt">(leer = aus Titel)</span></span><input class="input" name="slug" value={p.slug} /></label>
			</section>

			<section class="card card-pad stack">
				<h2 class="card-title">Kategorien</h2>
				<div class="cats">
					{#each topCats as c (c.id)}
						<label class="check"><input type="checkbox" name="kategorien" value={c.id} checked={data.categoryIds.includes(c.id)} /><span>{c.name}</span></label>
						{#each childCats(c.id) as ch (ch.id)}
							<label class="check sub"><input type="checkbox" name="kategorien" value={ch.id} checked={data.categoryIds.includes(ch.id)} /><span>{ch.name}</span></label>
						{/each}
					{/each}
				</div>
			</section>

			{#if kind !== 'gutschein' && kind !== 'fahrzeug'}
				<section class="card card-pad stack">
					<h2 class="card-title">Lager & Versand</h2>
					<div class="segmented">
						<label><input type="radio" name="lager" value="auf_bestellung" bind:group={stockMode} /><span>Auf Bestellung</span></label>
						<label><input type="radio" name="lager" value="bestand" bind:group={stockMode} /><span>Lagerbestand</span></label>
					</div>
					{#if stockMode === 'bestand'}<label class="check"><input type="checkbox" name="nachlieferung" checked={p.backorder} /><span>Auch bei Bestand 0 verkaufen (Nachlieferung)</span></label>{/if}
					<label class="field"><span class="label">Vorbestellung bis <span class="opt">(Erscheinungstag)</span></span><input class="input" type="date" name="erscheint" value={p.releaseDate ?? ''} /></label>
					<label class="check"><input type="checkbox" name="versand" checked={p.requiresShipping} /><span>Wird versendet (aus = nur Abholung möglich)</span></label>
				</section>
			{/if}
		</aside>
	</div>

	<SaveBar {busy} deleteConfirm={data.isNew ? '' : data.hasOrders ? 'Das Produkt wurde schon bestellt und wird deshalb archiviert statt gelöscht. Fortfahren?' : 'Produkt endgültig löschen?'} deleteLabel={data.hasOrders ? 'Archivieren' : 'Löschen'} />
</form>

<style>
	.head-actions {
		display: flex;
		gap: 0.5rem;
	}
	.cols {
		display: grid;
		gap: 1.25rem;
	}
	@media (min-width: 1200px) {
		.cols {
			grid-template-columns: minmax(0, 1fr) 21rem;
			align-items: start;
		}
		.side {
			position: sticky;
			top: 1.5rem;
		}
	}
	.main,
	.side {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
	}
	.hidden {
		display: none;
	}
	.lang {
		display: flex;
		gap: 0.25rem;
		padding: 0.2rem;
		border-radius: 9px;
		background: var(--c-surface-2);
		align-self: flex-start;
	}
	.lang button {
		padding: 0.35rem 0.9rem;
		border-radius: 7px;
		font-weight: 650;
		color: var(--c-ink-3);
	}
	.lang button[aria-selected='true'] {
		background: var(--c-surface);
		color: var(--c-ink);
		box-shadow: var(--shadow-1);
	}
	.option {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.9rem;
		border: 1px solid var(--c-line);
		border-radius: 10px;
	}
	.values {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.value-row {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 0.4rem;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	.vtable td,
	.vtable th {
		padding: 0.35rem 0.4rem;
	}
	.vname {
		font-weight: 650;
		white-space: nowrap;
	}
	.input.sm {
		min-width: 5.5rem;
		height: 2.25rem;
		padding: 0 0.5rem;
	}
	.sec-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: flex-start;
	}
	.fieldcard {
		border: 1px solid var(--c-line);
		border-radius: 10px;
	}
	.fc-head {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.35rem 0.5rem 0.35rem 0.85rem;
	}
	.fc-title {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		text-align: left;
		padding: 0.3rem 0;
	}
	.fc-body {
		padding: 0.25rem 0.85rem 0.9rem;
		border-top: 1px solid var(--c-line);
		padding-top: 0.85rem;
	}
	.short {
		max-width: 12rem;
	}
	.grid-title {
		display: grid;
		gap: 0.75rem;
	}
	@media (min-width: 720px) {
		.grid-title {
			grid-template-columns: 14rem 1fr;
		}
	}
	.spec-row {
		display: grid;
		grid-template-columns: minmax(8rem, 1fr) minmax(8rem, 1.2fr) minmax(8rem, 1fr) auto;
		gap: 0.4rem;
	}
	@media (max-width: 719px) {
		.spec-row {
			grid-template-columns: 1fr 1fr auto;
		}
		.spec-row input:nth-child(3) {
			display: none;
		}
	}
	.sm-select {
		width: auto;
		min-height: 2.25rem;
	}
	.bundle-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--c-line);
	}
	.grow {
		flex: 1;
		min-width: 0;
	}
	.cats {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.cats .sub {
		padding-left: 1.4rem;
	}
</style>
