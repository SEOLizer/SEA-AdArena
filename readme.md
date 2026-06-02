# SEA-AdArena Simulator

> **Interaktives SEA-Trainingstool** – Bildet Google Ads & Microsoft Advertising realitätsgetreu ab.
> Auszubildende steuern Kampagnen in einer risikofreien Sandkasten-Umgebung.
> Multi-User-fähig mit Ausbilder-Rolle, MariaDB-Backend und Google-Ads-ähnlicher Oberfläche.

---

## 1. Management Summary & Zielsetzung

Die Steuerung von bezahlten Suchanzeigen (Google Ads & Microsoft Advertising) gehört zu den Kernkompetenzen im E-Commerce. Für Auszubildende stellt die Abstraktion des Systems – Echtzeit-Auktionen, Qualitätsfaktoren, dynamische Budgetverteilung – eine massive Einstiegshürde dar. Fehler im Live-System führen unweigerlich zu realen finanziellen Verlusten.

**Der SEA-AdArena Simulator löst dieses Problem.** Es handelt sich um ein geschlossenes, browserbasiertes E-Learning-Tool, das die Benutzeroberfläche und die mathematische Auktionslogik von Google Ads originalgetreu nachbildet. Auszubildende können in einer risikofreien Sandkasten-Umgebung:

- Eigene Accounts anlegen
- Kampagnen mit echter Google-Ads-Struktur anlegen (Kampagne → Anzeigengruppen → Keywords)
- Budgets verwalten (Tages- & Monatsbudget)
- Gebotsstrategien wählen (manueller CPC vs. "Conversions maximieren")
- **Keyword Match-Types** (Broad/Phrase/Exact) setzen
- Den **Qualitätsfaktor** mit seinen Komponenten beeinflussen
- Wettbewerbsanalysen gegen KI-Konkurrenten durchführen
- Den Erfolg oder Misserfolg ihrer Entscheidungen im **beschleunigten Zeitverlauf** analysieren (24-Stunden-Flüge komprimiert auf Knopfdruck)

**🔑 Neu & zentral:**

1. **Live-Einfügung unbekannter Keywords** – Kennt der Simulator ein Keyword noch nicht, wird es **zur Laufzeit** via Heuristik-Engine analysiert, mit Intent klassifiziert und in die MariaDB eingefügt. Der Azubi merkt davon nichts – das Keyword ist ab sofort Teil des Pools.
2. **Intent-basierte Simulation** – Jedes Keyword erhält einen Intent (transactional, commercial, navigational, informational). Dieser Intent **steuert aktiv** die Simulation: Base-CPC, CTR, Conversion-Rate und Qualitätsfaktor-Komponenten werden basierend auf dem Intent berechnet.

**Für Ausbilder:** Szenarien vorgeben, Marktbedingungen manipulieren, Lernerfolge der Azubis einsehen und besprechen.

---

## 2. Systemarchitektur

```
┌─────────────────────────────────────────────────┐
│                 FRONTEND (React)                 │
│  Google-Ads-inspirierte UI (Tailwind CSS)        │
│  Komponenten:                                    │
│  • Seitenmenü (Kampagnen, Einblicke, Berichte)   │
│  • Kampagnen-Übersicht (Tabelle + Filter)        │
│  • Kampagnen-Editor (Registerkarten)             │
│  • Dashboard (grafische Auswertung)              │
│  • Admin-Panel (Ausbilder)                       │
└──────────────────────┬──────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────▼──────────────────────────┐
│              BACKEND (Node.js/Express)            │
│  • Sequelize ORM → MariaDB                        │
│  • JWT-Authentifizierung (admin / trainee)        │
│  • Simulation Engine (Auktionslogik)              │
│  • Keyword Planner Engine (Keyword-Ideen + Gruppen)│
│  • Heuristic Engine (unbekannte Keywords)         │
│  │  → Intent-Klassifikation + Live-Einfügung      │
│  │  → Fallback auf lokale NLP (wenn API offline) │
│  • Intent Engine (Intent-Wirkung auf CPC/CTR/QS)  │
│  • Scenario Service (Ausbilder-Steuerung)         │
│  • DataSource Manager (externe APIs)              │
│  │  ├─ Google Autocomplete (verwandte Keywords)   │
│  │  ├─ OpenThesaurus / lokales NLP (Intent)       │
│  │  ├─ Wikipedia Pageviews (Suchvolumen-Relation) │
│  │  └─ ⭐ LLM (optional: OpenAI / lokal via Ollama)│
│  │     → KI-gestützte Keyword-Gruppierung & Intent│
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│                  MARIA-DB                         │
│  • keyword_database (Stammdaten + Live-Einfügung) │
│  • keyword_groups + keyword_group_members (Cluster)│
│  • users, campaigns, ad_groups                    │
│  • campaign_keywords (mit match_type)             │
│  • auction_results (stündlich)                    │
│  • hourly_stats (aggregiert)                      │
│  • competitor_profiles (KI-Konkurrenten)          │
│  • scenarios (Ausbilder-Vorlagen)                 │
│  • simulation_log (Lern-Audit-Trail)              │
└──────────────────────────────────────────────────┘
```

### 2.1 Datenbankschema (Kern-Tabellen)

#### `users`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `username` | VARCHAR(50) UNIQUE | |
| `email` | VARCHAR(255) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt |
| `role` | ENUM('admin','trainee') | |
| `created_at` | DATETIME | |

#### `campaigns`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `user_id` | FK → users | |
| `name` | VARCHAR(200) | |
| `status` | ENUM('running','paused','budget_exhausted','ended') | |
| `daily_budget` | DECIMAL(8,2) | |
| `monthly_budget` | DECIMAL(10,2) | |
| `bid_strategy` | ENUM('manual_cpc','maximize_conversions') | |
| `network` | ENUM('search','search_display') | Suchpartner/Display-Netzwerk |
| `start_date` | DATE | Simulations-Starttag |
| `budget_exhausted_at` | TIME NULL | Wann Budget aufgebraucht? |
| `impressions` | INT UNSIGNED DEFAULT 0 | |
| `clicks` | INT UNSIGNED DEFAULT 0 | |
| `cost` | DECIMAL(10,2) DEFAULT 0 | |
| `conversions` | INT UNSIGNED DEFAULT 0 | |
| `avg_position` | DECIMAL(3,1) DEFAULT 0 | |
| `created_at` | DATETIME | |

#### `ad_groups`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `campaign_id` | FK → campaigns | |
| `name` | VARCHAR(200) | |
| `max_cpc` | DECIMAL(6,2) | Standard-CPC für die Gruppe |
| `quality_score` | TINYINT UNSIGNED (1-10) | Simulierter QS |
| `qs_expected_ctr` | ENUM('below','average','above') | QS-Komponente 1 |
| `qs_ad_relevance` | ENUM('below','average','above') | QS-Komponente 2 |
| `qs_landing_page` | ENUM('below','average','above') | QS-Komponente 3 |
| `landing_page_experience` | ENUM('poor','average','excellent') | Vom Azubi wählbar |

#### `keywords` (Stammdatenpool **+ Live-Einfügung**)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `keyword` | VARCHAR(255) UNIQUE | Einmalig – Heuristik legt bei Konflikt nicht an |
| `monthly_search_volume` | INT UNSIGNED | Geschätzt (Heuristik) oder real (Seed) |
| `base_cpc` | DECIMAL(4,2) | Marktdurchschnitts-CPC |
| `intent_category` | ENUM('informational','transactional','commercial','navigational') | **Wird von Heuristik beim Einfügen bestimmt** |
| `intent_source` | ENUM('seed','heuristic') DEFAULT 'seed' | Stammdaten oder live generiert? |
| `competition_level` | ENUM('low','medium','high') | Wettbewerbsdichte |
| `seasonality_factors` | JSON | 12 Werte [Jan..Dez] (Heuristik: Defaults) |
| `heuristic_data` | JSON NULL | Rohdaten der Heuristik-Analyse (gefundene Intent-Signale, Wortanzahl, etc.) |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

#### `campaign_keywords` (Zuordnung mit Match-Type)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `ad_group_id` | FK → ad_groups | |
| `keyword_id` | FK → keywords | |
| `match_type` | ENUM('broad','phrase','exact') DEFAULT 'phrase' | Keyword Match-Type |
| `max_cpc_override` | DECIMAL(6,2) NULL | Keyword-spezifisches Gebot |
| `generated_by_heuristic` | BOOLEAN DEFAULT FALSE | Wurde das Keyword bei Eingabe live erzeugt? |

