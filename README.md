# Koubach Tuning – Webshop

Onlineshop für Moped- und Motorradteile, Gebrauchtteile, Reifen und Fahrzeuge (nur auf Anfrage)
mit internem Bereich für das Team. Eine einzige Anwendung (SvelteKit + SQLite) in einem Docker-Container –
zum Testen läuft der Shop unter `koubach.astronox.dev`, der interne Bereich unter `koubachadmin.astronox.dev`.

Technische Grundlage ist der Backyardboys-Webshop; Design, Texte und Bilder kommen aus dem
Koubach-Prototyp (Next.js), der dadurch abgelöst wird.

## Was drin ist

**Shop (Deutsch und Englisch, `/en/…`)**
- Kategorien mit Mega-Menü (Neuteile mit Unterkategorien, Gebrauchtteile, Reifen, Fahrzeuge, Gutscheine), Suche
  (auch in Hersteller und technischen Daten), Filter nach Hersteller und Zustand
- Produkte mit Hersteller, Zustand (neu, gebraucht, generalüberholt) samt Beschreibung, technischen Daten als Tabelle,
  Varianten (z. B. mit/ohne Zylinderkopf), Lagerbestand, „Nur noch X Stück“, Einzelstücke, Vorbestellung, Sets
- Differenzbesteuerung nach § 24 UStG je Produkt (Gebrauchtes von Privat): keine USt.-Ausweisung, eigener Hinweis auf der Rechnung
- **Fahrzeuge** nur auf Anfrage: Inserat mit Daten und Anfrageformular statt Warenkorb
- Anfrageformular auf jeder Produktseite („Passt das auf mein Fahrzeug?“) und allgemeines Kontaktformular –
  das Team bekommt E-Mail und Push, der Kunde eine Eingangsbestätigung
- **Sendungsverfolgung** ohne Anmeldung (`/sendungsverfolgung`): Bestellnummer + E-Mail oder Sendungsnummer
- Gutscheine (per Mail an Käufer oder Beschenkte) und Rabattcodes
- Kasse ohne Konto möglich, Firmenkunden mit UID-Prüfung (VIES) und Reverse Charge
- Kundenkonto mit Passwort oder Anmelde-Link: Bestellungen, Status, Sendungsnummer, Rechnungen, Nachrichten, Adressen
- Versandpauschale je Land (Start: Österreich 5,90 €, Deutschland 9,90 €), Versandkostenfrei-Grenze, Abholung in Hollabrunn
- Zahlungsarten: **Stripe** (Karte, Apple/Google Pay, EPS, Klarna, SEPA – was im Stripe-Dashboard aktiv ist),
  **PayPal**, **Vorkasse per Überweisung**, **Barzahlung bei Abholung**. Weitere lassen sich in `src/lib/server/payments/` ergänzen.
- Besucherzählung ohne Cookies, nur technisch notwendige Cookies

**Interner Bereich**
- Übersicht mit Start-Checkliste, offenen Anfragen, offenen Überweisungen, niedrigem Lagerstand, Besuchern
- Bestellungen: Zahlung verbuchen, versenden mit Sendungsnummer (Post, DPD, GLS, DHL, UPS), Abholung, Storno, Erstattung, Nachrichten
- Produkte (Neuteil, Gebrauchtteil, Fahrzeug mit eigener Vorlage), Kategorien, Gutscheine & Rabatte, Kunden, Anfragen
- Startseite (Titelbild, Texte, Hinweisleiste, Projekte aus der Werkstatt, Kundenstimmen), Seiten (Info- und Rechtstexte), Mediathek
- Rechnungen als PDF mit fortlaufender Nummer (Rechnung, Stornorechnung), Berichte und Export (CSV und PDF-Sammlung)
- Rollen **Admin** und **Mitarbeiter** (bis zu 5 Personen sind kein Problem), Anmeldung mit Authenticator-App (Pflicht)
- Benachrichtigung bei neuen Bestellungen, Anfragen und Nachrichten per **E-Mail** und **Push aufs Handy**
- Tägliche Sicherung am Server, Herunterladen und Wiederherstellen im Browser

## Lokal starten

Voraussetzung: Node.js 22 oder neuer.

```bash
npm install
npm run dev
```

Der Shop läuft dann unter http://localhost:5195, der interne Bereich unter http://localhost:5195/admin.
Beim ersten Start wird ein Admin-Zugang angelegt; Benutzername und Passwort stehen in der Konsole.
Beim ersten Login wird die Authenticator-App eingerichtet.

