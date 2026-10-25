import type { pages } from './schema';

/**
 * Vorlagen für die Info- und Rechtsseiten von Koubach Tuning. Platzhalter in {{…}} werden beim
 * Anzeigen durch die Angaben aus den Einstellungen ersetzt (siehe src/lib/server/textpage.ts),
 * damit Adresse, UID usw. nur an einer Stelle gepflegt werden. Fehlende Angaben erscheinen als
 * gut sichtbares [fehlt: …].
 *
 * Grundlage: österreichisches Recht für Online-Händler (ECG, FAGG, KSchG, VGG, ABGB, UGB, MedienG,
 * DSGVO/DSG, KFG), Stand Oktober 2026. Die Texte sind sorgfältig erstellt, ersetzen aber keine
 * Rechtsberatung – vor dem Livegang von einer fachkundigen Stelle (z. B. WKO-Rechtsservice) prüfen
 * lassen, besonders nach Änderungen an Zahlungsarten, Dienstleistern oder dem Sortiment.
 */

type NewPage = typeof pages.$inferInsert;

const EN_NOTE = '<p><em>This English version is provided for convenience. The German version is legally binding.</em></p>';

export const SEED_PAGES: NewPage[] = [
	/* ================================================================ Bestellung */
	{
		slug: 'bestellvorgang',
		group: 'bestellung',
		sortOrder: 0,
		title: 'So bestellst du',
		titleEn: 'How to order',
		contentHtml: `<h2>In vier Schritten</h2>
<ol>
<li><strong>Teil finden:</strong> über die Kategorien, die Suche oder die Filter nach Hersteller und Zustand. Bei jedem Teil stehen die technischen Daten und wofür es passt.</li>
<li><strong>In den Warenkorb:</strong> Ausführung und Menge wählen. Im Warenkorb kannst du Rabattcodes und Gutscheine einlösen.</li>
<li><strong>Kasse:</strong> Adresse eingeben, Versand oder Abholung in Hollabrunn wählen und die Zahlungsart aussuchen. Ein Kundenkonto brauchst du nicht.</li>
<li><strong>Bestätigung:</strong> Du bekommst eine E-Mail mit einem Link zu deiner Bestellung. Dort siehst du den Stand, die Rechnung und später die Sendungsnummer.</li>
</ol>
<h2>Passt das auf mein Fahrzeug?</h2>
<p>Wenn du dir nicht sicher bist, frag uns vor dem Kauf – auf jeder Produktseite gibt es dafür ein kurzes Anfrageformular. Am besten gibst du Marke, Modell, Baujahr und den Motor an.</p>
<h2>Fahrzeuge</h2>
<p>Mopeds und Motorräder verkaufen wir nicht online. Auf der Fahrzeugseite schickst du uns eine Anfrage, wir melden uns mit allen Details und vereinbaren einen Termin zur Besichtigung. Der Kauf erfolgt vor Ort mit einem eigenen Kaufvertrag.</p>
<h2>Kundenkonto</h2>
<p>Mit einem Konto siehst du alle Bestellungen und Rechnungen an einem Ort und musst deine Adresse nicht jedes Mal eingeben. Bestellungen, die du vorher ohne Konto mit derselben E-Mail-Adresse aufgegeben hast, erscheinen nach der Bestätigung deiner E-Mail-Adresse automatisch in deinem Konto.</p>`,
		contentHtmlEn: `<h2>Four steps</h2>
<ol>
<li><strong>Find your part:</strong> via the categories, the search or the brand and condition filters. Every part lists its technical data and what it fits.</li>
<li><strong>Add to cart:</strong> choose the version and quantity. Discount codes and gift cards can be redeemed in the cart.</li>
<li><strong>Checkout:</strong> enter your address, choose shipping or pickup in Hollabrunn and a payment method. No account needed.</li>
<li><strong>Confirmation:</strong> you'll get an email with a link to your order showing its status, the invoice and later the tracking number.</li>
</ol>
<h2>Will it fit my vehicle?</h2>
<p>If you're not sure, ask us before buying – every product page has a short inquiry form. Please include make, model, year and engine.</p>
<h2>Vehicles</h2>
<p>We don't sell mopeds or motorcycles online. Send us an inquiry from the vehicle page and we'll reply with all details and an appointment to view it. The purchase takes place on site with a separate sales contract.</p>`
	},
	{
		slug: 'versand',
		group: 'bestellung',
		sortOrder: 1,
		title: 'Versand & Abholung',
		titleEn: 'Shipping & pickup',
		contentHtml: `<h2>Versandkosten</h2>
<p>Wir liefern in folgende Länder. Die Versandkosten enthalten die Umsatzsteuer und werden vor dem Abschluss der Bestellung angezeigt – egal wie viele Teile du bestellst.</p>
{{versandtabelle}}
<h2>Lieferzeit</h2>
<p>Lagernde Teile verschicken wir in der Regel innerhalb von zwei Werktagen nach Zahlungseingang, bei Vorkasse also nach Eingang der Überweisung. Die Zustellung dauert innerhalb Österreichs meist ein bis zwei Werktage, nach Deutschland zwei bis vier Werktage. Steht bei einem Produkt eine eigene Lieferzeit, gilt diese.</p>
<p>Größere Bestellungen, etwa Reifen oder Auspuffanlagen, können in mehreren Paketen ankommen. Dafür verrechnen wir nichts extra.</p>
<h2>Sendungsverfolgung</h2>
<p>Sobald dein Paket unterwegs ist, bekommst du eine E-Mail mit der Sendungsnummer. Den Stand siehst du auch unter <a href="/sendungsverfolgung">Sendung verfolgen</a> und in deinem Kundenkonto.</p>
<h2>Abholung in Hollabrunn</h2>
<p>{{abholung}}</p>
<p>Die Abholung ist kostenlos. Wähle an der Kasse „Abholung“ – wir melden uns, sobald deine Bestellung bereitliegt. Bei Abholung kannst du auch bar bezahlen.</p>`,
		contentHtmlEn: `<h2>Shipping costs</h2>
<p>We ship to the following countries. Shipping costs include VAT and are shown before you place your order – no matter how many parts you order.</p>
{{versandtabelle}}
<h2>Delivery time</h2>
<p>Parts in stock usually ship within two working days after payment (for bank transfer: after the money has arrived). Delivery takes one to two working days within Austria and two to four to Germany. If a product shows its own delivery time, that applies.</p>
<p>Larger orders such as tyres or exhaust systems may arrive in several parcels at no extra cost.</p>
<h2>Tracking</h2>
<p>As soon as your parcel is on its way, you'll get an email with the tracking number. You can also check it under <a href="/en/tracking">Track parcel</a> and in your account.</p>
<h2>Pickup in Hollabrunn</h2>
<p>{{abholung}}</p>
<p>Pickup is free. Choose "Pickup" at checkout – we'll let you know when your order is ready. You can also pay in cash on pickup.</p>`
	},
	{
		slug: 'zahlung',
		group: 'bestellung',
		sortOrder: 2,
		title: 'Zahlung',
		titleEn: 'Payment',
		contentHtml: `<h2>Zahlungsarten</h2>
<p>Derzeit kannst du so bezahlen:</p>
{{zahlungsarten}}
<h2>Karte, Apple Pay, Google Pay, EPS, Klarna</h2>
<p>Die Zahlung läuft über unseren Zahlungsdienstleister Stripe. Deine Kartendaten gibst du direkt bei Stripe ein, wir sehen sie nicht. Welche Möglichkeiten angezeigt werden, hängt von deinem Gerät und Land ab.</p>
<h2>PayPal</h2>
<p>Du wirst zu PayPal weitergeleitet und kommst nach der Zahlung zurück in den Shop.</p>
<h2>Vorkasse per Überweisung</h2>
<p>Die Bankverbindung steht in der Bestellbestätigung. Bitte überweise innerhalb von {{ueberweisungstage}} Tagen und gib die Bestellnummer als Verwendungszweck an. Wir verschicken, sobald das Geld da ist. Kommt keine Zahlung, stornieren wir die Bestellung und geben die Ware wieder frei.</p>
<h2>Bar bei Abholung</h2>
<p>Bei Abholung in Hollabrunn kannst du vor Ort bar bezahlen. Du bekommst einen Beleg.</p>
<h2>Rechnung</h2>
<p>Die Rechnung bekommst du nach Zahlungseingang. Du findest sie jederzeit als PDF bei deiner Bestellung bzw. in deinem Kundenkonto. {{steuerhinweis}}</p>`,
		contentHtmlEn: `<h2>Payment methods</h2>
<p>You can currently pay as follows:</p>
{{zahlungsarten}}
<h2>Card, Apple Pay, Google Pay, EPS, Klarna</h2>
<p>Payments are processed by our payment provider Stripe. You enter your card details directly at Stripe; we never see them.</p>
<h2>PayPal</h2>
<p>You'll be redirected to PayPal and return to the shop after paying.</p>
<h2>Bank transfer in advance</h2>
<p>The bank details are in the order confirmation. Please transfer within {{ueberweisungstage}} days using the order number as reference. We ship once the payment has arrived.</p>
<h2>Cash on pickup</h2>
<p>When collecting in Hollabrunn you can pay in cash and get a receipt.</p>
<h2>Invoice</h2>
<p>You'll receive the invoice after payment; it is always available as a PDF with your order. {{steuerhinweis}}</p>`
	},

	/* ================================================================ Hilfe */
	{
		slug: 'ruecksendung',
		group: 'hilfe',
		sortOrder: 0,
		title: 'Rücksendung & Gewährleistung',
		titleEn: 'Returns & warranty',
		contentHtml: `<h2>14 Tage Rücktrittsrecht</h2>
<p>Als Verbraucher kannst du innerhalb von 14 Tagen ab Erhalt der Ware ohne Angabe von Gründen vom Kauf zurücktreten. Wie das geht, steht in der <a href="/info/widerruf">Widerrufsbelehrung</a>. Am einfachsten schreibst du uns eine E-Mail an {{email}} mit deiner Bestellnummer.</p>
<h2>Bitte vor dem Einbau prüfen</h2>
<p>Du darfst die Ware so prüfen, wie du es auch im Geschäft tun würdest. Wurde ein Teil bereits eingebaut, gefahren oder sonst über eine Prüfung hinaus benutzt, verliert es meist deutlich an Wert. Diesen Wertverlust müssen wir dir bei einem Rücktritt in Rechnung stellen. Vergleiche deshalb vor dem Einbau Maße, Anschlüsse und Passform – bei Unsicherheit hilft eine kurze Anfrage.</p>
<h2>Rücksendung</h2>
<ul>
<li>Bitte gut verpacken, möglichst in der Originalverpackung und mit allem Zubehör.</li>
<li>Die Kosten der Rücksendung trägst du.</li>
<li>Den Kaufpreis und die ursprünglichen Versandkosten (Standardversand) erstatten wir innerhalb von 14 Tagen nach deinem Rücktritt auf dem ursprünglichen Zahlungsweg, sobald die Ware bei uns ist oder du die Rücksendung nachgewiesen hast.</li>
</ul>
<h2>Gewährleistung</h2>
<p>Für alle Waren gilt die gesetzliche Gewährleistung von zwei Jahren ab Übergabe – auch für Gebrauchtteile. Zeigt sich ein Mangel, melde dich mit Bestellnummer und Fotos bei {{email}}. Wir reparieren oder tauschen; ist das nicht möglich, bekommst du Preisminderung oder dein Geld zurück.</p>
<p>Bei Gebrauchtteilen beschreiben wir den Zustand und sichtbare Gebrauchsspuren auf der Produktseite. Beschriebene Gebrauchsspuren und üblicher Verschleiß sind kein Mangel.</p>
<p>Keine Mängel sind außerdem Schäden durch unsachgemäßen Einbau, falsche Abstimmung (z. B. Bedüsung, Zündzeitpunkt), Überlastung im Renneinsatz oder normale Abnutzung von Verschleißteilen wie Reifen, Kupplungsbelägen oder Bremsbelägen.</p>`,
		contentHtmlEn: `${EN_NOTE}
<h2>14-day right of withdrawal</h2>
<p>As a consumer you may withdraw from the purchase within 14 days of receiving the goods without giving reasons. See the <a href="/en/info/widerruf">withdrawal information</a>; the easiest way is an email to {{email}} with your order number.</p>
<h2>Please check before installing</h2>
<p>You may inspect the goods as you would in a shop. If a part has already been installed, ridden or otherwise used beyond inspection, it usually loses considerable value, which we have to charge in case of withdrawal.</p>
<h2>Returns</h2>
<p>Please pack well. You bear the cost of returning the goods. We refund the purchase price and the original standard shipping within 14 days of your withdrawal via the original payment method, once we have received the goods or proof of return.</p>
<h2>Warranty</h2>
<p>The statutory warranty of two years from delivery applies to all goods, including used parts. Used parts show the described signs of use; these and normal wear are not defects. Damage from improper installation, wrong tuning, racing overload or normal wear of wear parts is not a defect.</p>`
	},
	{
		slug: 'faq',
		group: 'hilfe',
		sortOrder: 1,
		title: 'Häufige Fragen',
		titleEn: 'FAQ',
		contentHtml: `<h2>Dürfen Tuningteile auf der Straße gefahren werden?</h2>
<p>Das hängt vom Teil ab. Bei jedem Teil steht unter „Technische Daten“, ob es eine Straßenzulassung (z. B. EG-/ECE-Genehmigung) hat. Teile ohne Zulassung sind für den Rennsport auf abgesperrten Strecken gedacht. Änderungen an Hubraum, Leistung, Höchstgeschwindigkeit oder Auspuff können die Typisierung deines Fahrzeugs berühren und müssen gegebenenfalls bei der Landesprüfstelle genehmigt werden (§ 33 KFG). Ein nicht genehmigter Umbau kann auch den Versicherungsschutz gefährden. Im Zweifel frag uns vorher.</p>
<h2>Ihr habt mein Teil nicht im Shop.</h2>
<p>Vieles bestellen wir für dich. Schreib uns über <a href="/kontakt">Anfrage</a>, was du suchst und für welches Fahrzeug.</p>
<h2>Wie neu sind Gebrauchtteile?</h2>
<p>Jedes Gebrauchtteil ist ein Einzelstück. Zustand, Laufleistung soweit bekannt und Gebrauchsspuren beschreiben wir auf der Produktseite, die Fotos zeigen das tatsächliche Teil.</p>
<h2>Kann ich ein Fahrzeug probefahren?</h2>
<p>Ja, nach Terminvereinbarung in Hollabrunn. Für die Probefahrt brauchst du einen passenden Führerschein und einen Ausweis.</p>
<h2>Baut ihr die Teile auch ein?</h2>
<p>Frag uns einfach – wir sagen dir, ob und wann das möglich ist.</p>
<h2>Wo ist meine Bestellung?</h2>
<p>Unter <a href="/sendungsverfolgung">Sendung verfolgen</a> siehst du den Stand mit deiner Bestellnummer und E-Mail-Adresse.</p>`,
		contentHtmlEn: `<h2>Are tuning parts road legal?</h2>
<p>It depends on the part. The technical data of each part state whether it has road approval (e.g. EC/ECE approval). Parts without approval are intended for racing on closed circuits. Changes to displacement, power, top speed or exhaust may affect your vehicle's type approval and may need approval by the regional testing authority (§ 33 KFG). Unapproved modifications may also affect your insurance cover. If in doubt, ask us first.</p>
<h2>You don't have my part.</h2>
<p>We can order a lot for you. Tell us via the <a href="/en/contact">request form</a> what you need and for which vehicle.</p>
<h2>How good are used parts?</h2>
<p>Every used part is a single item. Condition, mileage where known and signs of use are described on the product page; the photos show the actual part.</p>
<h2>Can I test ride a vehicle?</h2>
<p>Yes, by appointment in Hollabrunn, with a suitable driving licence and ID.</p>
<h2>Where is my order?</h2>
<p>Check <a href="/en/tracking">Track parcel</a> with your order number and email address.</p>`
	},

	/* ================================================================ Rechtliches */
	{
		slug: 'agb',
		group: 'rechtliches',
		sortOrder: 0,
		title: 'Allgemeine Geschäftsbedingungen',
		titleEn: 'Terms and conditions',
		contentHtml: `<h2>1. Geltungsbereich</h2>
<p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, die über den Onlineshop von {{firma}}, {{strasse}}, {{plz}} {{ort}} ({{marke}}, im Folgenden „wir“) geschlossen werden. Abweichende Bedingungen des Kunden gelten nur, wenn wir ihnen ausdrücklich schriftlich zustimmen.</p>
<p>Verbraucher ist, für wen das Geschäft nicht zum Betrieb seines Unternehmens gehört (§ 1 KSchG). Bestimmungen, die nur für Verbraucher oder nur für Unternehmer gelten, sind als solche gekennzeichnet. Zwingende Rechte von Verbrauchern werden durch diese AGB nicht eingeschränkt.</p>
<h2>2. Angebot und Vertragsabschluss</h2>
<p>Die Darstellung der Waren im Shop ist kein verbindliches Angebot, sondern eine Einladung zur Bestellung. Mit dem Klick auf „Zahlungspflichtig bestellen“ gibst du ein verbindliches Angebot zum Kauf der Waren im Warenkorb ab. Vor dem Absenden kannst du alle Angaben prüfen und mit den Schaltflächen des Shops berichtigen.</p>
<p>Wir bestätigen den Eingang deiner Bestellung unverzüglich per E-Mail. Mit dieser Bestellbestätigung kommt der Vertrag zustande. Die Vertragssprachen sind Deutsch und Englisch; maßgeblich ist die deutsche Fassung. Wir speichern den Vertragstext. Deine Bestelldaten und diese AGB kannst du jederzeit über den Link in der Bestätigungsmail bzw. in deinem Kundenkonto abrufen.</p>
<p>Ist eine bestellte Ware unerwartet nicht lieferbar (etwa weil ein Einzelstück zeitgleich vor Ort verkauft wurde), informieren wir dich unverzüglich und erstatten bereits geleistete Zahlungen sofort.</p>
<h2>3. Fahrzeuge</h2>
<p>Fahrzeuge (Mopeds, Motorräder) werden im Shop nur vorgestellt und können nicht online gekauft werden. Die Fahrzeugseiten sind kein Angebot. Über das Anfrageformular kannst du unverbindlich Informationen und einen Besichtigungstermin anfragen. Ein Kauf kommt erst vor Ort mit einem gesonderten schriftlichen Kaufvertrag zustande.</p>
<h2>4. Preise</h2>
<p>Alle Preise sind Endpreise in Euro. {{steuerhinweis}} Gebrauchtwaren, die als „differenzbesteuert“ gekennzeichnet sind, unterliegen der Differenzbesteuerung nach § 24 UStG; die Umsatzsteuer wird bei diesen Artikeln nicht gesondert ausgewiesen. Versandkosten kommen hinzu und werden vor Abschluss der Bestellung angezeigt.</p>
<p>Für Unternehmer mit gültiger UID-Nummer in einem anderen EU-Mitgliedstaat liefern wir – außer bei differenzbesteuerten Waren – netto (Steuerschuldnerschaft des Leistungsempfängers). Lieferungen in Länder außerhalb der EU erfolgen netto; allfällige Einfuhrabgaben trägt der Empfänger.</p>
<h2>5. Lieferung und Abholung</h2>
<p>Wir liefern in die im Shop angeführten Länder. Lagernde Waren versenden wir in der Regel innerhalb von zwei Werktagen nach Zahlungseingang; weicht die Lieferzeit ab, steht sie beim Produkt. Ist keine Frist vereinbart, liefern wir spätestens innerhalb von 30 Tagen nach Vertragsabschluss.</p>
<p>Bei Verbrauchern geht die Gefahr erst mit der Übergabe der Ware an dich oder an einen von dir bestimmten Dritten über. Bei Unternehmern geht die Gefahr mit der Übergabe an das Transportunternehmen über.</p>
<p>Bei Abholung legen wir die Ware am Standort {{strasse}}, {{plz}} {{ort}} bereit und informieren dich per E-Mail. Bitte hole sie innerhalb von 14 Tagen ab.</p>
<h2>6. Zahlung</h2>
<p>Die verfügbaren Zahlungsarten werden an der Kasse angezeigt. Bei Vorkasse ist der Betrag innerhalb von {{ueberweisungstage}} Tagen auf das in der Bestellbestätigung angegebene Konto zu überweisen; geht die Zahlung nicht ein, können wir die Bestellung nach einer Erinnerung stornieren. Online-Zahlungen, die nicht abgeschlossen werden, führen nach Ablauf der angezeigten Frist zur automatischen Stornierung. Barzahlung ist nur bei Abholung möglich.</p>
<h2>7. Eigentumsvorbehalt</h2>
<p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>
<h2>8. Rücktrittsrecht für Verbraucher</h2>
<p>Verbrauchern steht ein Rücktrittsrecht von 14 Tagen nach Maßgabe der <a href="/info/widerruf">Widerrufsbelehrung</a> zu. Für einen Wertverlust der Ware haftest du nur, wenn er auf einen Umgang mit der Ware zurückzuführen ist, der zur Prüfung ihrer Beschaffenheit, Eigenschaften und Funktionsweise nicht notwendig war (§ 15 Abs. 2 FAGG). Das betrifft insbesondere bereits eingebaute oder gefahrene Teile.</p>
<p>Kein Rücktrittsrecht besteht bei Waren, die nach deinen Vorgaben angefertigt oder eindeutig auf deine persönlichen Bedürfnisse zugeschnitten wurden (§ 18 Abs. 1 Z 3 FAGG), etwa eigens für dich gefertigten oder abgeänderten Teilen.</p>
<h2>9. Gewährleistung</h2>
<p>Es gilt das gesetzliche Gewährleistungsrecht (für Verbraucher das Verbrauchergewährleistungsgesetz, VGG). Die Gewährleistungsfrist beträgt zwei Jahre ab Übergabe, auch bei Gebrauchtwaren. Bei Gebrauchtwaren gilt der auf der Produktseite beschriebene Zustand als vereinbarte Beschaffenheit; beschriebene Gebrauchsspuren und üblicher Verschleiß stellen keinen Mangel dar.</p>
<p>Keine Mängel sind Schäden durch unsachgemäßen Einbau, unsachgemäße Abstimmung oder Wartung, Überbeanspruchung (etwa im Renneinsatz) sowie die normale Abnutzung von Verschleißteilen. Bitte melde Mängel mit Bestellnummer und Fotos an {{email}}.</p>
<p>Für Unternehmer gilt: Mängel sind unverzüglich nach Erhalt der Ware schriftlich zu rügen (§ 377 UGB); die Gewährleistungsfrist für Gebrauchtwaren beträgt ein Jahr.</p>
<h2>10. Straßenzulassung und Verwendung</h2>
<p>Ob ein Teil für den Straßenverkehr zugelassen ist, geben wir bei den technischen Daten an. Teile ohne Zulassung sind ausschließlich für den Einsatz auf abgesperrten Strecken bestimmt. Für die Einhaltung kraftfahrrechtlicher Vorschriften (insbesondere die Genehmigung von Änderungen nach § 33 KFG), die Typisierung, den Versicherungsschutz und die fachgerechte Montage ist der Käufer verantwortlich. Wir empfehlen, den Einbau von einer Fachwerkstatt durchführen zu lassen.</p>
<h2>11. Haftung</h2>
<p>Wir haften für Schäden bei Vorsatz und grober Fahrlässigkeit. Bei leichter Fahrlässigkeit haften wir nur für Personenschäden. Ansprüche nach dem Produkthaftungsgesetz und andere zwingende gesetzliche Haftungen bleiben unberührt. Gegenüber Verbrauchern gilt der Haftungsausschluss nicht für Schäden an Sachen, die wir zur Bearbeitung übernommen haben.</p>
<h2>12. Gutscheine und Rabattcodes</h2>
<p>Gutscheine können im Shop zum Bezahlen verwendet werden und sind 30 Jahre ab Kaufdatum gültig. Ein Restguthaben bleibt erhalten. Eine Auszahlung in bar ist nicht möglich. Rabattcodes gelten nur in ihrem angegebenen Zeitraum und Umfang und sind nicht mit anderen Aktionen kombinierbar, sofern nichts anderes angegeben ist.</p>
<h2>13. Kundenkonto</h2>
<p>Ein Kundenkonto ist freiwillig. Halte deine Zugangsdaten geheim. Du kannst dein Konto jederzeit löschen lassen; Bestell- und Rechnungsdaten bewahren wir wegen gesetzlicher Aufbewahrungspflichten weiter auf.</p>
<h2>14. Anwendbares Recht und Gerichtsstand</h2>
<p>Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts und der Verweisungsnormen des internationalen Privatrechts. Bei Verbrauchern gilt diese Rechtswahl nur, soweit dir dadurch nicht der Schutz zwingender Bestimmungen des Staates deines gewöhnlichen Aufenthalts entzogen wird. Für Klagen gegen Verbraucher mit Wohnsitz in Österreich ist das Gericht an deinem Wohnsitz zuständig. Für Unternehmer ist ausschließlicher Gerichtsstand das sachlich zuständige Gericht an unserem Sitz.</p>
<h2>15. Streitbeilegung</h2>
<p>Bei Fragen oder Problemen melde dich bitte zuerst direkt bei uns: {{email}}. Verbraucher können sich bei Streitigkeiten aus Online-Käufen außerdem kostenlos an die Internet Ombudsstelle wenden (<a href="https://www.ombudsstelle.at" target="_blank" rel="noopener">www.ombudsstelle.at</a>).</p>`,
		contentHtmlEn: `${EN_NOTE}
<h2>1. Scope</h2>
<p>These terms apply to all contracts concluded via the online shop of {{firma}}, {{strasse}}, {{plz}} {{ort}}, Austria ({{marke}}, "we"). Mandatory consumer rights remain unaffected.</p>
<h2>2. Contract</h2>
<p>Product listings are an invitation to order. By clicking "Place order" you make a binding offer; the contract is concluded with our order confirmation by email. If an item is unexpectedly unavailable (e.g. a single used item sold on site at the same time), we inform you immediately and refund any payment.</p>
<h2>3. Vehicles</h2>
<p>Vehicles are only presented in the shop and cannot be bought online. Vehicle pages are not offers; a purchase is only made on site with a separate written contract.</p>
<h2>4. Prices</h2>
<p>All prices are final prices in euros. {{steuerhinweis}} Used goods marked as "margin scheme" are taxed under § 24 UStG; VAT is not shown separately. Shipping costs are added and shown before you order.</p>
<h2>5. Delivery and pickup</h2>
<p>Items in stock usually ship within two working days after payment, at the latest within 30 days. For consumers, risk passes upon delivery to you. Orders for pickup are held for 14 days.</p>
<h2>6. Payment</h2>
<p>Available payment methods are shown at checkout. Bank transfers are due within {{ueberweisungstage}} days. Unfinished online payments lead to automatic cancellation. Cash payment is only possible on pickup.</p>
<h2>7. Retention of title</h2>
<p>Goods remain our property until paid in full.</p>
<h2>8. Right of withdrawal</h2>
<p>Consumers have a 14-day right of withdrawal according to the <a href="/en/info/widerruf">withdrawal information</a>. You are liable for loss of value caused by handling beyond what is necessary to inspect the goods – especially parts already installed or ridden. There is no right of withdrawal for goods made to your specifications.</p>
<h2>9. Warranty</h2>
<p>Statutory warranty applies for two years from delivery, including used goods. For used goods, the condition described on the product page is the agreed quality. Damage from improper installation, tuning or maintenance, overload (e.g. racing) and normal wear is not a defect. Businesses must report defects without delay; for them the warranty on used goods is one year.</p>
<h2>10. Road approval and use</h2>
<p>The technical data state whether a part is approved for road use. Parts without approval are intended exclusively for closed circuits. The buyer is responsible for compliance with motor vehicle law (in particular approval of modifications under § 33 KFG), type approval, insurance and professional installation.</p>
<h2>11. Liability</h2>
<p>We are liable for intent and gross negligence; for slight negligence only for personal injury. Product liability and other mandatory liability remain unaffected.</p>
<h2>12. Gift cards</h2>
<p>Gift cards are valid for 30 years from purchase and cannot be paid out in cash. Remaining balances are kept.</p>
<h2>13. Law and jurisdiction</h2>
<p>Austrian law applies, excluding the UN Convention on Contracts for the International Sale of Goods; mandatory consumer protection of your country of residence remains unaffected. Consumers can contact the Internet Ombudsstelle (www.ombudsstelle.at) free of charge.</p>`
	},
	{
		slug: 'widerruf',
		group: 'rechtliches',
		sortOrder: 1,
		title: 'Widerrufsbelehrung',
		titleEn: 'Right of withdrawal',
		contentHtml: `<h2>Rücktrittsrecht</h2>
<p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.</p>
<p>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Haben Sie mehrere Waren im Rahmen einer einheitlichen Bestellung bestellt, die getrennt geliefert werden, beginnt die Frist mit dem Tag, an dem Sie oder ein von Ihnen benannter Dritter die letzte Ware in Besitz genommen haben bzw. hat.</p>
<p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({{firma}}, {{strasse}}, {{plz}} {{ort}}, {{land}}, E-Mail: {{email}}, Telefon: {{telefon}}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.</p>
<p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
<h2>Folgen des Widerrufs</h2>
<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.</p>
<p>Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>
<p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.</p>
<p>Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.</p>
<h2>Ausschluss des Rücktrittsrechts</h2>
<p>Das Rücktrittsrecht besteht nicht bei Verträgen über Waren, die nach Kundenspezifikationen angefertigt werden oder eindeutig auf die persönlichen Bedürfnisse zugeschnitten sind (§ 18 Abs. 1 Z 3 FAGG).</p>
<h2>Muster-Widerrufsformular</h2>
<p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>
<blockquote>
<p>An {{firma}}, {{strasse}}, {{plz}} {{ort}}, {{land}}, E-Mail: {{email}}</p>
<p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)</p>
<p>Bestellt am (*)/erhalten am (*)<br>Name des/der Verbraucher(s)<br>Anschrift des/der Verbraucher(s)<br>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)<br>Datum</p>
<p>(*) Unzutreffendes streichen.</p>
</blockquote>`,
		contentHtmlEn: `${EN_NOTE}
<h2>Right of withdrawal</h2>
<p>You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period expires fourteen days after the day on which you, or a third party other than the carrier indicated by you, acquire physical possession of the goods (for several goods delivered separately: the last good).</p>
<p>To exercise the right of withdrawal, you must inform us ({{firma}}, {{strasse}}, {{plz}} {{ort}}, Austria, email: {{email}}, phone: {{telefon}}) of your decision by an unequivocal statement (e.g. a letter sent by post or an email). You may use the model withdrawal form below, but it is not obligatory. It is sufficient to send your communication before the withdrawal period has expired.</p>
<h2>Effects of withdrawal</h2>
<p>If you withdraw, we will reimburse all payments received from you, including the costs of delivery (except supplementary costs resulting from your choice of a delivery type other than the least expensive standard delivery), without undue delay and not later than fourteen days from the day we are informed of your decision. We will use the same means of payment as used for the initial transaction, unless expressly agreed otherwise; you will not incur any fees. We may withhold reimbursement until we have received the goods back or you have supplied evidence of having sent them back, whichever is earlier.</p>
<p>You shall send back or hand over the goods without undue delay and in any event not later than fourteen days from the day you communicate your withdrawal. You bear the direct cost of returning the goods. You are only liable for any diminished value of the goods resulting from handling other than what is necessary to establish their nature, characteristics and functioning.</p>
<h2>Exclusion</h2>
<p>There is no right of withdrawal for goods made to the consumer's specifications or clearly personalised.</p>
<h2>Model withdrawal form</h2>
<blockquote>
<p>To {{firma}}, {{strasse}}, {{plz}} {{ort}}, Austria, email: {{email}}</p>
<p>I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*)/for the provision of the following service (*)</p>
<p>Ordered on (*)/received on (*)<br>Name of consumer(s)<br>Address of consumer(s)<br>Signature of consumer(s) (only if this form is notified on paper)<br>Date</p>
<p>(*) Delete as appropriate.</p>
</blockquote>`
	},
	{
		slug: 'datenschutz',
		group: 'rechtliches',
		sortOrder: 2,
		title: 'Datenschutzerklärung',
		titleEn: 'Privacy policy',
		contentHtml: `<h2>Verantwortlicher</h2>
<p>{{firma}}, {{strasse}}, {{plz}} {{ort}}, {{land}}<br>E-Mail: {{email}}, Telefon: {{telefon}}</p>
<p>Wir verarbeiten personenbezogene Daten nur, soweit es für den Betrieb dieses Shops, die Abwicklung deiner Bestellungen und Anfragen oder aufgrund gesetzlicher Pflichten nötig ist. Ein Datenschutzbeauftragter ist für uns gesetzlich nicht vorgeschrieben; deine Anfragen richtest du bitte an die oben genannte Adresse.</p>
<h2>Bestellungen</h2>
<p>Für die Abwicklung einer Bestellung verarbeiten wir Name, Rechnungs- und Lieferadresse, E-Mail-Adresse, optional Telefonnummer, Firma und UID-Nummer, die bestellten Artikel, Zahlungsart und Zahlungsstatus sowie Nachrichten zur Bestellung. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Rechnungen und Buchhaltungsunterlagen bewahren wir aufgrund steuerrechtlicher Pflichten sieben Jahre auf (§ 132 BAO; Art. 6 Abs. 1 lit. c DSGVO).</p>
<p>Gibst du bei einer Firmenbestellung eine UID-Nummer an, prüfen wir deren Gültigkeit über das MwSt-Informationsaustauschsystem (VIES) der Europäischen Kommission.</p>
<h2>Kundenkonto</h2>
<p>Legst du ein Konto an, speichern wir zusätzlich deine Zugangsdaten (das Passwort nur verschlüsselt als Hash) und gespeicherte Adressen, bis du das Konto löschst. Rechtsgrundlage ist die Vertragserfüllung bzw. deine Einwilligung durch die Registrierung.</p>
<h2>Anfragen</h2>
<p>Schreibst du uns über das Kontaktformular, eine Produkt- oder Fahrzeugseite oder per E-Mail, verarbeiten wir deine Angaben (Name, E-Mail, optional Telefon, Nachricht und das betreffende Produkt), um die Anfrage zu beantworten. Rechtsgrundlage ist die Anbahnung eines Vertrags bzw. unser berechtigtes Interesse an der Beantwortung (Art. 6 Abs. 1 lit. b und f DSGVO). Anfragen, aus denen kein Vertrag entsteht, löschen wir spätestens nach drei Jahren.</p>
<h2>Zahlungsdienstleister</h2>
<p>Je nach gewählter Zahlungsart geben wir die für die Zahlung nötigen Daten (Betrag, Bestellnummer, Name, E-Mail-Adresse) an den jeweiligen Zahlungsdienstleister weiter, der die Zahlung in eigener Verantwortung abwickelt:</p>
<ul>
<li><strong>Stripe</strong> (Karte, Apple Pay, Google Pay, EPS, Klarna u. a.): Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland. Datenschutz: stripe.com/at/privacy</li>
<li><strong>PayPal</strong>: PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxemburg. Datenschutz: paypal.com/at/legalhub/privacy-full</li>
</ul>
<p>Deine Karten- oder Kontodaten gibst du direkt beim Zahlungsdienstleister ein; wir erhalten sie nicht. Bei Überweisung verarbeiten wir die Angaben aus dem Zahlungseingang auf unserem Bankkonto.</p>
<h2>Versand</h2>
<p>Für die Zustellung geben wir Name, Lieferadresse und – wenn vom Versanddienst für die Zustellbenachrichtigung benötigt – E-Mail-Adresse oder Telefonnummer an das beauftragte Versandunternehmen weiter (z. B. Österreichische Post AG, DPD Austria, GLS Austria, DHL). Rechtsgrundlage ist die Vertragserfüllung.</p>
<h2>E-Mails</h2>
<p>Bestellbestätigungen, Versandinformationen, Rechnungen und Antworten auf Anfragen verschicken wir über unseren E-Mail-Anbieter. Werbe-E-Mails oder Newsletter verschicken wir nicht.</p>
<h2>Hosting und Server-Protokolle</h2>
<p>Der Shop läuft auf unserem eigenen Server. Die Verbindung zum Shop wird über Cloudflare (Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA) verschlüsselt geleitet und gegen Angriffe geschützt. Dabei verarbeitet Cloudflare technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und aufgerufene Adresse. Cloudflare ist nach dem EU-US Data Privacy Framework zertifiziert; zusätzlich bestehen Standardvertragsklauseln. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).</p>
<p>Zum Schutz vor Missbrauch (etwa wiederholten falschen Anmeldeversuchen) verarbeiten wir IP-Adressen kurzzeitig im Arbeitsspeicher; sie werden nicht dauerhaft gespeichert.</p>
<h2>Cookies</h2>
<p>Wir verwenden nur technisch notwendige Cookies: für den Warenkorb, die Anmeldung im Kundenkonto und kurze Hinweise nach einer Aktion. Sie enthalten zufällige Kennungen und keine Werbe- oder Tracking-Informationen. Rechtsgrundlage ist § 165 Abs. 3 TKG 2021 und unser berechtigtes Interesse am Funktionieren des Shops. Werbe- oder Analyse-Cookies setzen wir nicht.</p>
<h2>Besucherstatistik</h2>
<p>Wir zählen, wie oft einzelne Seiten aufgerufen werden – je Tag und Adresse eine Zahl. Dabei werden weder Cookies gesetzt noch IP-Adressen oder sonstige Merkmale gespeichert, die Rückschlüsse auf dich zulassen.</p>
<h2>Schriftarten</h2>
<p>Die Schriftarten liegen auf unserem eigenen Server. Beim Aufruf des Shops wird keine Verbindung zu Google Fonts oder anderen Schriftanbietern hergestellt.</p>
<h2>Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen Verarbeitungen, die auf unserem berechtigten Interesse beruhen. Eine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Schreib uns dazu an {{email}}.</p>
<p>Wenn du glaubst, dass die Verarbeitung deiner Daten gegen das Datenschutzrecht verstößt, kannst du dich bei der Österreichischen Datenschutzbehörde beschweren: Barichgasse 40–42, 1030 Wien, dsb@dsb.gv.at, www.dsb.gv.at.</p>`,
		contentHtmlEn: `${EN_NOTE}
<h2>Controller</h2>
<p>{{firma}}, {{strasse}}, {{plz}} {{ort}}, Austria – email: {{email}}, phone: {{telefon}}</p>
<h2>Orders and account</h2>
<p>To process orders we use your name, billing and delivery address, email, optionally phone number, company and VAT ID, ordered items, payment method and status, and messages about the order (Art. 6(1)(b) GDPR). Invoices are kept for seven years for tax reasons (§ 132 BAO). VAT IDs are checked via the EU VIES system. If you create an account, we additionally store your login (password only as a hash) and saved addresses until you delete it.</p>
<h2>Inquiries</h2>
<p>We use the details you send via the contact form or a product/vehicle page to answer your inquiry (Art. 6(1)(b) and (f) GDPR) and delete inquiries that don't lead to a contract after three years at the latest.</p>
<h2>Service providers</h2>
<p>Depending on your choice we pass the data needed for payment to Stripe Payments Europe, Ltd. (Dublin, Ireland) or PayPal (Europe) S.à r.l. et Cie, S.C.A. (Luxembourg), and the data needed for delivery to the carrier (e.g. Austrian Post, DPD, GLS, DHL). Transactional emails are sent via our email provider; we don't send newsletters. Traffic to the shop is routed through Cloudflare, Inc. (USA, certified under the EU-US Data Privacy Framework) for security (Art. 6(1)(f) GDPR).</p>
<h2>Cookies and statistics</h2>
<p>We only use technically necessary cookies (cart, login, short notices). Page views are counted per day and address without cookies or personal data. Fonts are served from our own server.</p>
<h2>Your rights</h2>
<p>You have the right of access, rectification, erasure, restriction, data portability and objection. Contact {{email}}. You may lodge a complaint with the Austrian Data Protection Authority, Barichgasse 40–42, 1030 Vienna, www.dsb.gv.at.</p>`
	},
	{
		slug: 'impressum',
		group: 'rechtliches',
		sortOrder: 3,
		title: 'Impressum',
		titleEn: 'Legal notice',
		contentHtml: `<h2>Angaben gemäß § 5 ECG, § 14 UGB und § 25 MedienG</h2>
<p><strong>{{firma}}</strong><br>{{strasse}}<br>{{plz}} {{ort}}<br>{{land}}</p>
<p>E-Mail: {{email}}<br>Telefon: {{telefon}}</p>
<p>Inhaber bzw. vertretungsbefugt: {{vertretung}}<br>{{firmenbuch}}UID-Nummer: {{uid}}</p>
<p>Unternehmensgegenstand: {{gewerbe}}<br>Mitglied der {{kammer}}<br>Gewerbebehörde: {{behoerde}}<br>Anwendbare Rechtsvorschriften: Gewerbeordnung 1994, abrufbar unter <a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener">www.ris.bka.gv.at</a></p>
<h2>Offenlegung gemäß § 25 MedienG</h2>
<p>Medieninhaber: {{firma}}, {{strasse}}, {{plz}} {{ort}}.<br>Grundlegende Richtung: Information über das Sortiment und die Leistungen von {{marke}} (Teile, Reifen und Fahrzeuge für Mopeds und Motorräder) sowie deren Verkauf.</p>
<h2>Verbraucherstreitbeilegung</h2>
<p>Verbraucher können sich bei Streitigkeiten aus Online-Käufen an die Internet Ombudsstelle wenden: <a href="https://www.ombudsstelle.at" target="_blank" rel="noopener">www.ombudsstelle.at</a>.</p>
<h2>Bildnachweis</h2>
<p>Produktfotos: {{marke}} bzw. die jeweiligen Hersteller. Das Titelbild ist eine Visualisierung.</p>`,
		contentHtmlEn: `<h2>Legal notice</h2>
<p><strong>{{firma}}</strong><br>{{strasse}}<br>{{plz}} {{ort}}, Austria</p>
<p>Email: {{email}}<br>Phone: {{telefon}}</p>
<p>Owner / authorised representative: {{vertretung}}<br>{{firmenbuch}}VAT ID: {{uid}}</p>
<p>Business: {{gewerbe}}. Member of the {{kammer}}. Supervisory authority: {{behoerde}}. Applicable regulations: Austrian Trade Regulation Act 1994 (www.ris.bka.gv.at).</p>
<p>Consumers can contact the Internet Ombudsstelle (www.ombudsstelle.at) in case of disputes about online purchases.</p>`
	}
];