#### `keyword_groups` (Themen-Cluster für den Keyword-Planer)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `name` | VARCHAR(100) | Gruppenname (z.B. „Sneaker", „Wanderschuhe", „Barfußschuhe") |
| `description` | VARCHAR(255) NULL | Kurzbeschreibung für den Planer |
| `parent_group_id` | INT UNSIGNED NULL | FK → keyword_groups (Hierarchie: „Laufschuhe" ⊆ „Schuhe") |
| `default_intent` | ENUM('informational','transactional','commercial','navigational') NULL | Intent, der für Gruppen-Keywords ohne eigenen Intent gilt |
| `icon` | VARCHAR(50) NULL | Emoji/Icon für die UI (z.B. „👟") |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

#### `keyword_group_members` (N:M – Welches Keyword gehört zu welcher Gruppe?)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | INT UNSIGNED AI PK | |
| `keyword_id` | INT UNSIGNED FK → keywords | |
| `group_id` | INT UNSIGNED FK → keyword_groups | |
| `relationship_type` | ENUM('primary','synonym','broader','narrower','related') DEFAULT 'related' | Art der Verwandtschaft (wie Google Ads: „eng verwandt", „weiter gefasst") |
| `created_at` | DATETIME DEFAULT CURRENT_TIMESTAMP | |

**Beispiel-Daten:**

| keyword | Gruppe | relationship_type |
|---|---|---|
| sneaker kaufen | Sneaker | primary |
| sneaker günstig | Sneaker | synonym |
| laufschuhe kaufen | Laufschuhe | primary |
| laufschuhe kaufen | Sneaker | broader |
| schuhe | Schuhe | primary |
| schuhe | Sneaker | broader |
| wanderschuhe | Wanderschuhe | primary |
| barfußschuhe kinder | Barfußschuhe | primary |

#### `competitor_profiles` (KI-Konkurrenten)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | TINYINT UNSIGNED AI PK | |
| `name` | VARCHAR(100) | |
| `strategy_label` | VARCHAR(50) | "Marktführer", "Schnäppchenjäger", "Qualitäts-Optimierer" |
| `base_bid` | DECIMAL(6,2) | Max. CPC |
| `quality_score` | TINYINT UNSIGNED | |
| `daily_budget` | DECIMAL(8,2) NULL | NULL = unbegrenzt |
| `active_hours_start` | TINYINT UNSIGNED DEFAULT 0 | **Zeitliche Steuerung (Ad Scheduling)** |
| `active_hours_end` | TINYINT UNSIGNED DEFAULT 23 | |

#### `auction_results` (pro Keyword & Stunde)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | BIGINT UNSIGNED AI PK | |
| `campaign_id` | FK → campaigns | |
| `keyword_id` | FK → keywords | |
| `hour` | TINYINT UNSIGNED (0-23) | |
| `bidder_type` | ENUM('player','competitor') | |
| `bidder_id` | INT | Spieler-User-ID oder Competitor-ID |
| `ad_rank` | DECIMAL(8,2) | max_cpc × quality_score |
| `impressions` | INT UNSIGNED | |
| `clicks` | INT UNSIGNED | |
| `cost` | DECIMAL(8,2) | Tatsächliche Kosten |
| `avg_position` | DECIMAL(3,1) | Durchschnittliche Position |

#### `hourly_stats` (Dashboard-aggregiert)
| Spalte | Typ |
|---|---|
| `campaign_id` | FK |
| `hour` | TINYINT |
| `impressions`, `clicks`, `cost` | Summen |
| `avg_position` | DECIMAL |
| `budget_remaining` | DECIMAL(8,2) |

#### `simulation_log`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `campaign_id` | FK | |
| `hour` | TINYINT | |
| `event_type` | VARCHAR(50) | 'budget_exhausted', 'position_change', 'cpc_change', 'competitor_outbid' |
| `message` | TEXT | Deutschsprachige Erklärung für den Azubi |

#### `scenarios` (Ausbilder-Steuerung)
| Spalte | Typ |
|---|---|
| `id` | TINYINT PK |
| `name` | VARCHAR(100) |
| `description` | TEXT |
| `config` | JSON (Competitor-Override, Budget-Vorgabe, Marktbedingungen) |

---

## 3. Die Simulations-Engine (Das mathematische Regelwerk)

Die Engine simuliert einen Tag in **24 diskreten Stunden-Schritten** (`h ∈ {0,1,…,23}`).

### 3.1 Stündliche Suchvolumen-Verteilung

Das tägliche Suchvolumen eines Keywords wird über eine realistische Sinus-Kurve verteilt:

```
Traffic-Anteil(h) = [
  0.010, 0.005, 0.005, 0.010, 0.020, 0.030,
  0.050, 0.060, 0.060, 0.050, 0.050, 0.050,
  0.050, 0.050, 0.040, 0.040, 0.050, 0.060,
  0.070, 0.080, 0.090, 0.080, 0.060, 0.030
]
```

$$
V_{\text{Tag}} = \frac{\text{Monatliches Suchvolumen}}{30,4}
$$
$$
\text{Suchvolumen}(h) = V_{\text{Tag}} \times \text{Traffic-Anteil}(h)
$$

### 3.2 Match-Type-Wirkung auf das Auktionsverhalten

Die Engine berücksichtigt, **welcher Match-Type** für ein Keyword eingestellt ist:

| Match-Type | Reichweite | CPC-Aufschlag | Wirkung auf Impressionen |
|---|---|---|---|
| **Broad** | Höchste | +20 % auf base_cpc | Keywords mit ähnlicher Bedeutung → mehr Impressionen |
| **Phrase** | Mittel | +0 % | Nur bei passender Wortgruppe |
| **Exact** | Geringste | −10 % | Nur bei exakter Übereinstimmung, höhere CTR |

Die Impressionen eines Keywords werden basierend auf dem Match-Type modifiziert:

$$
\text{Impressionen}_{\text{eff}}(h) = \text{Suchvolumen}(h) \times \text{Match-Faktor} \times \text{Impressions-Anteil(Position)}
$$

- **Broad**: Match-Faktor = 1.0 (maximale Reichweite)
- **Phrase**: Match-Faktor = 0.65
- **Exact**: Match-Faktor = 0.35

### 3.3 Die Anzeigenauktion (Ad Rank & CPC)

Für jede Stunde wird eine Auktion pro Keyword berechnet. Der Azubi tritt gegen **drei KI-Konkurrenten** an.

#### Standard-Konkurrenten

| Profil | Strategie | Max. CPC | QS | Budget | Aktiv (Uhrzeit) |
|---|---|---|---|---|---|
| **Der Riese** | Aggressiv / Marktführer | 2,20 € | 8 | Unbegrenzt | 00–24 |
| **Der Discounter** | Low-Budget / Frühanbieter | 0,60 € | 3 | 20,00 €/Tag | 06–10 (morgendliche Flutung) |
| **Der Smarte** | Qualitätsfokus | 1,30 € | 9 | 100,00 €/Tag | 08–22 |

#### Schritt A: Ad Rank berechnen

$$
\text{Ad Rank} = \text{Max. CPC} \times \text{Qualitätsfaktor}
$$

Alle Bieter werden nach Ad Rank absteigend sortiert. Der Höchstbietende erhält Position 1, der Zweite Position 2 usw.

#### Schritt B: Tatsächlichen CPC ermitteln (Google-Diskontierung)

$$
\text{CPC}_{\text{gezahlt}} = \frac{\text{Ad Rank des Unterlegenen}}{\text{Eigener Qualitätsfaktor}} + 0,01\ €
$$

**Beispiel:**
- Azubi: max. CPC = 1,50 €, QS = 6 → Ad Rank = 9,0
- Konkurrent (Zweitplatzierter): Ad Rank = 7,8
- Azubi zahlt: 7,8 / 6 + 0,01 € = **1,31 €**

> **Lerneffekt**: Ein hoher Qualitätsfaktor senkt den tatsächlichen CPC, selbst wenn das maximale Gebot hoch ist.

#### Schritt C: Kosten vom Budget abziehen

Nach jeder Stunde werden die anfallenden Kosten vom Tagesbudget abgezogen.

$$
\text{Budget}_{\text{neu}} = \text{Budget}_{\text{alt}} - \text{Kosten}(h)
$$

**Wenn Budget ≤ 0 € → Kampagne gestoppt**, Eintrag im `simulation_log`.

### 3.4 Qualitätsfaktor – Detaillierte Komponenten

Anders als im vereinfachten Konzept wird der Qualitätsfaktor aus drei Komponenten gebildet – genau wie bei Google Ads:

| Komponente | Einfluss auf QS | Beeinflussbar durch Azubi |
|---|---|---|
| **Erwartete Klickrate (CTR)** | Hoch | Keyword-Auswahl + Match-Type (Exact = höhere erwartete CTR) |
| **Anzeigenrelevanz** | Hoch | Keyword in Anzeigentext? (simuliert: QS-Komponente im Formular) |
| **Landingpage-Erfahrung** | Mittel | Auswahl "Schlecht / Durchschnittlich / Hervorragend" |

$$
\text{QS}_{\text{final}} = \text{Runde}\left(\frac{\text{CTR-Bewertung} + \text{Relevanz-Bewertung} + \text{LP-Bewertung}}{3}\right)
$$

Jede Komponente wird als `below_average` (1-3), `average` (4-7) oder `above_average` (8-10) gespeichert.

### 3.5 Intent-Modell – Die simulationsbestimmende Größe

Der **Intent eines Keywords** (transaktional, kommerziell, navigational, informational) ist keine statische Eigenschaft – er bestimmt **aktiv** das Verhalten der gesamten Auktion. Der Simulator unterscheidet vier Intent-Kategorien:

| Intent | Beispiele | Auswirkung auf Base-CPC | Auswirkung auf CTR | Auswirkung auf Conversion-Rate | Auswirkung auf QS-Komponenten |
|---|---|---|---|---|---|
| **Transactional** | „kaufen", „bestellen", „shop", „preis", „günstig" | **+40 %** (höhere Gebotsbereitschaft) | **+20 %** (Kaufwillige klicken häufiger) | **3,5 %** (hohe Kaufabsicht) | Erhöht „erwartete CTR" → besserer QS |
| **Commercial** | „vergleich", „test", „bewertung", „2026", „alternativen" | **+10 %** | **+5 %** | **0,8 %** (noch in Recherche) | Neutral |
| **Navigational** | „marke.de", „firmenname", „login", „homepage" | **−10 %** (Marken-Sucher sind günstiger) | **+30 %** (hohe Markenbindung) | **0,5 %** (Suchen meist die Seite, nicht Kauf) | Erhöht „erwartete CTR" |
| **Informational** | „was ist", „anleitung", „wie funktioniert", „ratgeber" | **−20 %** (niedrige Gebotsbereitschaft) | **−10 %** | **0,2 %** (reine Informationssuche) | Senkt „erwartete CTR" |

#### 3.5.1 Formeln mit Intent-Einfluss

$$
\text{CPC}_{\text{effektiv}} = \text{Max. CPC} \times \text{Intent-CPC-Faktor}
$$

$$
\text{CTR}_{\text{Position, Intent}} = \text{CTR}_{\text{Basis(Position)}} \times \text{Intent-CTR-Faktor}
$$

$$
\text{Conversion-Rate}_{\text{Intent}} = \text{Conversion-Rate}_{\text{Intent}}
$$

$$
\text{QS}_{\text{CTR-Komponente}} = \text{Intent-QS-Faktor}
$$

#### 3.5.2 Beispielrechnung mit Intent

Keyword: **„sneaker kaufen"** (transactional)
- Base-CPC = 0,95 € → CPC mit Intent: 0,95 € × 1,4 = **1,33 €**
- CTR bei Position 2 (Basis 6 %) → CTR mit Intent: 6 % × 1,2 = **7,2 %**
- Conversion-Rate = **3,5 %**
- QS-Komponente „erwartete CTR" → **above_average**

Keyword: **„was ist ein qualitätsfaktor"** (informational)
- Base-CPC = 0,30 € → CPC mit Intent: 0,30 € × 0,8 = **0,24 €**
- CTR bei Position 2 (Basis 6 %) → CTR mit Intent: 6 % × 0,9 = **5,4 %**
- Conversion-Rate = **0,2 %**
- QS-Komponente „erwartete CTR" → **below_average**

### 3.6 Impressionen- & Klick-Modell

Die pro Stunde generierten Impressionen hängen von der **Anzeigenposition** ab:

| Position | Impressions-Anteil | CTR (Basis) |
|---|---|---|
| 1 | 40-50 % | 10 % |
| 2 | 20-30 % | 6 % |
| 3 | 10-15 % | 3 % |
| 4+ | < 10 % | 1,5 % |

$$
\text{Klicks}(h) = \text{Impressionen}(h) \times \text{CTR}_{\text{Position, Intent}}
$$

$$
\text{Conversions}(h) = \text{Klicks}(h) \times \text{Conversion-Rate}_{\text{Intent}}
$$

---

## 4. Heuristik-Engine – Live-Einfügung unbekannter Keywords

**Kernprinzip:** Der Simulator kennt nie alle Keywords. Gibt ein Azubi ein Keyword ein, das nicht in der `keywords`-Tabelle existiert, wird es **zur Laufzeit** analysiert, klassifiziert, in die Datenbank eingefügt und sofort mit der Kampagne verknüpft – ohne Abbruch, ohne Fehlermeldung.

Dafür nutzt die Engine einen **hybriden Ansatz aus kostenlosen externen APIs** und einer lokalen Heuristik als Fallback.

### 4.1 Der DataSource Manager (Kostenlose + optionale LLM-API-Integrationen)

Der **DataSource Manager** koordiniert mehrere Datenquellen. Die ersten vier sind komplett kostenlos und API-key-frei:

| API | URL / Bibliothek | Nutzen im Simulator | Kosten |
|---|---|---|---|
| **Google Autocomplete (Suggest)** | `http://suggestqueries.google.com/complete/search?output=chrome&hl=de&q=...` | Liefert die 10 häufigsten verwandten Suchbegriffe in Echtzeit → bildet Keyword-Gruppen | ✅ Kostenlos, kein API-Key |
| **OpenThesaurus.de** | `https://www.openthesaurus.de/synonyme/search?q=...&format=application/json` | Deutsche Synonyme & Wortassoziationen → erkennt Intent auch bei unbekannten Wortvarianten (z.B. „erwerben" = „kaufen") | ✅ Kostenlos, kein API-Key |
| **Wikipedia Pageviews** | `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/de.wikipedia/all-access/all-agents/...` | Relative Popularität eines Begriffs → berechnet realistisches, fiktives Suchvolumen | ✅ Kostenlos, kein API-Key |
| **Spacy NLP (lokal)** | `pip install spacy` + `de_core_news_sm` | Lokale Sprachanalyse: Wortarten erkennen, Satzglieder zerlegen → Intent-Bestimmung ohne Netzwerk | ✅ Kostenlos, läuft lokal |
| **⭐ LLM (OpenAI / lokal via Ollama)** | OpenAI API / Ollama `/api/generate` | **Optional:** KI-gestützte Keyword-Analyse, intelligente Gruppenbildung, Intent-Erklärung für Azubis | ⚠️ Optional (API-Kosten bei OpenAI, kostenlos bei lokalem LLM) |

**Offline-Fallback:** Sind alle externen APIs nicht erreichbar (z.B. in abgeschotteten Schulnetzwerken), greift die Engine auf die rein lokale Heuristik (Abschnitt 4.4) zurück. Das LLM ist immer optional und wird nur genutzt, wenn ein API-Key oder ein lokales Modell konfiguriert ist.

### 4.2 Der vollständige Live-Einfügungs-Ablauf (mit API-Kette)

```
Azubi gibt Keyword ein (z.B. "vegane ledersneakers kaufen")
           │
           ▼
┌─────────────────────────────────┐
│ 1. Lookup in keywords-Tabelle    │
│ WHERE keyword = 'vegane          │
│ ledersneakers kaufen'            │
└─────────────┬───────────────────┘
           │
    ┌───────┴──────┐
    │  Gefunden?   │
    └──┬───┬──────┘
       │   │
      JA  NEIN
       │   │
       │   ▼
       │  ┌──────────────────────────────────────────────┐
       │  │ 2a. Google Autocomplete API (parallel)        │
       │  │    GET suggestqueries.google.com/...?q=vegane │
       │  │    ledersneakers kaufen                      │
       │  │    → 10 verwandte Keywords (z.B. „vegane      │
       │  │      sneaker kaufen", „vegane lederschuhe",  │
       │  │      „nachhaltige sneaker herren", …)        │
       │  └──────────────────────┬───────────────────────┘
       │                         │
       │  ┌──────────────────────────────────────────────┐
       │  │ 2b. OpenThesaurus API (parallel)              │
       │  │    Jedes Wort auf Intent-Signale prüfen:      │
       │  │    • „vegane" → kein Signal                   │
       │  │    • „ledersneakers" → Openthesaurus:         │
       │  │      verwandt mit „Schuhe", „Treter"          │
       │  │    • „kaufen" → Openthesaurus:                │
       │  │      Synonyme: „erwerben", „bestellen",       │
       │  │      „order" → MATCH! transactional           │
       │  └──────────────────────┬───────────────────────┘
       │                         │
       │  ┌──────────────────────────────────────────────┐
       │  │ 2c. Wikipedia Pageviews API (parallel)        │
       │  │    GET /pageviews/de.wikipedia/Sneaker        │
       │  │    → 12.500 Aufrufe/Monat                     │
       │  │    GET /pageviews/de.wikipedia/Lederschuh     │
       │  │    → 1.800 Aufrufe/Monat                      │
       │  │    → Relatives Verhältnis: 7:1                │
       │  │    → Geschätztes Suchvolumen: ~8.200/Monat    │
       │  └──────────────────────┬───────────────────────┘
       │                         │
       │  ┌──────────────────────────────────────────────┐
       │  │ 2d. DataSource Manager wertet aus:            │
       │  │    • Intent: transactional (von OpenThesaurus  │
       │  │      bestätigt: "kaufen" + Synonyme)           │
       │  │    • Keyword-Gruppe: aus Autocomplete-Daten   │
       │  │      → Gruppe „Vegane Schuhe" anlegen         │
       │  │    • Suchvolumen: 8.200/Monat (Wikipedia)    │
       │  │    • Base-CPC: 0,95€ × 1,4 (transactional)   │
       │  │                                             │
       │  │    ⚠ Falls API nicht antwortet (>2s Timeout): │
       │  │    → Fallback auf lokale Heuristik (4.4)     │
       │  └──────────────────────┬───────────────────────┘
       │                         │
       │                         ▼
       │  ┌──────────────────────────────────────────────┐
       │  │ 3. INSERT INTO keywords                      │
       │  │    + Google Autocomplete-Ergebnisse als       │
       │  │      verwandte Keywords in keyword_group_members│
       │  └──────────────────────┬───────────────────────┘
       │                         │
       │  ┌──────────────────────────────────────────────┐
       │  │ 4. INSERT INTO campaign_keywords              │
       │  │    (generated_by_heuristic=true)              │
       │  └──────────────────────┬───────────────────────┘
       │                         │
       │                         ▼
       │  ┌──────────────────────────────────────────────┐
       │  │ 5. Fertig! Keyword + Gruppe + Verwandte      │
       │  │    sind ab sofort im Pool verfügbar           │
       │  └──────────────────────────────────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Kampagne starten  │
  │ / Simulation      │
  └──────────────────┘
```

### 4.3 DataSource API-Details

#### 4.3.1 Google Autocomplete – Keyword-Vorschläge & Gruppenbildung

```typescript
// server/src/services/datasource/google-autocomplete.ts
async function fetchRelatedKeywords(seed: string): Promise<string[]> {
    const url = `http://suggestqueries.google.com/complete/search`
        + `?output=chrome&hl=de&q=${encodeURIComponent(seed)}`;

    const response = await fetch(url, {
        headers: { 'User-Agent': 'SEA-AdArena-Simulator/1.0' },
        signal: AbortSignal.timeout(2000)  // 2s Timeout
    });

    const data = await response.json();   // [query, [suggestion1, suggestion2, ...]]
    return data[1] as string[];           // Top 10 verwandte Suchbegriffe
}