Zum Ausprobieren gibt es Beispielprodukte (Auspuffe, Zylinderkit, Gebrauchtteile, Reifen, ein Fahrzeug, Gutschein):

```bash
npm run demo                  # anlegen
npm run demo -- --entfernen   # Demo-Produkte wieder löschen
```

Ohne SMTP-Einstellungen werden E-Mails nicht verschickt, sondern in der Konsole ausgegeben
(und unter Einstellungen → E-Mail protokolliert) – praktisch zum Testen der Links.

Weitere Befehle: `npm run check` (Typprüfung), `npm test` (Tests), `npm run build` (Produktionsversion).

## Auf dem Server (Portainer + Cloudflare Tunnel)

1. **Image**: GitHub Actions baut bei jedem Push auf `main` das Image
   `ghcr.io/mstreicher98/koubachtuning-webshop:latest`. Das Repository ist privat – in Portainer unter
   *Registries* `ghcr.io` mit GitHub-Benutzer und einem Token (Recht `read:packages`) hinterlegen.
2. **Tunnel**: Im Cloudflare-Dashboard unter *Networking → Tunnels → Create a tunnel* (Typ *Cloudflared*)
   einen Tunnel anlegen und beim Schritt *Install connector* nur das lange Token (beginnt mit `eyJ`) kopieren.
   Dann im Tunnel unter *Routes → Add route → Published application* zwei Routen anlegen:

   | Subdomain | Domain | Service URL |
   |---|---|---|
   | `koubach` | `astronox.dev` | `http://app:3000` |
   | `koubachadmin` | `astronox.dev` | `http://app:3000` |

   `astronox.dev` muss im selben Cloudflare-Konto liegen. Läuft für astronox.dev schon ein Tunnel, können die
   Routen alternativ dort angelegt werden – dann muss dieser `cloudflared` im selben Docker-Netz wie `app` laufen.
3. **Stack**: In Portainer *Stacks → Add stack*, Inhalt von [`portainer-stack.yml`](portainer-stack.yml) einfügen und die
   Variablen setzen (`SHOP_URL`, `ADMIN_URL`, `TUNNEL_TOKEN`, `APP_SECRET`). `APP_SECRET` gut aufbewahren –
   damit sind die Zugangsdaten für Stripe, PayPal und SMTP verschlüsselt.
4. Im Log des Containers `app` steht der erste Admin-Zugang (sofern kein `INITIAL_ADMIN_PASSWORD` gesetzt war).

**Neue Version:** Stack → *Update the stack* mit *Re-pull image and redeploy*. Automatisch geht es, wenn in Portainer
ein Webhook für den Stack angelegt und dessen Adresse als GitHub-Secret `PORTAINER_WEBHOOK_URL` hinterlegt wird.

**Umzug auf die echte Domain:** im Tunnel die neuen Routen anlegen, `SHOP_URL` und `ADMIN_URL` im Stack ändern und
den Stack neu starten. Danach die Stripe-Webhook-Adresse und bei PayPal die Rücksprung-Domain anpassen.

### Cloudflare Tunnel: wenn es nicht klappt

- **„An A, AAAA, or CNAME record with that host already exists“**: Die Adresse ist im DNS schon vergeben.
  Unter *DNS → Records* den alten Eintrag löschen und die Route erneut anlegen.
- **Fehler 502 / „Bad gateway“**: `cloudflared` erreicht die App nicht. Die Service URL muss genau
  `http://app:3000` lauten (nicht `https`, nicht `localhost`), und `cloudflared` muss im selben Stack laufen wie `app`.
- **Tunnel bleibt „Inactive“**: `TUNNEL_TOKEN` falsch oder unvollständig kopiert („Unauthorized“ im Log von `cloudflared`).
- **koubachadmin.… zeigt den Shop oder leitet im Kreis**: `SHOP_URL` und `ADMIN_URL` im Stack prüfen
  (mit `https://`, ohne Schrägstrich am Ende), danach den Stack neu starten.

Alle Daten (Datenbank, Bilder, Kunden-Dateien, Sicherungen) liegen im Volume `koubach-data` unter `/data`.
Beim Entfernen des Stacks das Volume **nicht** mitlöschen.

## Vor dem Livegang

Die Übersicht im Admin zeigt eine Checkliste. Im Detail:

