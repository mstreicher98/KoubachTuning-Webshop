import type { FieldType, PersonalizationField } from '$lib/shop-types';

/** Leeres Personalisierungs-Feld für den Produkt-Editor */
export function emptyField(type: FieldType = 'text', key = ''): PersonalizationField {
	return {
		key: key || `feld_${Math.random().toString(36).slice(2, 7)}`,
		type,
		label: '',
		labelEn: '',
		help: '',
		helpEn: '',
		placeholder: '',
		placeholderEn: '',
		required: false,
		choices: [],
		maxLength: type === 'textarea' ? 2000 : 120,
		surcharge: 0,
		maxFiles: type === 'datei' ? 3 : 1
	};
}

const f = (type: FieldType, key: string, over: Partial<PersonalizationField>): PersonalizationField => ({ ...emptyField(type, key), ...over });

/**
 * Vorlage für Teile, bei denen die Passform vom Fahrzeug abhängt.
 * Im Editor lassen sich die Felder danach beliebig anpassen.
 */
export const FIELD_PRESETS: Record<'fahrzeug', PersonalizationField[]> = {
	fahrzeug: [
		f('text', 'fahrzeug', {
			label: 'Dein Fahrzeug (Marke und Modell)',
			labelEn: 'Your vehicle (make and model)',
			placeholder: 'z. B. Derbi Senda DRD Pro 50',
			placeholderEn: 'e.g. Derbi Senda DRD Pro 50',
			required: true,
			maxLength: 80
		}),
		f('text', 'baujahr', { label: 'Baujahr', labelEn: 'Year', placeholder: 'z. B. 2012', placeholderEn: 'e.g. 2012', maxLength: 4 }),
		f('text', 'motor', { label: 'Motor (falls bekannt)', labelEn: 'Engine (if known)', placeholder: 'z. B. Derbi D50B, Minarelli AM6', placeholderEn: 'e.g. Derbi D50B, Minarelli AM6', maxLength: 60 }),
		f('textarea', 'anmerkung', { label: 'Anmerkungen', labelEn: 'Notes', placeholder: 'Bereits verbaute Teile, Wünsche …', placeholderEn: 'Parts already fitted, wishes …', maxLength: 1000 })
	]
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
	text: 'Textzeile',
	textarea: 'Textfeld (mehrzeilig)',
	number: 'Zahl',
	select: 'Auswahl',
	datei: 'Datei-Upload'
};