// Beispiel: fetchRelatedKeywords("vegane ledersneakers kaufen")
// → [
//     "vegane sneaker kaufen",
//     "vegane lederschuhe damen",
//     "nachhaltige sneaker herren",
//     "vegane schuhe online bestellen",
//     "vegane sneaker damen sale",
//     ...
//   ]
```

**Gruppenbildung aus den Vorschlägen:** Die Ergebnisse werden analysiert und zu einer neuen Gruppe zusammengefasst:

```typescript
// Aus den Autocomplete-Ergebnissen eine sinnvolle Gruppe ableiten
function deriveGroupName(suggestions: string[], originalKeyword: string): string {
    // 1. Häufigstes gemeinsames Substring-Muster finden
    //    → z.B. alle enthalten "vegan" → Gruppe "Vegane Schuhe"

    // 2. Fallback: erste Worthälfte des Original-Keywords
    //    → "vegane ledersneakers" → "Vegane Ledersneaker"

    // 3. Äußerster Fallback: "Sonstige Keywords"
    return groupName;
}
```

#### 4.3.2 OpenThesaurus – Intent-Validierung & Synonym-Erkennung

```typescript
// server/src/services/datasource/openthesaurus.ts
async function fetchSynonyms(word: string): Promise<string[]> {
    const url = `https://www.openthesaurus.de/synonyme/search`
        + `?q=${encodeURIComponent(word)}&format=application/json`;

    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    const data = await response.json();

    // Extrahiere alle Synonyme aus der Antwort
    const synsets = data.synsets || [];
    return synsets.flatMap(s => s.terms.map(t => t.term));
}

// Beispiel: fetchSynonyms("erwerben")
// → ["kaufen", "anschaffen", "erstehen", "einkaufen", "ordern", ...]

// Intent-Erkennung via Synonym-Kette:
// "erwerben" → OpenThesaurus → ["kaufen", ...]
// "kaufen" → Match in Intent-Signalwort-Tabelle → transactional ✓
```

**Vorteil gegenüber reiner Signalwort-Liste:** Auch seltene oder umgangssprachliche Varianten werden erkannt (z.B. „sich zulegen", „klarmachen", „schießen" für Kaufabsicht).

#### 4.3.3 Wikipedia Pageviews – Relatives Suchvolumen

```typescript
// server/src/services/datasource/wikipedia-pageviews.ts
async function fetchPageviews(term: string): Promise<number> {
    const article = term.charAt(0).toUpperCase() + term.slice(1);
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews`
        + `/per-article/de.wikipedia/all-access/all-agents`
        + `/${encodeURIComponent(article)}/monthly/${getLastMonth()}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });

    if (!response.ok) return fallbackVolume(term);  // Wikipedia-Seite existiert nicht

    const data = await response.json();
    const totalViews = data.items?.reduce((sum, item) => sum + item.views, 0) || 0;

    return totalViews;
}