- **Einstellungen → Firma**: Firmenwortlaut (mit Rechtsform, z. B. „Koubach Tuning e.U.“), E-Mail, Telefon, Inhaber,
  UID, Gewerbe, ggf. Firmenbuch, Bankverbindung. Diese Angaben erscheinen auf Rechnungen und im Impressum.
  Adresse (Kapellenfeldweg 5, 2020 Hollabrunn), Kammer und Gewerbebehörde sind schon eingetragen.
- **Einstellungen → Steuer & Rechnungen**: Regelbesteuerung 20 % ist eingestellt, Präfix der Rechnungsnummer.
- **Einstellungen → Zahlung**:
  - Stripe: geheimer Schlüssel (*Entwickler → API-Schlüssel*) und Webhook (*Entwickler → Webhooks*) mit der Adresse
    `https://koubach.astronox.dev/api/zahlung/stripe` und den Ereignissen `checkout.session.completed`,
    `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.
    Das *Signing secret* (`whsec_…`) ebenfalls eintragen. Zahlungsarten (EPS, Klarna, Apple Pay …) im Stripe-Dashboard aktivieren.
  - PayPal: Client-ID und Secret aus developer.paypal.com (zuerst mit Sandbox testen).
  - Überweisung und Barzahlung bei Abholung sind eingeschaltet.
- **Einstellungen → E-Mail**: SMTP-Zugang des Shop-Postfachs, danach „Test-E-Mail an mich“.
- **Einstellungen → Versand**: Länder, Preise (Platzhalter AT 5,90 €, DE 9,90 €) und Frei-ab-Grenze prüfen.
- **Seiten**: AGB, Widerrufsbelehrung, Datenschutzerklärung, Impressum, Versand, Zahlung, Rücksendung und FAQ sind nach
  österreichischem Recht für Koubach Tuning geschrieben (Stand Oktober 2026). Vor dem Livegang von einer fachkundigen
  Stelle (z. B. WKO-Rechtsservice) prüfen lassen. Platzhalter wie `{{firma}}` werden automatisch mit den Firmendaten gefüllt.
- **Mein Konto**: E-Mail-Adresse hinterlegen und Push-Nachrichten am Handy einschalten
  (iPhone: den Admin-Bereich in Safari über *Teilen → Zum Home-Bildschirm* als App installieren und dort einschalten).

## Sicherungen

Jede Nacht ab 2 Uhr entsteht eine Sicherung unter `/data/backups` (14 werden aufbewahrt). Unter
*Einstellungen → Sicherungen* lassen sie sich herunterladen und wiederherstellen – auch auf einem neuen Server.
Die Zugangsdaten (Stripe, PayPal, SMTP) sind darin verschlüsselt; auf einem neuen Server mit anderem `APP_SECRET`
müssen sie neu eingetragen werden. Sicherungen regelmäßig zusätzlich außerhalb des Servers aufbewahren.

## Notfall-Zugang

Handy mit der Authenticator-App verloren und kein anderer Admin da? In Portainer beim Container `app` die
*Console* öffnen und:

```bash
node scripts/zugang.mjs liste
node scripts/zugang.mjs zuruecksetzen admin
```

Das erzeugt ein vorläufiges Passwort und setzt die Zwei-Faktor-Anmeldung zurück.

## Aufbau

```
src/lib/server/db/schema.ts        Datenbank (Drizzle); Änderungen mit `npm run db:generate` als Migration anlegen
src/lib/server/db/seed-pages.ts     Vorlagen der Info- und Rechtstexte
src/lib/server/shop/pricing.ts      Preise, Rabatte, Steuer inkl. Differenzbesteuerung (mit Tests)
src/lib/server/shop/catalog.ts      Produkte, Suche, Filter
src/lib/server/shop/cart.ts         Warenkorb
src/lib/server/shop/orders.ts       Bestellen, Zahlungseingang, Storno
src/lib/server/shop/invoices.ts     Rechnungen und PDF
src/lib/server/inquiry.ts           Anfragen (Kontakt, Produkte, Fahrzeuge)
src/lib/server/payments/            Zahlungsarten (Stripe, PayPal)
src/lib/server/emails.ts            alle E-Mails
src/lib/shop.css                    Shop-Design (helle Flächen, dunkle Zonen, Rot-Weiß-Rot)
src/routes/(shop)/                  Shop
src/routes/admin/                   interner Bereich
```