async function estimateSearchVolume(keyword: string): Promise<number> {
    // 1. Hauptbegriff extrahieren (z.B. "vegane ledersneakers" → "sneaker")
    const mainTerm = extractMainTerm(keyword);

    // 2. Wikipedia-Aufrufe abrufen
    const pageviews = await fetchPageviews(mainTerm);

    // 3. Umrechnung: Wikipedia-Aufrufe → Suchvolumen
    //    (Erfahrungswert: 1 Wikipedia-Abruf ≈ 5-15 Google-Suchen)
    const multiplier = 8 + Math.random() * 7;  // 8-15x
    let estimatedVolume = Math.round(pageviews * multiplier);

    // 4. Long-Tail-Korrektur
    if (countWords(keyword) >= 4) {
        estimatedVolume = clamp(estimatedVolume, 30, 150);
    }

    return estimatedVolume;
}

// Beispiel: estimateSearchVolume("vegane ledersneakers kaufen")
// 1. Hauptbegriff: "sneaker"
// 2. Wikipedia: "Sneaker" → 12.500 Aufrufe/Monat
// 3. 12.500 × 11 (zufälliger Multiplikator) = 137.500
//    → Aber Long-Tail (4 Wörter) → gedeckelt auf 30-150
//    → Geschätztes Suchvolumen: ~120/Monat ← realistisch für Long-Tail!
```

**Warum das funktioniert:** Die Wikipedia-Aufrufzahlen korrelieren stark mit dem tatsächlichen Suchinteresse, ohne dass echte Google-Daten benötigt werden. Der Multiplikator variiert leicht, sodass keine exakten Echtdaten reproduziert werden.

#### 4.3.4 Spacy NLP (Lokal) – Grammatikalische Intent-Erkennung

Für Umgebungen ohne externen API-Zugriff (Schulnetzwerke, offline):

```typescript
// server/src/services/datasource/local-nlp.ts
// Nutzt Spacy (Python) via child_process oder kompiliertes WASM-Modul

/*
  Python-Beispiel (spacy):
  -------------------------
  import spacy
  nlp = spacy.load("de_core_news_sm")

  doc = nlp("wo kann ich sneaker kaufen")
  for token in doc:
      print(token.text, token.pos_, token.dep_)
      # "wo"     ADV    → Fragewort → informational
      # "kann"   VERB   → Modalverb
      # "ich"   PRON   → Pronomen
      # "sneaker" NOUN  → Produkt
      # "kaufen" VERB  → Verb → transactional

  Intent = transactional (Verb "kaufen" hat höheres Gewicht als Fragewort "wo")
*/
```

**Im Simulator integriert via:** Node.js ruft ein schlankes Python-Skript per `child_process.exec()` auf, oder nutzt eine reine JS-NLP-Bibliothek (z.B. `compromise` mit deutschen Erweiterungen).

#### 4.3.5 ⭐ LLM-Integration (optional – OpenAI / lokales Modell)

Ein Large Language Model (LLM) kann als **optionale qualitative Verstärkung** zugeschaltet werden. Es ersetzt keine der kostenlosen APIs, sondern **veredelt** deren Ergebnisse:

| Aufgabenbereich | Was das LLM macht | Nutzen |
|---|---|---|
| **Keyword-Gruppierung** | Analysiert 10+ rohe Keyword-Vorschläge und bildet thematische Cluster | Präzisere Gruppen als reine Autocomplete-Analyse |
| **Intent-Begründung** | Erklärt, warum ein Keyword einen bestimmten Intent hat (für Azubi-Lerneffekt) | Verständliche Lerninhalte statt „weil Signalwort X" |
| **Suchvolumen-Plausibilisierung** | Prüft, ob das geschätzte Volumen zum Keyword passt | Realistischere Werte |
| **Synonym-Erweiterung** | Generiert weitere sinnvolle Keyword-Varianten | Größerer Keyword-Pool |
| **Gruppen-Beschreibung** | Schreibt eine menschenlesbare Beschreibung für Keyword-Gruppen | Bessere UX im Keyword-Planer |

**Unterstützte LLM-Backends:**

| Backend | Konfiguration | Kosten |
|---|---|---|
| **OpenAI (GPT-4o / GPT-4o-mini)** | `LLM_PROVIDER=openai` + `OPENAI_API_KEY=sk-...` | ⚠️ Pay-per-Token (ca. 0,15–5 €/Monat bei typischer Nutzung) |
| **Ollama (lokal, z.B. Llama 3, Mistral)** | `LLM_PROVIDER=ollama` + `OLLAMA_BASE_URL=http://localhost:11434` | ✅ Kostenlos, läuft lokal |
| **Anthropic Claude** | `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=...` | ⚠️ Pay-per-Token |

**Deaktiviert im Standard:** Ohne Konfiguration (`LLM_PROVIDER=` leer) überspringt der DataSource Manager das LLM und liefert die Ergebnisse der kostenlosen APIs + lokaler Heuristik.

```typescript
// server/src/services/datasource/llm.ts
// Beispiel: LLM-gestützte Keyword-Gruppierung

interface LLMKeywordAnalysis {
    groupName: string;
    suggestedKeywords: string[];
    intent: IntentCategory;
    intentReason: string;       // Für Azubi-Lernanzeige
    volumePlausibility: 'plausible' | 'too_high' | 'too_low';
}

const SYSTEM_PROMPT = `
Du bist ein SEA-Experte (Search Engine Advertising) für den deutschen Markt.
Analysiere das folgende Keyword und seine Google Autocomplete-Vorschläge.

1. Finde einen präzisen Gruppennamen für diese Keyword-Liste
2. Bestimme den dominierenden Search-Intent: transactional, commercial, navigational oder informational
3. Begründe kurz auf Deutsch, warum dieser Intent vorliegt
4. Gib an, ob das geschätzte Suchvolumen plausibel erscheint
5. Schlage 2-3 weitere sinnvolle Keywords vor, die in die Gruppe passen

Antworte NUR im JSON-Format.
`;

async function analyzeWithLLM(
    keyword: string,
    suggestions: string[],
    estimatedVolume: number,
    detectedIntent: string
): Promise<LLMKeywordAnalysis | null> {

    if (!isLLMConfigured()) return null;  // LLM ist optional

    const prompt = `
        Original-Keyword: "${keyword}"
        Google-Vorschläge: ${suggestions.join(', ')}
        Geschätztes Suchvolumen: ${estimatedVolume}
        Vorläufiger Intent: ${detectedIntent}
    `;

    try {
        const response = await callLLM(SYSTEM_PROMPT, prompt);
        return JSON.parse(response);
    } catch (error) {
        console.warn('LLM nicht verfügbar, verwende Standard-Ergebnisse');
        return null;  // LLM-Fehler = kein Abbruch
    }
}

// Beispiel-Response des LLM:
// {
//   "groupName": "Vegane Sneaker & Lederschuhe",
//   "suggestedKeywords": [
//     "vegane ledersneaker kaufen",
//     "nachhaltige turnschuhe herren",
//     "tierversuchsfreie sneaker damen"
//   ],
//   "intent": "transactional",
//   "intentReason": "Das Wort 'kaufen' und 'bestellen' in den Vorschlägen zeigt klare Kaufabsicht. 
//                    Die Zielgruppe sucht spezifisch nach Produkten zum Erwerb.",
//   "volumePlausibility": "plausible"
// }
```

**Integration in den Ablauf:**

```
2a. Google Autocomplete → 10 Vorschläge
2b. OpenThesaurus → Intent
2c. Wikipedia → Volumen
    │
    └── ⭐ 2d. LLM (optional, falls konfiguriert)
         ├─ Nimmt Ergebnisse aus 2a-2c
         ├─ Verfeinert Gruppenname & Intent-Begründung
         ├─ Ergänzt 2-3 weitere Keyword-Ideen
         └─ Liefert menschenlesbare Erklärung für Azubi
    │
    └── 2e. DataSource Manager aggregiert alle Ergebnisse
```

**Fallback-Verhalten:** Ist das LLM nicht konfiguriert, nicht erreichbar oder liefert eine fehlerhafte JSON-Antwort, werden die Ergebnisse der kostenlosen APIs (2a-2c) unverändert verwendet. Kein Abbruch, keine Verzögerung.

### 4.4 Die lokale Heuristik (Fallback, wenn APIs offline)

Sollten alle externen APIs nicht erreichbar sein (Timeout > 2s) oder in einer abgeschotteten Umgebung, greift die Engine auf die lokale Heuristik zurück:

#### 4.4.1 Wortanzahl-Analyse (Long-Tail-Erkennung)

| Wortanzahl | Geschätztes Suchvolumen | CTR-Multiplikator | Typische Intent-Klasse |
|---|---|---|---|
| **1 Wort** | 5.000 – 15.000 | ×1,0 | Meist commercial oder navigational |
| **2 Wörter** | 1.000 – 8.000 | ×1,0 | Beliebig |
| **3 Wörter** | 100 – 800 | ×1,5 | Häufig transactional |
| **4+ Wörter** | 30 – 150 | **×2,5** (Long-Tail-Phänomen) | Meist transactional |

#### 4.4.2 Intent-Klassifikation (Suffix/Präfix-Analyse)

Die Engine durchsucht das Keyword nach Signalwörtern, um den **Intent** zu bestimmen:

| Signalwörter | Klassifizierter Intent | Base-CPC-Faktor | Conversion-Rate |
|---|---|---|---|
| `kaufen`, `bestellen`, `kauf`, `order`, `shop`, `günstig`, `preis`, `rabatt`, `angebot`, `sale`, `lieferung` | **transactional** | ×1,4 | 3,5 % |
| `vergleich`, `test`, `bewertung`, `erfahrung`, `alternativ`, `beste`, `top`, `2026`, `2025`, `empfehlung` | **commercial** | ×1,1 | 0,8 % |
| `marke`, `firma`, `.de`, `login`, `homepage`, `seite`, `anmelden`, `registrieren` | **navigational** | ×0,9 | 0,5 % |
| `was ist`, `anleitung`, `wie funktioniert`, `ratgeber`, `erklärung`, `kurs`, `tutorial`, `definition`, `bedeutung`, `wiki` | **informational** | ×0,8 | 0,2 % |
| *Keine Signalwörter gefunden* | **commercial** (Default) | ×1,0 | 0,8 % |

**Mehrere Signalwörter gefunden?** Die Engine verwendet eine Gewichtung:
- Enthält das Keyword sowohl `kaufen` (transactional, Gewicht 3) als auch `vergleich` (commercial, Gewicht 2), gewinnt **transactional** (höheres Gewicht).
- Bei Gleichstand gewinnt der spezifischere Intent (transactional > commercial > navigational > informational).

#### 4.4.3 Base-CPC-Schätzung

$$
\text{Base-CPC}_{\text{geschätzt}} = \text{Zufall}(0,30\€, 2,50\€) \times \text{Intent-CPC-Faktor} \times \text{Long-Tail-Faktor}
$$

- Long-Tail (4+ Wörter): Faktor 0,6 (Long-Tail-Keywords sind günstiger)
- Kurze Keywords (1-2 Wörter): Faktor 1,0

#### 4.4.4 Competition-Level

| Intent | Typischer Wettbewerb |
|---|---|
| transactional | `high` (viele Bieter) |
| commercial | `medium` |
| navigational | `low` (Markeninhaber dominiert) |
| informational | `low` (weniger Bieter) |

#### 4.4.5 Seasonality-Defaults

Neu eingefügte Keywords erhalten Standard-Saisonalitätsfaktoren `[1,0, 1,0, …, 1,0]` (keine Saisonalität). Ausbilder können diese später im Admin-Panel anpassen.

### 4.5 Datenbank-Rückfall

Fehlende Keywords werden in `keywords` mit diesen Werten angelegt:

```sql
INSERT INTO keywords (
    keyword, monthly_search_volume, base_cpc,
    intent_category, intent_source, competition_level,
    seasonality_factors, heuristic_data
) VALUES (
    'vegane ledersneakers kaufen',
    120,                        -- Long-Tail: niedriges Volumen
    0.84,                       -- Base-CPC geschätzt
    'transactional',            -- Klassifiziert durch Signalwort "kaufen"
    'heuristic',                -- Markierung: live generiert
    'high',                     -- Transactional → hoher Wettbewerb
    '[1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0]',
    JSON_OBJECT(
        'word_count', 3,
        'signals', JSON_ARRAY('kaufen'),
        'matched_intent', 'transactional',
        'cpc_factor', 1.4,
        'long_tail_factor', 0.6
    )
);
```

**Wichtig:** Der `INSERT` verwendet `ON DUPLICATE KEY UPDATE` oder prüft vorab auf Existenz, damit keine Duplikate entstehen. Das Keyword ist ab sofort fester Bestandteil des Pools und wird bei erneuter Eingabe sofort im Lookup gefunden (Schritt 1 im Ablauf).

### 4.6 Konfiguration im Admin-Panel

Der Ausbilder kann im Admin-Panel steuern, welche Datenquellen aktiv sind:

```
┌──────────────────────────────────────────────────────────────┐
│  Admin → Datenquellen                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Externe APIs:                                               │
│  ☑ Google Autocomplete (Keyword-Vorschläge)                  │
│  ☑ OpenThesaurus (Intent-Erkennung)                          │
│  ☑ Wikipedia Pageviews (Suchvolumen)                         │
│  ☐ Lokale Heuristik (immer als Fallback aktiv)               │
│                                                              │
│  ⭐ LLM (optional, verbessert Qualität):                     │
│  ( ) Deaktiviert (Standard)                                  │
│  ( ) OpenAI      API-Key:  [ sk-........................ ]  │
│      Modell: [ GPT-4o-mini ✔️ ]   Max. Tokens: [ 500 ]      │
│  ( ) Ollama (lokal)  URL: [ http://localhost:11434 ]         │
│      Modell: [ llama3 ✔️ ]                                   │
│                                                              │
│  Timeout: [ 2000 ] ms  │  Cache-Dauer: [ 24 ] h             │
│                                                              │
│  Status:  🟢 Alle APIs verfügbar                             │
│           ⭐ LLM: Nicht konfiguriert (optional)              │
│           Letzter Test: heute 14:32 Uhr                      │
│                                                              │
│  [ JETZT TESTEN ]           [ ÄNDERUNGEN SPEICHERN ]         │
└──────────────────────────────────────────────────────────────┘
```

**Konfiguration via Umgebungsvariablen (.env):**

```bash
# LLM-Konfiguration (optional – ohne läuft alles über kostenlose APIs)
LLM_PROVIDER=              # Leer = deaktiviert | "openai" | "ollama" | "anthropic"
OPENAI_API_KEY=            # sk-... (nur bei provider=openai)
OLLAMA_BASE_URL=           # http://localhost:11434 (nur bei provider=ollama)
LLM_MODEL=                 # "gpt-4o-mini" | "llama3" | "claude-3-haiku"
LLM_MAX_TOKENS=500
```

---

## 5. Keyword-Planer (Keyword-Ideen + Gruppen)

Wie der echte Google Keyword Planner hilft der simulierte Planer dem Azubi dabei, **neue Keyword-Ideen zu entdecken** – basierend auf einem Seed-Keyword, einer Gruppe oder einem Thema. Der Planer durchsucht die bestehenden Keyword-Gruppen und schlägt verwandte Keywords mit geschätztem Suchvolumen, CPC und Intent vor.

### 5.1 Die Datenbasis: Keyword-Gruppen (Cluster)

Der gesamte Keyword-Pool ist in **thematische Gruppen** organisiert. Jede Gruppe bündelt zusammengehörige Keywords und bildet eine Hierarchie:

```
Schuhe (Obergruppe)
├── Sneaker
│   ├── sneaker kaufen (transactional)
│   ├── sneaker günstig (transactional)
│   ├── weiße sneaker damen (commercial)
│   └── ... (weitere via Heuristik)
├── Laufschuhe
│   ├── laufschuhe herren (commercial)
│   ├── laufschuhe kaufen (transactional)
│   └── ...
├── Wanderschuhe
│   ├── günstige wanderschuhe (transactional)
│   ├── wassergeschützte wanderschuhe (commercial)
│   └── ...
├── Barfußschuhe
│   ├── barfußschuhe kinder (transactional)
│   └── ...
└── ...
```

**Gruppen-Hierarchie in der Datenbank (`keyword_groups.parent_group_id`):**

| id | name | parent_group_id | default_intent | icon |
|---|---|---|---|---|
| 1 | Schuhe | NULL | commercial | 👟 |
| 2 | Sneaker | 1 (→ Schuhe) | transactional | 👟 |
| 3 | Laufschuhe | 1 (→ Schuhe) | commercial | 🏃 |
| 4 | Wanderschuhe | 1 (→ Schuhe) | transactional | 🥾 |
| 5 | Barfußschuhe | 1 (→ Schuhe) | transactional | 🦶 |
| 6 | Marken | NULL | navigational | ®️ |
| 7 | Nike | 6 (→ Marken) | navigational | ✔️ |
| 8 | adidas | 6 (→ Marken) | navigational | ⬛ |

### 5.2 So funktioniert der Keyword-Planer im Simulator

Der Azubi öffnet den **Keyword-Planer** (Menüpunkt „Einblicke" → „Keyword-Planer") und gibt ein Seed-Keyword oder eine Gruppe ein.

```
┌──────────────────────────────────────────────────────────┐
│  Keyword-Planer                               [NEU]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Seed-Keyword oder Gruppe: [ sneaker               🔍 ]  │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Gruppe: Sneaker (👟) – 8 Keywords                   ││
│  │  ──────────────────────────────────────────────────── ││
│  │  Keyword-Vorschlag    | Ø Suchvolumen | CPC (∅) | Intent│
│  │  ─────────────────────┼───────────────┼─────────┼──────│
│  │  sneaker kaufen       │ 18.000        │ 1,33 €   │ 🛒  │
│  │  sneaker günstig      │ 8.200         │ 1,19 €   │ 🛒  │
│  │  weiße sneaker damen  │ 4.100         │ 0,95 €   │ 🔍  │
│  │  sneaker herren 2026  │ 2.900         │ 1,10 €   │ 🔍  │
│  │  ...                  │ ...           │ ...      │ ... │
│  │  ─────────────────────┴───────────────┴─────────┴──────│
│  │  [➕ Zur Kampagne hinzufügen]                          │
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Verwandte Gruppen:                                  ││
│  │  🏃 Laufschuhe  |  🥾 Wanderschuhe  |  🦶 Barfußschuhe│
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 5.3 Planer-Logik (Such-Algorithmus)

```
Azubi gibt Seed-Keyword „sneaker" ein
           │
           ▼
┌─────────────────────────────────┐
│ 1. Ist „sneaker" ein Gruppenname? │
│    → JA: Finde Gruppe „Sneaker"   │
│    → NEIN: Suche Keywords, die    │
│      „sneaker" enthalten          │
└─────────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 2. Finde alle Mitglieder dieser  │
│    Gruppe (keyword_group_members)│
│    + alle Keywords, die das     │
│    Seed-Wort enthalten           │
└─────────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 3. Für jeden Vorschlag:          │
│    • Hole Suchvolumen            │
│    • Berechne CPC mit Intent     │
│    • Zeige Intent-Icon           │
│    • Sortiere nach Relevanz      │
└─────────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 4. Finde verwandte Gruppen       │
│    (gleiche parent_group_id      │
│     oder Überschneidungen)       │
└─────────────┬───────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ 5. Vorschläge an Frontend        │
│    + „Zur Kampagne hinzufügen"   │
└─────────────────────────────────┘
```

### 5.4 Intent-Vererbung in Gruppen

Nicht jedes Keyword hat einen eigenen Intent. Der Planer verwendet folgende Priorität:

```
1. Eigener Intent des Keywords (falls vorhanden)
2. Default-Intent der primären Gruppe (keyword_groups.default_intent)
3. Default-Intent der Obergruppe (keyword_groups.parent_group_id → default_intent)
4. Fallback: 'commercial'
```

**Beispiel:**
- Keyword `sneaker günstig` hat keinen eigenen Intent in `intent_category`
- Es ist Mitglied der Gruppe `Sneaker` (default_intent = `transactional`)
- → Intent = **transactional** (von Gruppe geerbt)
- Base-CPC = Basis × 1,4 (transactional-Faktor)

### 5.5 Gruppen-Verwaltung im Admin-Panel

Der Ausbilder kann im Admin-Panel:
- Neue Gruppen anlegen (z.B. „Kinderbekleidung")
- Gruppen hierarchisch verschachteln
- Keywords per Drag & Drop in Gruppen verschieben
- Default-Intents pro Gruppe setzen
- Heuristisch generierte Keywords automatisch einer passenden Gruppe zuordnen (via Signalwort-Matching)

```
┌──────────────────────────────────────────────────────────┐
│  Admin → Keyword-Gruppen                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Gruppen-Struktur:                                       │
│  📁 Schuhe (commercial)                                  │
│  │  👟 Sneaker (transactional)                          │
│  │  🏃 Laufschuhe (commercial)                          │
│  │  🥾 Wanderschuhe (transactional)                    │
│  │  🦶 Barfußschuhe (transactional)                    │
│  📁 Marken (navigational)                                │
│  │  ✔️ Nike (navigational)                              │
│  │  ⬛ adidas (navigational)                            │
│                                                          │
│  [Neue Gruppe]  [Gruppe bearbeiten]  [Keywords verwalten]│
└──────────────────────────────────────────────────────────┘
```

### 5.6 Heuristik + Gruppen: Automatische Zuordnung

Wird ein neues Keyword via Heuristik-Engine live eingefügt, versucht der Simulator automatisch, es einer passenden Gruppe zuzuordnen:

```javascript
// Pseudocode der automatischen Gruppenzuordnung
function assignToGroup(keyword, detectedIntent) {
    // 1. Enthält das Keyword einen Gruppe-Namen?
    for (group of keywordGroups) {
        if (keyword.includes(group.name.toLowerCase())) {
            return group.id;  // z.B. "barfußschuhe vegan" → Gruppe "Barfußschuhe"
        }
    }

    // 2. Intent-basierte Zuordnung?
    //    „kaufen" + kein Gruppentreffer → „Allgemein (transactional)"

    // 3. Fallback: „Sonstige Keywords"
    return fallbackGroupId;
}
```

### 5.7 API-Endpunkte für den Keyword-Planer

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/keyword-planner/ideas?seed=...` | Keyword-Ideen zu einem Seed-Begriff |
| `GET` | `/api/keyword-planner/groups` | Alle Gruppen + Hierarchie |
| `GET` | `/api/keyword-planner/groups/:id` | Keywords einer Gruppe |
| `GET` | `/api/keyword-planner/groups/:id/stats` | Gruppen-Statistiken (Ø CPC, Gesamt-Volumen) |

---

## 6. Benutzeroberfläche (Google-Ads-Inspiriert)

Die UI lehnt sich stark an das echte Google Ads Design an:

### 5.1 Navigation (Seitenmenü links)

```
┌─────────────────┬──────────────────────────────────────┐
│  SEA-AdArena    │  [Kampagnen]  [Einblicke]  [Berichte]│
│                 │                                      │
│  ⚙ Kampagnen   │  + Neue Kampagne  |  🔍  Keyword-    │
│  📊 Einblicke   │     Planer                           │
│    🔍 Planer   │  ┌──────────────────────────────────┐ │
│  📋 Berichte    │  │ Kampagne      Budget  Status     │ │
│  👥 Admin       │  │ Schuh-Suche   29,60€  ▶ Aktiv   │ │
│  (nur Admin)    │  │ Laufschuhe    15,00€  ⏸ Pausiert│ │
│                 │  └──────────────────────────────────┘ │
│  👤 Azubi M.    │                                      │
└─────────────────┴──────────────────────────────────────┘
```

### 5.2 Kampagnen-Editor (Tab-basiert)

```
┌──────────────────────────────────────────────────────────┐
│ [Einstellungen] [Keywords] [Anzeigen] [Gebote]           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Kampagnenname:  Online-Schuhshop_Brand_Suche           │
│                                                          │
│  Netzwerk:  (●) Suchnetzwerk  ( ) Such- + Displaynetzwerk│
│                                                          │
│  Budget:    Monatsbudget: [  900,00 € ]                  │
│             → Tagesbudget:  29,60 €                      │
│                                                          │
│  Gebotsstrategie:                                        │
│  (●) Manueller CPC                                      │
│  ( ) Conversions maximieren                              │
│                                                          │
│  Anzeigenauslieferung:  (●) Standard  ( ) Beschleunigt   │
│                                                          │
│  Landingpage-Erfahrung:                                  │
│  ( ) Schlecht  (●) Durchschnittlich  ( ) Hervorragend    │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Keyword-Editor (Match-Type-Auswahl)

```
┌──────────────────────────────────────────────────────────┐
│  Keywords einbuchen (eines pro Zeile):                   │
│  ┌──────────────────────────────────────────────────────┐│
│  │ sneaker kaufen                                      ││
│  │ laufschuhe günstig online                           ││
│  │ [weitere Keywords...]                               ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  Standard-Match-Type für diese Keywords:                 │
│  ( ) Broad  (●) Phrase  ( ) Exact                       │
│                                                          │
│  Max. CPC-Gebot (Standard): [ 1,50 ] €                   │
│                                                          │
│  [ KEYWORDS SPEICHERN ]              [ KAMPAGNE STARTEN ]│
└──────────────────────────────────────────────────────────┘
```

### 5.4 Live-Performance-Dashboard

Nach dem Klick auf „Kampagne starten" erscheint das Dashboard:

```
┌──────────────────────────────────────────────────────────┐
│  Kampagne: Online-Schuhshop_Brand_Suche                  │
│  Status:  ⚠️  Durch Budget begrenzt (Gestoppt um 15:12)  │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│ │ 4.210     │ │ 252      │ │ 0,94 €   │ │ 29,60 €      │ │
│ │ Impressions│ │ Klicks   │ │ Ø CPC    │ │ Gesamtkosten │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐              │
│ │ Ø 2.1    │ │ 3,2 %    │ │ 8 Conv.      │              │
│ │ Position │ │ Ø CTR    │ │ (3,17 %)     │              │
│ └──────────┘ └──────────┘ └──────────────┘              │
├──────────────────────────────────────────────────────────┤
│  Klicks & Ausgaben im Zeitverlauf                        │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Klicks ^         ┌──┐                               ││
│  │        │     ┌──┐ │  │        ┌──┐                   ││
│  │        │  ┌──┤  │ │  │  ┌──┐  │  │                   ││
│  │        │  │  │  │ │  │  │  │  │  │  Budgetgrenze →   ││
│  │        └──┴──┴──┴─┴──┴──┴──┴──┴──┴───────────────────││
│  │        02 04 06 08 10 12 14 16 18 20 22             ││
│  └──────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│  Auktionsdaten & Konkurrenz-Vergleich                    │
│                                                          │
│  Rang | Bieter          | Ad Rank | Ø Position | Kosten  │
│  ─────┼─────────────────┼─────────┼────────────┼─────────│
│  1.   │ Der Riese       │ 17,6    │ 1,0        │ 420 €   │
│  2.   │ IHR ACCOUNT     │ 9,0     │ 2,1        │ 29,60 € │
│  3.   │ Der Smarte      │ 7,8     │ 2,9        │ 18,40 € │
│  4.   │ Der Discounter  │ 1,8     │ 4,2        │ 5,10 €  │
├──────────────────────────────────────────────────────────┤
│  [Kampagne neu starten]  [Als Szenario speichern]        │
└──────────────────────────────────────────────────────────┘
```

### 5.5 Admin-Panel (Ausbilder)

```
┌──────────────────────────────────────────────────────────┐
│  Admin-Panel  ─  Azubi-Übersicht                         │
├──────────────────────────────────────────────────────────┤
│  Azubi        | Kampagnen | Budget gesamt | Status      │
│  ─────────────┼───────────┼───────────────┼─────────────│
│  Max Muster   │ 3         │ 87 €          │ 🟢 Aktiv    │
│  Lisa Beispiel│ 1         │ 29,60 €       │ 🔴 Fehler   │
│  ...          │           │               │             │
├──────────────────────────────────────────────────────────┤
│  Marktbedingungen bearbeiten:                            │
│  ☑ Der Riese aktiv    ☐ Budget begrenzen auf [  ] €     │
│  ☑ Der Discounter aktiv  ☐ Ad Scheduling anpassen       │
│  ☑ Der Smarte aktiv       ☐ Base-CPC erhöhen (×[1.5])  │
│                                                          │
│  [ ÄNDERUNGEN ÜBERNEHMEN ]                               │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Didaktische Szenarien

### Szenario A: Der klassische Anfängerfehler (Überoptimierung)

**Briefing für den Azubi:**
> „Wir haben einen neuen Kunden im Bereich Sneaker. Bringe uns sofort auf Platz 1 bei Google für das Keyword `sneaker kaufen`. Hier ist dein Monatsbudget von 300 € (9,86 € / Tag)."

**Typische Reaktion:** Setzt das max. CPC-Gebot auf 3,50 €, um die Konkurrenz zu überbieten.

**Ergebnis im Simulator:** Perfekte Position 1, aber bereits um 09:15 Uhr nach exakt 2 Klicks wegen Budgeterschöpfung gesperrt.

**Lerneffekt:** Spitzenpositionen sind nutzlos, wenn das Tagesbudget nicht ausreicht, um über den Tag verteilt Klicks einzusammeln.

---

### Szenario B: Der Hebel des Qualitätsfaktors

**Briefing:**
> „Unsere Kampagne läuft stabil auf Position 3. Wir zahlen aktuell 1,10 € pro Klick. Optimiere die Kampagne so, dass wir bei gleichen Kosten mehr Klicks herausholen."

**Lösungsweg:** Landingpage-Erfahrung von „Durchschnittlich" auf „Hervorragend" setzen. QS steigt von 6 auf 10. Ad Rank verbessert sich. Der tatsächliche CPC sinkt auf 0,67 €.

**Lerneffekt:** Ein hoher Qualitätsfaktor spart bares Geld und schlägt reines Budgetkapital.

---

### Szenario C: Konkurrenz-Lücken und Ad Scheduling

**Briefing:**
> „Konkurrent 2 (Der Discounter) flutet morgens zwischen 6 und 10 Uhr den Markt mit aggressiven Geboten. Wir zahlen aktuell 1,50 € pro Klick in dieser Zeit. Finde eine Strategie, wie wir unser Budget schonen."

**Lösungsweg:** Anzeigenplanung (Ad Scheduling) nutzen: Kampagne erst ab 10:00 Uhr starten, wenn der Discounter sein Budget verschossen hat. Oder: Keywords auf `exact` stellen, um Streuverluste zu reduzieren.

**Lerneffekt:** Zeitliches Targeting und Match-Type-Optimierung sind mächtige Hebel, um Budget effizient einzusetzen.

---

### Szenario D (NEW): Der Match-Type-Vergleich

**Briefing:**
> „Starte drei identische Kampagnen mit dem Keyword `laufschuhe kaufen` – einmal Broad, einmal Phrase, einmal Exact. Vergleiche die Ergebnisse."

**Erwartetes Ergebnis:**
- **Broad**: Viele Impressionen, hohe Kosten, niedrige Conversion-Rate (viel Streuverkehr)
- **Exact**: Weniger Impressionen, niedrigerer CPC, höhere Conversion-Rate

**Lerneffekt:** Der Match-Type bestimmt die Balance zwischen Reichweite und Präzision.

---

## 8. Projektstruktur

```
sea-simulator/
├── server/                     # Node.js/Express-Backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── config/
│   │   │   ├── database.ts      # Sequelize + MariaDB
│   │   │   └── env.ts
│   │   ├── models/              # Sequelize-Modelle
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── auction.engine.ts       # Auktionslogik
│   │   │   ├── keyword-planner.ts      # Keyword-Ideen + Gruppen-Suche
│   │   │   ├── heuristic.engine.ts     # Live-Einfügung + Intent-Klassifikation
│   │   │   ├── intent.engine.ts        # Intent-Wirkung auf CPC/CTR/CR/QS
│   │   │   ├── budget.service.ts       # Budget-Tracking
│   │   │   ├── scenario.service.ts     # Ausbilder-Szenarien
│   │   │   └── datasource/             # Externe API-Integrationen
│   │   │       ├── manager.ts          # DataSource Manager (Cache + Fallback)
│   │   │       ├── google-autocomplete.ts  # Google Suggest API
│   │   │       ├── openthesaurus.ts        # OpenThesaurus.de API
│   │   │       ├── wikipedia-pageviews.ts  # Wikipedia Pageviews API
│   │   │       └── llm.ts                  # ⭐ LLM (OpenAI / Ollama / lokal)
│   │   ├── middleware/
│   │   └── utils/
│   └── seed/
│       ├── ontology.ts           # Produkt-Ontologie (Kategorien, Marken, Attribute)
│       ├── generator.ts          # Keyword-Generator (Power-Law, CPC, Intent)
│       ├── seed-keywords.ts      # Einstiegspunkt: Generate + INSERT
│       └── seed-groups.ts        # Gruppen + Hierarchie anlegen
├── client/                     # React-Frontend
│   ├── package.json
│   ├── src/
│   │   ├── components/         # Google-Ads-ähnliche Komponenten
│   │   │   ├── Sidebar.tsx
│   │   │   ├── CampaignTable.tsx
│   │   │   ├── CampaignEditor.tsx
│   │   │   ├── KeywordEditor.tsx
│   │   │   ├── KeywordPlanner.tsx      # Keyword-Ideen-Suche (wie Google Keyword Planner)
│   │   │   ├── KeywordGroupTree.tsx    # Gruppen-Hierarchie-Baum
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AuctionChart.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── hooks/
│   │   ├── services/           # API-Client
│   │   └── types/
│   └── public/
├── docs/
│   ├── api-spec.md
│   └── schema.sql              # DDL zum manuellen Import (mysql < schema.sql)
└── readme.md
```

---

## 9. API-Übersicht (REST)

### Auth
| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `POST` | `/api/auth/register` | Benutzer registrieren |
| `POST` | `/api/auth/login` | Login → JWT-Token |
| `GET` | `/api/auth/me` | Eigenes Profil |

### Kampagnen
| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `POST` | `/api/campaigns` | Kampagne anlegen |
| `GET` | `/api/campaigns` | Kampagnen-Liste |
| `GET` | `/api/campaigns/:id` | Kampagnen-Details |
| `PUT` | `/api/campaigns/:id` | Kampagne bearbeiten |
| `DELETE` | `/api/campaigns/:id` | Kampagne löschen |
| `POST` | `/api/campaigns/:id/start` | Simulation starten |

### Keywords
| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/keywords/search?q=` | Keywords suchen (Autocomplete) |
| `POST` | `/api/campaigns/:id/keywords` | Keywords buchen |
| `DELETE` | `/api/campaigns/:id/keywords/:kwid` | Keyword entfernen |

### Keyword-Planer
| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/keyword-planner/ideas?seed=` | Keyword-Ideen zu einem Seed-Begriff (mit Gruppen, Intent, CPC) |
| `GET` | `/api/keyword-planner/groups` | Alle Gruppen + Hierarchie |
| `GET` | `/api/keyword-planner/groups/:id` | Keywords einer Gruppe |
| `GET` | `/api/keyword-planner/groups/:id/stats` | Gruppen-Statistiken (Ø CPC, Gesamt-Volumen) |

### Dashboard
| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/campaigns/:id/dashboard` | Aggregierte Kennzahlen |
| `GET` | `/api/campaigns/:id/hourly` | Stündlicher Verlauf |
| `GET` | `/api/campaigns/:id/auctions` | Auktionsdaten + Konkurrenzvergleich |
| `GET` | `/api/campaigns/:id/log` | Simulations-Log (Lernereignisse) |

### Admin
| Methode | Endpunkt | Beschreibung |
|---|---|---|
| `GET` | `/api/admin/users` | Alle Azubis anzeigen |
| `GET` | `/api/admin/scenarios` | Szenarien verwalten |
| `POST` | `/api/admin/scenarios` | Szenario anlegen |
| `PUT` | `/api/admin/competitors/:id` | KI-Konkurrent anpassen |
| `GET` | `/api/admin/datasources/status` | Status aller externen APIs prüfen |
| `PUT` | `/api/admin/datasources/config` | Datenquellen konfigurieren (Timeout, Cache, aktiv/inaktiv) |

---

## 10. Technologie-Stack (final)

| Komponente | Technologie |
|---|---|
| **Datenbank** | MariaDB 10.6+ (InnoDB, JSON-Spalten) |
| **ORM** | Sequelize 6 (mit MariaDB-Dialekt) |
| **Backend** | Node.js + Express + TypeScript |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Charts** | Recharts oder Chart.js |
| **Test** | Jest + Supertest (Backend), Vitest (Frontend) |
| **Externe APIs (kostenlos)** | Google Autocomplete (Suggest), OpenThesaurus.de, Wikipedia Pageviews |
| **⭐ LLM (optional)** | OpenAI API, Ollama (lokal), Anthropic Claude – konfigurierbar via `.env` |
| **Lokales NLP** | Spacy `de_core_news_sm` (Python) oder Compromise.js |
| **Hosting** | Apache / Nginx (Frontend) + Node.js-Prozess via systemd/PM2 (Backend) |

---

## 11. Setup & Entwicklung

### Voraussetzungen
- Server mit MariaDB 10.6+ und Node.js 18+
- npm / yarn
- Python 3.8+ mit `pip install spacy && python -m spacy download de_core_news_sm` (für lokales NLP, optional – nur wenn externe APIs nicht verfügbar sind)
- (Optional) Apache oder Nginx fürs Frontend-Proxy

### Klassische Installation (ohne Docker)

```bash
# 1. MariaDB einrichten
#    Datenbank und Benutzer anlegen:
#    CREATE DATABASE sea_adarena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#    CREATE USER 'sea_user'@'localhost' IDENTIFIED BY '...';
#    GRANT ALL PRIVILEGES ON sea_adarena.* TO 'sea_user'@'localhost';

# 2. Backend installieren
cd server
npm install
cp .env.example .env        # DB-Zugang konfigurieren (Host, Port, User, Passwort)

# 3. Datenbank-Schema einspielen
mysql -u sea_user -p sea_adarena < docs/schema.sql

# 4. Seed-Daten importieren
npm run seed                # Keywords & Competitors einspielen

# 5. Backend starten (Dev)
npm run dev                 # Läuft auf http://localhost:3001

# 6. Frontend installieren & starten (zweites Terminal)
cd client
npm install
npm run dev                 # Läuft auf http://localhost:5173
```

### Produktiv-Hosting

```bash
# Backend als Systemd-Service
# /etc/systemd/system/sea-adarena.service:
#
# [Unit]
# Description=SEA-AdArena Backend
# After=network.target mariadb.service
#
# [Service]
# Type=simple
# User=nodeuser
# WorkingDirectory=/var/www/sea-simulator/server
# ExecStart=/usr/bin/node /var/www/sea-simulator/server/dist/index.js
# Environment=NODE_ENV=production
# Restart=on-failure
#
# [Install]
# WantedBy=multi-user.target

# Frontend-Build
cd client
npm run build               # → dist/ Ordner, via Nginx auslieferbar

# Nginx-Konfiguration (Beispiel)
# server {
#     listen 80;
#     server_name sea-adarena.example.com;
#
#     # Frontend
#     root /var/www/sea-simulator/client/dist;
#     try_files $uri $uri/ /index.html;
#
#     # API-Proxy
#     location /api/ {
#         proxy_pass http://localhost:3001;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#     }
# }
```

---

## 12. Seed-Daten-Generierung (Realistische, fiktive Keywords)

**Problem:** Wir brauchen Keyword-Daten, die thematisch und numerisch realistisch wirken, aber keine echten Google-Daten enthalten (urheberrechtlich geschützt, Verstoß gegen ToS).

**Lösung:** Ein **Keyword-Generator** (Build-Zeit-Skript) erzeugt aus einer Produkt-Ontologie + mathematischen Verteilungen einen vollständigen, realistischen Keyword-Pool. Die Zahlen weichen bewusst von echten Werten ab, liegen aber im realistischen Bereich.

### 12.1 Die Produkt-Ontologie (Baukasten-System)

Der Generator arbeitet mit einer deklarativen Ontologie – einer definierten Menge an Produktkategorien, Attributen und Marken:

```typescript
// ==================================================
// server/seed/ontology.ts
// Ontologie für die Keyword-Generierung
// ==================================================

const CATEGORIES = [
    {
        name: 'Sneaker',
        icon: '👟',
        parent: 'Schuhe',
        defaultIntent: 'transactional',
        baseCpcRange: [0.50, 1.50],      // €
        searchVolumeRange: [2000, 25000],
        competition: 'high',
        seasonality: [
            // Jan  Feb  Mär  Apr  Mai  Jun  Jul  Aug  Sep  Okt  Nov  Dez
            [1.0, 1.0, 1.1, 1.1, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4]
        ],
        attributes: ['weiß', 'schwarz', 'bunt', 'leder', 'textil', 'vegan'],
        suffixes: ['kaufen', 'damen', 'herren', 'günstig', '2026', 'trend'],
    },
    {
        name: 'Laufschuhe',
        icon: '🏃',
        parent: 'Schuhe',
        defaultIntent: 'commercial',
        baseCpcRange: [0.60, 1.80],
        searchVolumeRange: [1500, 15000],
        competition: 'medium',
        seasonality: [
            [1.3, 1.2, 1.1, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.1, 1.2]
        ],
        attributes: ['leicht', 'gedämpft', 'wasserfest', 'vegan', 'stabil'],
        suffixes: ['test', 'vergleich', 'kaufen', 'herren', 'damen', 'empfehlung'],
    },
    // ...weitere Kategorien
];

const BRANDS = [
    { name: 'Nike', icon: '✔️', parent: 'Marken', defaultIntent: 'navigational' },
    { name: 'adidas', icon: '⬛', parent: 'Marken', defaultIntent: 'navigational' },
    { name: 'Puma', icon: '🐆', parent: 'Marken', defaultIntent: 'navigational' },
    { name: 'New Balance', icon: '🇳', parent: 'Marken', defaultIntent: 'navigational' },
];

const INTENT_PREFIXES = {
    transactional: ['kaufen', 'bestellen', 'günstig', 'preis', 'angebot', 'sale', 'shop', 'online'],
    commercial: ['test', 'vergleich', 'bewertung', 'erfahrung', 'besten', 'top', 'empfehlung', '2026'],
    informational: ['was ist', 'wie', 'anleitung', 'ratgeber', 'erklärung', 'unterschied', 'pflege'],
};
```

### 12.2 Der Generator-Algorithmus

```
Für jede Kategorie in ontology.CATEGORIES:
    ├── Erzeuge 5-10 Kombinationen aus:
    │   • [attribut] + [kategorie] + [suffix]
    │   • [kategorie] + [suffix]
    │   • [intent_prefix] + [kategorie]
    │   • [marke] + [kategorie]
    │   • Nur [kategorie] + generisches Suffix
    │
    ├── Für jedes generierte Keyword:
    │   ├── Bestimme INTENT:
    │   │   • Eigener Intent des Suffix (z.B. „kaufen" → transactional)
    │   │   • Fallback: defaultIntent der Kategorie
    │   │
    │   ├── Generiere SEARCH VOLUME:
    │   │   • Ziehe zufälligen Wert aus searchVolumeRange
    │   │   • Power-Law-Korrektur: seltene Keywords = niedriges Volumen
    │   │   • Marken-Keywords: ×0.5 (Marken-Suchen sind spezifischer)
    │   │
    │   ├── Generiere BASE-CPC:
    │   │   • Ziehe zufälligen Wert aus baseCpcRange
    │   │   • Multipliziere mit Intent-Faktor (transactional ×1.4, etc.)
    │   │   • Runde auf 5 Cent genau
    │   │
    │   ├── Bestimme COMPETITION:
    │   │   • Von Kategorie geerbt (falls vorhanden)
    │   │   • Intent-basiert: transactional=high, commercial=medium, etc.
    │   │
    │   ├── Generiere SEASONALITY:
    │   │   • Von Kategorie geerbt
    │   │   • Bei Long-Tail: flachere Kurve (weniger saisonal)
    │   │
    │   └── Weise GRUPPE zu:
    │       • Primärgruppe = Kategorie
    │       • Bei Marken-Keyword: primär = Marke, auch verknüpft mit Kategorie
    │
    └── INSERT in keywords + keyword_group_members
```

### 12.3 Suchvolumen – Power-Law-Verteilung

Im echten SEA folgen Suchvolumen einer **Power-Law-Verteilung** (Pareto-Prinzip): Wenige Keywords haben extrem hohes Volumen, viele Keywords haben niedriges Volumen.

```
Kumulierte Suchvolumen-Verteilung:
100% │                                          ╱
 90% │                                       ╱
 70% │                                   ╱
 50% │                              ╱
 20% │                        ╱
 10% │                   ╱
  5% │              ╱
  2% │        ╱
  1% │  ╱────
     └───────────────────────────────
       10  100  1k   10k  100k
            Suchvolumen (logarithmisch)

→ 20 % der Keywords generieren 80 % des gesamten Suchvolumens
```

Der Generator setzt dies um, indem er:

```typescript
function generateSearchVolume(range: [number, number], isLongTail: boolean): number {
    // 1. Zufallswert aus Potenzverteilung
    const min = Math.log(range[0]);
    const max = Math.log(range[1]);
    const sample = min + (max - min) * Math.pow(Math.random(), 2);  // exponent > 1 = Rechtschiefe
    let volume = Math.round(Math.exp(sample));

    // 2. Long-Tail: zusätzlich runter-skaliert
    if (isLongTail) {
        volume = clamp(volume, 30, 150);  // Max 150 für Long-Tail
    }

    // 3. Runden auf sinnvolle Größenordnung
    if (volume > 10000) volume = Math.round(volume / 1000) * 1000;
    else if (volume > 1000) volume = Math.round(volume / 100) * 100;
    else if (volume > 100) volume = Math.round(volume / 10) * 10;

    return volume;
}
```

**Ergebnis:** Von 100 generierten Keywords haben typischerweise:

| Volumen-Bereich | Anzahl Keywords | Beispiele |
|---|---|---|
| **10.000 – 25.000** | ~5 | `sneaker kaufen`, `schuhe online bestellen` |
| **1.000 – 9.999** | ~20 | `laufschuhe herren test`, `barfußschuhe kinder` |
| **100 – 999** | ~40 | `vegane ledersneaker damen`, `wasserdichte wanderschuhe` |
| **30 – 99** | ~35 (Long-Tail) | `nike air zoom pegasus 2026 damen kaufen` |

### 12.4 Base-CPC – Intent-basierte Generierung

```typescript
function generateBaseCpc(range: [number, number], intent: Intent): number {
    // 1. Zufallswert aus gleichmäßiger Verteilung innerhalb des Kategorie-Ranges
    const base = range[0] + Math.random() * (range[1] - range[0]);

    // 2. Intent-Faktor
    const intentFactors = {
        transactional: 1.4,
        commercial: 1.1,
        navigational: 0.9,
        informational: 0.8,
    };
    const cpc = base * intentFactors[intent];

    // 3. Auf 5 Cent runden (realistische CPC-Preise)
    return Math.round(cpc * 20) / 20;
}
```

### 12.5 Gruppen-Struktur (automatisch generiert)

Der Generator baut automatisch eine **3-Ebenen-Hierarchie** auf:

```
Schuhe (Obergruppe)
├── Sneker         40 Keywords    Base-CPC: 0,50-1,50 €
├── Laufschuhe      35 Keywords    Base-CPC: 0,60-1,80 €
├── Wanderschuhe    30 Keywords    Base-CPC: 0,70-2,20 €
├── Barfußschuhe    25 Keywords    Base-CPC: 0,40-1,20 €
└── Stiefel         20 Keywords    Base-CPC: 0,80-2,50 €
Marken (Obergruppe)
├── Nike            15 Keywords    Base-CPC: 0,80-2,00 €
├── adidas          15 Keywords    Base-CPC: 0,80-2,00 €
├── Puma            10 Keywords    Base-CPC: 0,60-1,50 €
└── New Balance     10 Keywords    Base-CPC: 0,60-1,50 €
Accessoires (Obergruppe)
├── Einlagen        15 Keywords    Base-CPC: 0,30-0,80 €
├── Pflegeprodukte  10 Keywords    Base-CPC: 0,20-0,60 €
└── Schnürsenkel     8 Keywords    Base-CPC: 0,10-0,40 €
Allgemein           20 Keywords (Rest / nicht klassifiziert)
─────────────────────────────────────────────
Gesamt: ~250-300 Keywords
```

**Jedes Keyword ist Mitglied einer Primärgruppe** und optional zusätzlich in einer oder mehreren Sekundärgruppen (z.B. `nike laufschuhe damen` ∈ Nike + Laufschuhe).

### 12.6 Seed-Skript-Struktur

```text
server/seed/
├── ontology.ts           # Produkt-Ontologie (Deklaration)
├── generator.ts          # Keyword-Generator (Algorithmus)
├── seed-keywords.ts      # Einstiegspunkt: Generate + INSERT
└── seed-groups.ts        # Gruppen + Hierarchie anlegen

Aufruf:
  $ npm run seed
  → Generiert ~250 Keywords aus der Ontologie
  → Legt Gruppen und Hierarchie an
  → Füllt keyword_group_members
  → Bei jedem Durchlauf: TRUNCATE + NEU (idempotent)
```

**Wichtige Prinzipien:**
- **Deterministisch trotz Zufall:** Der Generator verwendet einen festen Seed (`Math.seed = 42`), sodass bei jedem `npm run seed` die exakt gleichen Keywords entstehen.
- **Erweiterbar:** Neue Kategorien werden einfach in `ontology.ts` ergänzt, der Rest passiert automatisch.
- **Keine echten Google-Daten:** Sämtliche Zahlen sind fiktiv, aber statistisch realistisch.

### 12.7 Warum dieser Ansatz?

| Kriterium | Echt-Daten (Google) | Generierte Daten |
|---|---|---|
| **Rechtlich unbedenklich** | ❌ (Nutzungsbedingungen) | ✅ |
| **Thematisch passend** | ✅ | ✅ (durch Ontologie gesteuert) |
| **Realistische Verteilung** | ✅ | ✅ (Power-Law + Intent-Faktoren) |
| **Wiederholbar (Seed)** | ❌ | ✅ |
| **Erweiterbar** | ❌ (müsste neu gescrapt werden) | ✅ (eine Zeile in ontology.ts) |
| **Kostenlos** | ❌ | ✅ |
| **Von echten Zahlen unterscheidbar** | ❌ | ✅ (bewusst gerundet + abweichend) |

---

## 13. Ausblick / Erweiterungen (Phase 2)

- **Negative Keywords**: Ausschlussbegriffe für Kampagnen
- **Anzeigenerweiterungen**: Sitelinks, Callouts – Bonus auf QS
- **Rückkehr zu alter Kampagne**: Ausbilder kann historische Kampagnen als Fallbeispiele laden
- **Mehrspieler-Echtzeit**: Azubis konkurrieren im selben Markt (gleiche Keywords, gleiche Auktion)
- **API-Export**: Kampagnenergebnisse als CSV exportieren für den Unterricht
- **KI-gestützte Verbesserungsvorschläge**: Der Simulator gibt nach der Simulation Optimierungstipps

---

> **SEA-AdArena Simulator** — Entwickelt für die E-Commerce-Ausbildung.
> MariaDB · Node.js · React · Google-Ads-inspirierte UI
