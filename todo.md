# SEA-AdArena Simulator — Arbeitspakete

> Kompakte Referenz für Claude. Enthält alle Implementierungsdetails inline — readme.md muss nicht gelesen werden.
> Status: `[ ]` offen · `[~]` in Arbeit · `[x]` fertig
>
> **UI-Pflicht:** Jedes Frontend-WP (4.x) muss `docs/google-ads-ui-spec.md` einhalten.
> Die Spec ist normativ: Farben, Abstände, Typografie, Komponenten-Verhalten, Zahlenformatierung (de-DE).

---

## Abhängigkeitsübersicht

```
0.1 → 0.2 → 0.3 → 0.4
                ↓
           1.1  1.2  1.3   (1.1+1.3 parallel; 1.2 braucht 0.3+1.1)
                ↓    ↓
               1.4 (braucht 1.2+1.3)
                ↓
      2.2 → 2.3 → 2.4      (2.2 parallel zu 1.x; 2.1 parallel zu 1.2)
      2.1 (parallel zu 2.2)
                ↓
   3.1  3.2  3.3  3.4  3.5  (alle parallel, brauchen 0.4 + jeweilige Services)
                ↓
   4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8 → 4.9
                ↓
   5.1  5.2  5.3  (parallel, nach Phase 4 Kern)
```

---

## Phase 0 — Fundament

### WP-0.1 · Monorepo-Gerüst
**Ziel:** Lauffähige leere Projekt-Struktur mit korrektem TypeScript-Setup.  
**Deps:** —  
**Files:**
```
sea-simulator/
├── server/package.json  tsconfig.json  .env.example  src/index.ts
├── client/package.json  tsconfig.json  vite.config.ts  index.html
├── docs/  .gitignore
```

**Implementierung:**
- `server/package.json` deps: `express sequelize sequelize-typescript mariadb jsonwebtoken bcrypt dotenv cors`; devDeps: `typescript ts-node-dev @types/*`; scripts: `dev: ts-node-dev src/index.ts`, `build: tsc`, `seed: ts-node seed/seed-keywords.ts`
- `server/src/index.ts`: Express-App, JSON-Middleware, CORS, Routes mounten, Port 3001
- `server/.env.example`: `DB_HOST DB_PORT DB_USER DB_PASS DB_NAME JWT_SECRET LLM_PROVIDER OPENAI_API_KEY OLLAMA_BASE_URL LLM_MODEL LLM_MAX_TOKENS`
- `client/`: Vite + React 18 + TypeScript (`npm create vite@latest client -- --template react-ts`), dann `npm install tailwindcss autoprefixer postcss recharts react-router-dom`
- Tailwind: `npx tailwindcss init -p`, content: `./src/**/*.{ts,tsx}`

**✓ Done when:**
- [ ] `cd server && npm run dev` startet ohne Fehler auf Port 3001
- [ ] `cd client && npm run dev` startet ohne Fehler auf Port 5173
- [ ] TypeScript kompiliert fehlerfrei in beiden Projekten

---

### WP-0.2 · Datenbankschema
**Ziel:** Vollständiges DDL in `docs/schema.sql`, importierbar ohne Fehler.  
**Deps:** WP-0.1  
**Files:** `docs/schema.sql`

**Tabellen (CREATE TABLE IF NOT EXISTS, Charset utf8mb4, Engine InnoDB):**

| Tabelle | Kernfelder |
|---|---|
| `users` | id PK AI, username VARCHAR(50) UNIQUE, email VARCHAR(255) UNIQUE, password_hash VARCHAR(255), role ENUM('admin','trainee'), created_at DATETIME |
| `campaigns` | id PK AI, user_id FK→users, name VARCHAR(200), status ENUM('running','paused','budget_exhausted','ended') DEFAULT 'paused', daily_budget DECIMAL(8,2), monthly_budget DECIMAL(10,2), bid_strategy ENUM('manual_cpc','maximize_conversions') DEFAULT 'manual_cpc', network ENUM('search','search_display') DEFAULT 'search', start_date DATE, budget_exhausted_at TIME NULL, impressions INT UNSIGNED DEFAULT 0, clicks INT UNSIGNED DEFAULT 0, cost DECIMAL(10,2) DEFAULT 0, conversions INT UNSIGNED DEFAULT 0, avg_position DECIMAL(3,1) DEFAULT 0, created_at DATETIME |
| `ad_groups` | id PK AI, campaign_id FK→campaigns, name VARCHAR(200), max_cpc DECIMAL(6,2), quality_score TINYINT UNSIGNED DEFAULT 5, qs_expected_ctr ENUM('below','average','above') DEFAULT 'average', qs_ad_relevance ENUM('below','average','above') DEFAULT 'average', qs_landing_page ENUM('below','average','above') DEFAULT 'average', landing_page_experience ENUM('poor','average','excellent') DEFAULT 'average' |
| `keywords` | id PK AI, keyword VARCHAR(255) UNIQUE, monthly_search_volume INT UNSIGNED, base_cpc DECIMAL(4,2), intent_category ENUM('informational','transactional','commercial','navigational'), intent_source ENUM('seed','heuristic') DEFAULT 'seed', competition_level ENUM('low','medium','high'), seasonality_factors JSON, heuristic_data JSON NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP |
| `campaign_keywords` | id PK AI, ad_group_id FK→ad_groups, keyword_id FK→keywords, match_type ENUM('broad','phrase','exact') DEFAULT 'phrase', max_cpc_override DECIMAL(6,2) NULL, generated_by_heuristic BOOLEAN DEFAULT FALSE |
| `negative_keywords` | id PK AI, campaign_id FK→campaigns, keyword VARCHAR(255) |
| `keyword_groups` | id PK AI, name VARCHAR(100), description VARCHAR(255) NULL, parent_group_id INT UNSIGNED NULL FK→keyword_groups, default_intent ENUM('informational','transactional','commercial','navigational') NULL, icon VARCHAR(50) NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP |
| `keyword_group_members` | id PK AI, keyword_id FK→keywords, group_id FK→keyword_groups, relationship_type ENUM('primary','synonym','broader','narrower','related') DEFAULT 'related', created_at DATETIME DEFAULT CURRENT_TIMESTAMP |
| `competitor_profiles` | id TINYINT PK AI, name VARCHAR(100), strategy_label VARCHAR(50), base_bid DECIMAL(6,2), quality_score TINYINT UNSIGNED, daily_budget DECIMAL(8,2) NULL, active_hours_start TINYINT DEFAULT 0, active_hours_end TINYINT DEFAULT 23 |
| `auction_results` | id BIGINT PK AI, campaign_id FK→campaigns, keyword_id FK→keywords, hour TINYINT, bidder_type ENUM('player','competitor'), bidder_id INT, ad_rank DECIMAL(8,2), impressions INT UNSIGNED, clicks INT UNSIGNED, cost DECIMAL(8,2), avg_position DECIMAL(3,1) |
| `hourly_stats` | id PK AI, campaign_id FK, hour TINYINT, impressions INT, clicks INT, cost DECIMAL(8,2), avg_position DECIMAL(3,1), budget_remaining DECIMAL(8,2), conversions INT UNSIGNED DEFAULT 0 |
| `simulation_log` | id PK AI, campaign_id FK, hour TINYINT, event_type VARCHAR(50), message TEXT |
| `scenarios` | id TINYINT PK AI, name VARCHAR(100), description TEXT, config JSON |

Außerdem: Seed-INSERT für `competitor_profiles`:
- (1, 'Der Riese', 'Marktführer', 2.20, 8, NULL, 0, 23)
- (2, 'Der Discounter', 'Low-Budget', 0.60, 3, 20.00, 6, 10)
- (3, 'Der Smarte', 'Qualitätsfokus', 1.30, 9, 100.00, 8, 22)

**✓ Done when:**
- [ ] `mysql -u sea_user -p sea_adarena < docs/schema.sql` läuft fehlerfrei durch
- [ ] Alle 13 Tabellen existieren mit korrekten FK-Constraints
- [ ] Drei Competitor-Profile vorhanden

---

### WP-0.3 · Sequelize-Modelle
**Ziel:** Typisierte Sequelize-Modelle für alle Tabellen mit Associations.  
**Deps:** WP-0.2  
**Files:** `server/src/models/*.ts`, `server/src/models/index.ts`, `server/src/config/database.ts`

**Implementierung:**
- `database.ts`: Sequelize-Instanz mit MariaDB-Dialekt, Konfiguration aus `.env`
- Ein Model-File pro Tabelle, TypeScript-Interfaces exportieren
- `models/index.ts`: alle Associations definieren:
  - User hasMany Campaign; Campaign belongsTo User
  - Campaign hasMany AdGroup; AdGroup belongsTo Campaign
  - AdGroup hasMany CampaignKeyword; CampaignKeyword belongsTo AdGroup
  - Keyword hasMany CampaignKeyword, hasMany KeywordGroupMember
  - KeywordGroup hasMany KeywordGroupMember, hasOne KeywordGroup (parent)
  - Campaign hasMany AuctionResult, HourlyStat, SimulationLog, NegativeKeyword

**✓ Done when:**
- [ ] `sequelize.authenticate()` + `sequelize.sync({ alter: false })` ohne Fehler
- [ ] Alle Modelle exportieren korrekte TypeScript-Typen
- [ ] Associations erlauben eager loading (z.B. `Campaign.findAll({ include: [AdGroup] })`)

---

### WP-0.4 · Auth-System
**Ziel:** Register/Login mit JWT, geschützte Route-Middleware.  
**Deps:** WP-0.3  
**Files:** `server/src/routes/auth.ts`, `server/src/middleware/auth.ts`, `server/src/middleware/admin.ts`

**Implementierung:**
- `POST /api/auth/register`: body `{username, email, password}` → bcrypt hash (rounds=10) → User anlegen → JWT zurückgeben
- `POST /api/auth/login`: email+password → bcrypt compare → JWT (payload: `{userId, role}`, expires 7d)
- `GET /api/auth/me`: Auth-Middleware → User zurückgeben (ohne password_hash)
- `middleware/auth.ts`: Bearer-Token aus Header extrahieren, `jwt.verify()`, req.user setzen
- `middleware/admin.ts`: prüft `req.user.role === 'admin'`, sonst 403

**✓ Done when:**
- [ ] Register → Login → /me funktioniert end-to-end (curl/Postman)
- [ ] Ungültiger Token → 401
- [ ] Trainee-Zugriff auf Admin-Route → 403

---

## Phase 1 — Simulations-Kern

### WP-1.1 · Intent Engine
**Ziel:** Pure TypeScript-Funktionen für alle Intent-Multiplikatoren.  
**Deps:** — (keine DB-Abhängigkeit)  
**Files:** `server/src/services/intent.engine.ts`

**Implementierung — Werte exakt so:**

```typescript
export type IntentCategory = 'transactional'|'commercial'|'navigational'|'informational';

const INTENT_CONFIG = {
  transactional:  { cpcFactor: 1.4, ctrFactor: 1.2,  cvr: 0.035, qsCtr: 'above'   },
  commercial:     { cpcFactor: 1.1, ctrFactor: 1.05, cvr: 0.008, qsCtr: 'average' },
  navigational:   { cpcFactor: 0.9, ctrFactor: 1.3,  cvr: 0.005, qsCtr: 'above'   },
  informational:  { cpcFactor: 0.8, ctrFactor: 0.9,  cvr: 0.002, qsCtr: 'below'   },
};

export function getIntentCpcFactor(intent: IntentCategory): number
export function getIntentCtrFactor(intent: IntentCategory): number
export function getIntentCvr(intent: IntentCategory): number
export function getIntentQsCtrComponent(intent: IntentCategory): 'below'|'average'|'above'
```

**✓ Done when:**
- [ ] Unit-Tests für alle vier Intents + alle vier Funktionen (16 Tests)
- [ ] TypeScript: keine `any`-Typen

---

### WP-1.2 · Auction Engine
**Ziel:** 24-Stunden-Simulation eines Tages, schreibt Ergebnisse in DB.  
**Deps:** WP-0.3, WP-1.1  
**Files:** `server/src/services/auction.engine.ts`

**Kernlogik (alle Formeln inline):**

```
HOURLY_TRAFFIC = [0.010,0.005,0.005,0.010,0.020,0.030,0.050,0.060,0.060,
                  0.050,0.050,0.050,0.050,0.050,0.040,0.040,0.050,0.060,
                  0.070,0.080,0.090,0.080,0.060,0.030]

MATCH_IMPRESSION_FACTOR = { broad:1.0, phrase:0.65, exact:0.35 }
MATCH_CPC_FACTOR        = { broad:1.2, phrase:1.0,  exact:0.9  }

POSITION_IMPRESSION_SHARE = { 1:0.45, 2:0.25, 3:0.125, 4:0.08 }
BASE_CTR_BY_POSITION      = { 1:0.10, 2:0.06, 3:0.03,  4:0.015 }

QS_SCORE_MAP = { below:[1,3], average:[4,7], above:[8,10] }
  → QS = round((midpoint(qs_expected_ctr) + midpoint(qs_ad_relevance) + midpoint(qs_landing_page)) / 3)
  → landing_page_experience: poor→below, average→average, excellent→above

function runSimulation(campaignId: number): Promise<SimulationSummary>
  1. Lade Campaign + AdGroups + CampaignKeywords + Keywords + NegativeKeywords
  2. Berechne daily_budget = monthly_budget / 30.4
  3. Für jede Stunde h (0..23):
     a. Für jedes keyword k in campaign_keywords:
        - Prüfe: keyword.keyword nicht in negative_keywords → sonst skip
        - daily_volume = keyword.monthly_search_volume / 30.4
        - hourly_volume = daily_volume * HOURLY_TRAFFIC[h]
        - Baue Bidder-Liste: [player] + aktive Competitors (active_hours_start ≤ h ≤ active_hours_end, budget_remaining > 0)
        - Für jeden Bidder: effectiveCpc = max_cpc * MATCH_CPC_FACTOR[match_type] * getIntentCpcFactor(intent)
        - ad_rank = effectiveCpc * quality_score
        - Sortiere nach ad_rank DESC → Position
        - Für Player:
            paid_cpc = (ad_rank[position+1] / player_qs) + 0.01  (falls kein Unterlegener: effectiveCpc)
            impressions = floor(hourly_volume * MATCH_IMPRESSION_FACTOR[match_type] * POSITION_IMPRESSION_SHARE[position])
            ctr = BASE_CTR_BY_POSITION[position] * getIntentCtrFactor(intent)
            clicks = floor(impressions * ctr)
            cost = clicks * paid_cpc
            conversions = floor(clicks * getIntentCvr(intent))
        - INSERT auction_results (player + competitors)
     b. Budget-Check: budget_remaining -= stunden_cost; falls ≤ 0 → stop, log 'budget_exhausted'
     c. INSERT hourly_stats (Aggregat dieser Stunde)
  4. UPDATE campaigns (impressions, clicks, cost, conversions, avg_position, status)
  5. Gib SimulationSummary zurück
```

**✓ Done when:**
- [ ] Simulation läuft für eine Testkampagne ohne Fehler
- [ ] Bei Budget-Erschöpfung: `campaigns.status = 'budget_exhausted'`, `simulation_log` hat Eintrag
- [ ] `auction_results` hat Einträge für Player + alle Competitors
- [ ] Jest-Test: Kampagne mit QS 10 zahlt weniger CPC als gleiche Kampagne mit QS 5 (bei identischen Bids)

---

### WP-1.3 · Budget Service
**Ziel:** Budget-Tracking und Erschöpfungs-Logik als separater Service.  
**Deps:** WP-0.3  
**Files:** `server/src/services/budget.service.ts`

**Implementierung:**
- `class BudgetService`: hält `remainingBudget: number` pro Kampagnen-Run im Speicher
- `deduct(cost: number): boolean` → zieht ab, gibt false zurück wenn Budget ≤ 0
- `async logExhaustion(campaignId, hour)`: INSERT simulation_log + UPDATE campaigns.budget_exhausted_at + status='budget_exhausted'
- `getRemainingBudget(): number`

**✓ Done when:**
- [ ] Unit-Test: deduct() gibt false zurück wenn Budget überschritten
- [ ] Nach Erschöpfung: DB-Status korrekt gesetzt

---

### WP-1.4 · Simulations-Endpunkt
**Ziel:** REST-Route startet Simulation, gibt Ergebnis zurück.  
**Deps:** WP-1.2, WP-1.3, WP-0.4  
**Files:** `server/src/routes/simulation.ts`, `server/src/controllers/simulation.controller.ts`

**Implementierung:**
- `POST /api/campaigns/:id/start` (Auth-Middleware required, nur eigene Kampagnen)
- Validierung: Campaign existiert, gehört zu req.user, hat min. 1 AdGroup mit min. 1 Keyword
- Ruft `auctionEngine.runSimulation(campaignId)` auf
- Setzt campaign.status = 'running' vor Start, dann auf Ergebnis-Status nach Ende
- Response: `{ summary: SimulationSummary, campaign: Campaign }`
- Fehler wenn campaign.status bereits 'running': 409

**✓ Done when:**
- [ ] POST /api/campaigns/:id/start gibt 200 + Summary zurück
- [ ] Fremde Kampagne → 403
- [ ] Fehlende Keywords → 400 mit erklärender Nachricht

---

## Phase 2 — Keyword-System

### WP-2.1 · Seed-Datengenerator
**Ziel:** `npm run seed` generiert ~250 Keywords + Gruppen deterministisch.  
**Deps:** WP-0.3  
**Files:** `server/seed/ontology.ts`, `server/seed/generator.ts`, `server/seed/seed-keywords.ts`, `server/seed/seed-groups.ts`

**Implementierung:**

`ontology.ts` — Datenstruktur:
```typescript
interface Category {
  name: string; icon: string; parent: string;
  defaultIntent: IntentCategory;
  baseCpcRange: [number,number]; searchVolumeRange: [number,number];
  competition: 'low'|'medium'|'high';
  seasonality: number[];  // 12 Werte
  attributes: string[]; suffixes: string[];
}
```
Kategorien: Sneaker, Laufschuhe, Wanderschuhe, Barfußschuhe, Stiefel (parent: Schuhe)  
Marken: Nike, adidas, Puma, New Balance (parent: Marken, intent: navigational)  
Accessoires: Einlagen, Pflegeprodukte, Schnürsenkel

`generator.ts`:
- Fester Seed: `const rng = seedrandom('42')` (npm package `seedrandom`)
- Suchvolumen: `exp(min + (max-min) * pow(rng(), 2))` im Log-Raum → Long-Tail (4+ Wörter) gedeckelt auf 30-150
- CPC: `(range[0] + rng()*(range[1]-range[0])) * intentFactor` → gerundet auf 0.05
- Generiert ~5-10 Keywords pro Kategorie aus Kombinationen: `[attribut] + [kategorie] + [suffix]` etc.

`seed-keywords.ts`: TRUNCATE keyword_group_members → keyword_groups → keywords (in dieser Reihenfolge wegen FK), dann INSERT

**✓ Done when:**
- [ ] `npm run seed` läuft zweimal hintereinander → identische Ergebnisse (deterministisch)
- [ ] ≥ 200 Keywords in DB nach Seed
- [ ] Alle Keywords haben intent_category, base_cpc, monthly_search_volume ≠ null
- [ ] Gruppen-Hierarchie korrekt (Sneaker.parent_group_id → Schuhe.id)

---

### WP-2.2 · Lokale Heuristik (Fallback)
**Ziel:** Pure TypeScript-Funktionen zur Intent-Klassifikation ohne externe APIs.  
**Deps:** — (keine DB)  
**Files:** `server/src/services/datasource/local-heuristic.ts`

**Implementierung — Signalwörter exakt:**
```typescript
const SIGNALS = {
  transactional: ['kaufen','bestellen','kauf','order','shop','günstig','preis',
                  'rabatt','angebot','sale','lieferung','online bestellen'],
  commercial:    ['vergleich','test','bewertung','erfahrung','alternativ','beste',
                  'top','2025','2026','empfehlung'],
  navigational:  ['marke','.de','login','homepage','seite','anmelden','registrieren'],
  informational: ['was ist','anleitung','wie funktioniert','ratgeber','erklärung',
                  'kurs','tutorial','definition','bedeutung','wiki','wie '],
};

const INTENT_WEIGHTS = { transactional:3, commercial:2, navigational:2, informational:1 };
```

Funktionen:
- `classifyIntent(keyword: string): IntentCategory` — Signalwort-Scan, Gewichtung bei Konflikten, Default: 'commercial'
- `estimateSearchVolume(keyword: string): number` — Wortanzahl-Tabelle: 1W→5000-15000, 2W→1000-8000, 3W→100-800, 4+W→30-150 (Zufall mit seedrandom lokal)
- `estimateBaseCpc(intent: IntentCategory, wordCount: number): number` — Zufalls-CPC 0.30-2.50 × intentFactor × longTailFactor (4+W: ×0.6)
- `getCompetitionLevel(intent: IntentCategory): 'low'|'medium'|'high'`
- `getDefaultSeasonality(): number[]` — returns `Array(12).fill(1.0)`

**✓ Done when:**
- [ ] Unit-Tests: "sneaker kaufen" → transactional, "was ist ein qualitätsfaktor" → informational, "nike.de" → navigational, "laufschuhe test" → commercial
- [ ] Keine externen Imports

---

### WP-2.3 · DataSource Manager
**Ziel:** Externe APIs parallel anfragen, bei Timeout auf lokale Heuristik fallen.  
**Deps:** WP-2.2  
**Files:** `server/src/services/datasource/google-autocomplete.ts`, `openthesaurus.ts`, `wikipedia-pageviews.ts`, `manager.ts`

**Implementierung:**

`google-autocomplete.ts`:
```
GET http://suggestqueries.google.com/complete/search?output=chrome&hl=de&q=ENCODED
→ JSON: [query, [s1,s2,...]] → return data[1] as string[]
Timeout: AbortSignal.timeout(2000)
```

`openthesaurus.ts`:
```
GET https://www.openthesaurus.de/synonyme/search?q=ENCODED&format=application/json
→ data.synsets[].terms[].term → flatten → string[]
Timeout: 2000ms
```
Nutzen: jedes Wort des Keywords auf Synonyme prüfen → Synonyme gegen SIGNALS-Tabelle aus WP-2.2 matchen → Intent bestätigen

`wikipedia-pageviews.ts`:
```
GET https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/de.wikipedia/
    all-access/all-agents/ARTICLE/monthly/LAST_MONTH
→ data.items[].views → sum
Multiplikator: 8-15 (zufällig), Long-Tail gedeckelt
```

`manager.ts`:
- `async analyzeKeyword(keyword: string): Promise<KeywordAnalysis>` — ruft alle drei APIs parallel auf (`Promise.allSettled`)
- Wenn mind. 2 APIs Timeout: nur lokale Heuristik (WP-2.2)
- Gibt zurück: `{ intent, searchVolume, baseCpc, competition, relatedKeywords: string[], groupName: string }`
- In-Memory-Cache: 24h pro keyword (Map<string, {result, timestamp}>)
- `groupName` aus häufigstem Common-Substring der Autocomplete-Ergebnisse

**✓ Done when:**
- [ ] Alle drei API-Funktionen haben eigenen Timeout-Test (Mock: Server antwortet nach 3s → Fallback greift)
- [ ] manager.analyzeKeyword() gibt sinnvolles Ergebnis zurück, auch wenn alle APIs gesperrt sind
- [ ] Cache: zweiter Aufruf mit gleichem Keyword macht keine HTTP-Anfrage

---

### WP-2.4 · Heuristic Engine (Live-Einfügung)
**Ziel:** Unbekannte Keywords werden transparent eingefügt und sofort verwendbar.  
**Deps:** WP-2.3, WP-0.3  
**Files:** `server/src/services/heuristic.engine.ts`

**Implementierung:**
```typescript
async function resolveKeyword(
  keywordText: string,
  adGroupId: number,
  matchType: 'broad'|'phrase'|'exact',
  maxCpcOverride?: number
): Promise<CampaignKeyword>
```
Ablauf:
1. `Keyword.findOne({ where: { keyword: keywordText } })`
2. Falls nicht gefunden: `manager.analyzeKeyword(keywordText)` → INSERT INTO keywords (intent_source='heuristic', heuristic_data=JSON der Rohdaten)
3. Finde oder erstelle passende Gruppe: suche in keyword_groups.name nach Übereinstimmung mit groupName → sonst neue Gruppe anlegen
4. INSERT keyword_group_members (relationship_type='primary')
5. INSERT campaign_keywords (generated_by_heuristic=true, ON DUPLICATE KEY UPDATE match_type)
6. Return CampaignKeyword

Für related keywords aus Autocomplete: ebenfalls in keyword_group_members eintragen (relationship_type='related'), aber NICHT als campaign_keywords

**✓ Done when:**
- [ ] Unbekanntes Keyword eingeben → in keywords-Tabelle vorhanden, intent_source='heuristic'
- [ ] Gleiches Keyword nochmal eingeben → kein Duplikat, sofort aus DB gefunden
- [ ] Related keywords aus Autocomplete in keyword_group_members vorhanden

---

## Phase 3 — REST API

### WP-3.1 · Campaign & AdGroup CRUD
**Ziel:** Vollständige CRUD-Endpunkte für Kampagnen und Anzeigengruppen.  
**Deps:** WP-0.3, WP-0.4  
**Files:** `server/src/routes/campaigns.ts`, `server/src/controllers/campaign.controller.ts`

**Endpunkte:**
- `POST /api/campaigns` — body: name, monthly_budget, bid_strategy, network; auto: daily_budget=monthly/30.4, status='paused'
- `GET /api/campaigns` — nur eigene (WHERE user_id = req.user.userId), inkl. Kurzstatistik
- `GET /api/campaigns/:id` — inkl. AdGroups + CampaignKeywords + Keywords
- `PUT /api/campaigns/:id` — editierbare Felder (außer status, impressions, clicks, cost)
- `DELETE /api/campaigns/:id` — CASCADE löscht AdGroups, Keywords, Results
- `POST /api/campaigns/:id/ad-groups` — name, max_cpc, qs_*-Felder, landing_page_experience
- `PUT /api/campaigns/:id/ad-groups/:agid`
- `DELETE /api/campaigns/:id/ad-groups/:agid`

**✓ Done when:**
- [ ] Alle 8 Endpunkte antworten korrekt (200/201/204/404)
- [ ] Fremde Kampagne → 404 (nicht 403, kein Datenleck)
- [ ] Supertest-Tests für alle Endpunkte

---

### WP-3.2 · Keyword-Routen
**Ziel:** Keywords buchen, entfernen, suchen — mit automatischer Live-Einfügung.  
**Deps:** WP-2.4, WP-3.1  
**Files:** `server/src/routes/keywords.ts`

**Endpunkte:**
- `GET /api/keywords/search?q=TEXT` — LIKE-Suche in keywords.keyword, max 20 Ergebnisse, inkl. intent + volume
- `POST /api/campaigns/:id/keywords` — body: `{ adGroupId, keywords: [{text, matchType, maxCpcOverride?}] }` → für jedes keyword: `heuristicEngine.resolveKeyword()` → Response enthält Flag `wasInserted: boolean` je Keyword
- `DELETE /api/campaigns/:id/keywords/:ckid`
- `POST /api/campaigns/:id/negative-keywords` — body: `{ keywords: string[] }`
- `GET /api/campaigns/:id/negative-keywords`
- `DELETE /api/campaigns/:id/negative-keywords/:nkid`

**✓ Done when:**
- [ ] Unbekanntes Keyword buchen → `wasInserted: true` in Response
- [ ] Bekanntes Keyword buchen → `wasInserted: false`
- [ ] Negatives Keyword → wird bei Simulation berücksichtigt (Integration mit WP-1.2)

---

### WP-3.3 · Dashboard-Routen
**Ziel:** Aggregierte Statistiken und Detail-Daten für das Frontend-Dashboard.  
**Deps:** WP-0.3, WP-0.4  
**Files:** `server/src/routes/dashboard.ts`

**Endpunkte:**
- `GET /api/campaigns/:id/dashboard` → `{ impressions, clicks, ctr, avgCpc, totalCost, avgPosition, conversions, conversionRate, status, budgetExhaustedAt }`
- `GET /api/campaigns/:id/hourly` → Array[24] mit `{ hour, impressions, clicks, cost, avgPosition, budgetRemaining, conversions }`
- `GET /api/campaigns/:id/auctions` → Aggregiert aus auction_results: pro Bieter `{ name, adRank, avgPosition, totalCost, impressions, clicks }`, sortiert nach avg_position
- `GET /api/campaigns/:id/log` → simulation_log Einträge sortiert nach hour ASC

**✓ Done when:**
- [ ] Alle Endpunkte liefern nach einer Simulation korrekte Daten
- [ ] Vor Simulation: alle Werte 0 / leere Arrays (kein Fehler)

---

### WP-3.4 · Admin-Routen
**Ziel:** Ausbilder-Endpunkte für User-Übersicht, Konkurrenten, Szenarien, DataSource-Config.  
**Deps:** WP-0.4, WP-2.3  
**Files:** `server/src/routes/admin.ts`

**Endpunkte (alle mit Admin-Middleware):**
- `GET /api/admin/users` → alle User mit Kampagnen-Anzahl + Gesamtbudget
- `GET/POST /api/admin/scenarios`
- `POST /api/admin/scenarios/:id/activate` → setzt Scenario config als aktive Marktbedingung (in-memory oder scenarios.active-Flag)
- `GET/PUT /api/admin/competitors/:id` → base_bid, quality_score, daily_budget, active_hours_start/end
- `GET /api/admin/datasources/status` → ping alle drei externen APIs, gibt `{ google: 'ok'|'timeout', openthesaurus: 'ok'|'timeout', wikipedia: 'ok'|'timeout' }` zurück
- `PUT /api/admin/datasources/config` → speichert Timeout-Wert + aktive/inaktive APIs in memory (oder Config-Tabelle)

**✓ Done when:**
- [ ] Trainee-Token → alle Admin-Routen 403
- [ ] PUT /competitors/:id → nächste Simulation nutzt neue Werte

---

### WP-3.5 · Keyword-Planer-Routen
**Ziel:** Keyword-Ideen und Gruppenstruktur abrufbar.  
**Deps:** WP-0.3, WP-0.4, WP-2.4  
**Files:** `server/src/routes/keyword-planner.ts`, `server/src/services/keyword-planner.ts`

**Service-Logik `keyword-planner.ts`:**
- `getIdeas(seed)`: suche Gruppen mit Namen ∋ seed, hole alle Mitglieder + Keywords die seed-Text enthalten, reichere mit CPC (intent-adjustiert) + volume an, löse Intent-Vererbung auf (keyword → group → parent_group → 'commercial')
- `getGroups()`: komplette Hierarchie als verschachtelter Baum
- `getGroupStats(groupId)`: Ø CPC, Gesamt-Volumen, Keyword-Anzahl der Gruppe

**Endpunkte:**
- `GET /api/keyword-planner/ideas?seed=`
- `GET /api/keyword-planner/groups`
- `GET /api/keyword-planner/groups/:id`
- `GET /api/keyword-planner/groups/:id/stats`

**✓ Done when:**
- [ ] `?seed=sneaker` gibt Keywords aus Gruppe Sneaker + direkte Treffer zurück
- [ ] Intent-Vererbung greift: Keyword ohne eigenen Intent bekommt Gruppen-Intent
- [ ] Hierarchie-Baum ist korrekt verschachtelt

---

## Phase 4 — Frontend

### WP-4.1 · Frontend-Fundament
**Ziel:** Routing, API-Client, Auth-Context, Layout-Gerüst — vollständig nach `docs/google-ads-ui-spec.md`.  
**Deps:** WP-0.4  
**Files:** `client/src/main.tsx`, `client/src/App.tsx`, `client/src/services/api.ts`, `client/src/contexts/AuthContext.tsx`, `client/src/components/Layout.tsx`, `client/tailwind.config.js`, `client/src/index.css`

**Implementierung:**

Tailwind-Config (`tailwind.config.js`) — Google-Farben als Custom-Tokens:
```js
theme: { extend: { colors: {
  google: {
    blue: '#1a73e8', 'blue-dark': '#1557b0', 'blue-light': '#e8f0fe', 'blue-faint': '#f0f4ff',
    gray: '#5f6368', 'gray-dark': '#202124', 'gray-mid': '#80868b',
    'gray-light': '#dadce0', 'gray-bg': '#f1f3f4', 'gray-panel': '#f8f9fa',
    green: '#188038', 'green-bg': '#e6f4ea',
    orange: '#ea8600', 'orange-bg': '#fef7e0',
    red: '#d93025', 'red-bg': '#fce8e6',
  }
}, fontFamily: { google: ['"Google Sans"', 'Roboto', 'Arial', 'sans-serif'] } } }
```

`index.css`: Google Fonts import (`Roboto:wght@400;500` + `Google+Sans:wght@400;500`), `body { font-family: 'Google Sans', Roboto, Arial, sans-serif; background: #f1f3f4; color: #202124; font-size: 14px; }`

`Layout.tsx`: Zwei-Spalten-Flex: Sidebar `w-[230px] min-h-screen bg-white border-r border-google-gray-light fixed` + Main `ml-[230px] mt-16 p-6 min-h-screen bg-google-gray-bg`; TopBar `fixed top-0 left-0 right-0 h-16 bg-white border-b border-google-gray-light z-10 flex items-center`

- React Router: `/login`, `/register` (public), alle anderen hinter `<PrivateRoute>` (redirect → /login)
- `api.ts`: `async function apiFetch<T>(path, options?)` — setzt `Authorization: Bearer <token>` aus localStorage, wirft bei 4xx/5xx typisierten ApiError
- `AuthContext`: `{ user, login(token), logout() }` — token in localStorage, user aus JWT decode (payload: userId, role)
- `useToast`-Hook + `<ToastContainer>` (position: fixed bottom-6 left-6, Stack nach oben): dark bg `#323232`, weiße Schrift, 4 s auto-dismiss

**✓ Done when:**
- [ ] Nicht eingeloggt → Redirect auf /login
- [ ] Nach Login → Redirect auf /campaigns
- [ ] apiFetch mit abgelaufenem Token → Redirect auf /login
- [ ] Layout entspricht Spec: Sidebar 230px fixed, TopBar 64px, bg #f1f3f4
- [ ] Google-Farben via `bg-google-blue text-google-gray-dark` etc. verfügbar
- [ ] Toast erscheint unten links, verschwindet nach 4 s

---

### WP-4.2 · Auth-Seiten
**Ziel:** Login + Register als eigenständige Seiten ohne Layout-Shell.  
**Deps:** WP-4.1  
**Files:** `client/src/pages/LoginPage.tsx`, `client/src/pages/RegisterPage.tsx`

**Implementierung:**
- Zentrierte Card, Google-Ads-inspiriert (Logo + Titel "SEA-AdArena")
- Login: email + password, Submit → POST /api/auth/login → token speichern → navigate('/campaigns')
- Register: username + email + password + repeat, clientseitige Validation
- Fehlermeldungen inline unter den Feldern

**✓ Done when:**
- [ ] Login mit korrekten Daten → Weiterleitung
- [ ] Falsches Passwort → Fehlermeldung ohne Crash
- [ ] Register → direkt eingeloggt (Token aus Response)

---

### WP-4.3 · Sidebar + Navigation
**Ziel:** Persistente Seitennavigation mit Menüpunkten und User-Info.  
**Deps:** WP-4.1  
**Files:** `client/src/components/Sidebar.tsx`

**Menüpunkte:**
- Kampagnen (`/campaigns`) — Icon: Megaphone
- Einblicke → Keyword-Planer (`/keyword-planner`) — Icon: Lightbulb
- Berichte (`/reports`) — Icon: BarChart (Platzhalter-Seite reicht)
- Admin (`/admin`) — nur sichtbar wenn `user.role === 'admin'`
- Unten: Username + Logout-Button

**✓ Done when:**
- [ ] Aktiver Menüpunkt visuell hervorgehoben
- [ ] Admin-Eintrag nur für Admin-User sichtbar
- [ ] Logout löscht Token, Redirect auf /login

---

### WP-4.4 · Kampagnen-Liste
**Ziel:** Übersichtstabelle aller Kampagnen mit Status und Kennzahlen.  
**Deps:** WP-3.1, WP-4.3  
**Files:** `client/src/pages/CampaignsPage.tsx`, `client/src/components/CampaignTable.tsx`

**Spalten:** Name | Status | Tagesbudget | Impressionen | Klicks | CTR | Ø CPC | Kosten | Conversions | Aktionen  
**UI nach Spec (Abschnitte 7, 8, 19, 20):**
- Header `bg-google-gray-panel`, 12px uppercase, `border-b-2 border-google-gray-light`, h=48px
- Zeilen h=52px, hover `bg-google-gray-panel`, `border-b border-google-gray-light`
- Zahlen rechts ausgerichtet, `de-DE`-Locale (4.210 / 1,33 € / 3,2 %)
- Status-Chip inline klickbar → Dropdown (Aktivieren/Pausieren): grün/grau/orange/rot nach Spec Abschnitt 8
- Name-Spalte: farbiger Dot + blauer Link-Text, Klick → `/campaigns/:id`
- Checkbox erscheint erst bei Row-Hover (wie Google Ads)
- Sortierbare Spalten: Pfeil-Icon, aktiv = blau
- Sticky Header beim Scrollen
- Leer-State: Icon + "Erste Kampagne erstellen" + Primary-Button (Spec Abschnitt 19)
- Filter-Bar über der Tabelle: `[+ Filter]` Chip + Suchfeld (Spec Abschnitt 14)

**✓ Done when:**
- [ ] Leere Liste zeigt leeren State mit CTA (Spec Abschnitt 19)
- [ ] Klick auf Kampagne → `/campaigns/:id`
- [ ] Status-Toggle direkt in Zeile ohne Seitenaufruf
- [ ] Alle Zahlen `de-DE` formatiert
- [ ] Header sticky, Sortierung funktioniert
- [ ] Löschen: Modal-Dialog (Spec Abschnitt 15) → DELETE → Liste aktualisiert

---

### WP-4.5 · Kampagnen-Editor
**Ziel:** Formular zum Anlegen und Bearbeiten einer Kampagne (Einstellungen + Anzeigengruppen).  
**Deps:** WP-3.1, WP-4.4  
**Files:** `client/src/pages/CampaignEditorPage.tsx`, `client/src/components/CampaignEditor.tsx`, `client/src/components/AdGroupEditor.tsx`

**Tab 1 — Einstellungen:**
- Kampagnenname (required)
- Netzwerk: Radio (Suchnetzwerk | Such- + Displaynetzwerk)
- Monatsbudget: Zahl-Input → zeigt "→ Tagesbudget: X €" live
- Gebotsstrategie: Radio (Manueller CPC | Conversions maximieren)

**Tab 2 — Anzeigengruppen:**
- Liste vorhandener Gruppen (Name, max. CPC, QS)
- "+ Anzeigengruppe" → Inline-Formular: Name, max_cpc, landing_page_experience (Schlecht/Durchschnittlich/Hervorragend), qs_expected_ctr/ad_relevance/landing_page (below/average/above)
- Berechneter QS wird live angezeigt: `round((ctrmid+relmid+lpmid)/3)`

**✓ Done when:**
- [ ] Neue Kampagne anlegen, Gruppe hinzufügen → in DB vorhanden
- [ ] Tagesbudget-Anzeige aktualisiert sich bei Eingabe ohne Submit
- [ ] QS-Vorschau aktualisiert sich live

---

### WP-4.6 · Keyword-Editor
**Ziel:** Keywords mit Match-Type buchen, Live-Einfügung mit Feedback.  
**Deps:** WP-3.2, WP-4.5  
**Files:** `client/src/components/KeywordEditor.tsx`

**Layout:**
- Dropdown: Anzeigengruppe wählen
- Textarea: ein Keyword pro Zeile
- Match-Type-Radio: Broad / Phrase / Exact
- Max. CPC-Input
- "Keywords speichern" Button
- Negatives-Keywords-Bereich: eigene Textarea + Speichern

**Nach Speichern:**
- Toast-Notification für jedes Keyword mit `wasInserted: true`: "Keyword 'XYZ' wurde neu erkannt und der Datenbank hinzugefügt."
- Bestehende Keywords werden ohne Toast eingefügt

**✓ Done when:**
- [ ] Unbekanntes Keyword → Toast erscheint
- [ ] Keywords erscheinen in Anzeigengruppe nach Speichern
- [ ] Negatives Keyword wird separat gespeichert und angezeigt

---

### WP-4.7 · Dashboard + Charts
**Ziel:** Vollständiges Ergebnis-Dashboard nach Simulation.  
**Deps:** WP-3.3, WP-1.4, WP-4.4  
**Files:** `client/src/pages/DashboardPage.tsx`, `client/src/components/Dashboard.tsx`, `client/src/components/AuctionChart.tsx`

**Aufbau (Spec Abschnitte 10, 11, 8):**
- Status-Banner: orange wenn `budget_exhausted` (`bg-google-orange-bg border-l-4 border-google-orange`), grün wenn `running`
- KPI-Kacheln 3×2-Grid (Spec Abschnitt 10): `bg-white border border-google-gray-light rounded-lg p-5`; Wert 28px/400, Label 12px #5f6368
  - Impressionen | Klicks | Ø CPC | Gesamtkosten | Ø Position | Conversion-Rate
- Recharts LineChart (Spec Abschnitt 11): Klicks=`#1a73e8`, Kosten=`#f9ab00`, Grid `#dadce0`, Tooltip weiß mit Border
  - Budget-Erschöpfungs-`<ReferenceLine>` in Orange, gestrichelt
- Konkurrenz-Tabelle (gleiche Styles wie Kampagnen-Tabelle): Player-Zeile `bg-google-blue-faint font-medium`
- Simulations-Log: Liste mit `font-size: 13px`, Uhrzeit grau, Ereignis-Text `#202124`
- Buttons Footer: "Kampagne bearbeiten" (Sekundär) | "Neu simulieren" (Primär)

**✓ Done when:**
- [ ] Chart zeigt 24 Datenpunkte nach Simulation
- [ ] Budget-Erschöpfungs-Linie erscheint zum korrekten Zeitpunkt
- [ ] "Neu simulieren" → lädt Seite neu, startet nicht automatisch

---

### WP-4.8 · Admin-Panel
**Ziel:** Ausbilder-Interface für User-Übersicht, Konkurrenten und DataSource-Konfiguration.  
**Deps:** WP-3.4, WP-4.1  
**Files:** `client/src/pages/AdminPage.tsx`, `client/src/components/AdminPanel.tsx`

**Tabs:**
1. **Azubi-Übersicht**: Tabelle (Name, Email, Kampagnen-Anzahl, Gesamt-Budget)
2. **Konkurrenten**: Drei Karten (Der Riese / Discounter / Smarte) mit editierbaren Feldern: base_bid, quality_score, daily_budget (NULL=unbegrenzt), active_hours_start, active_hours_end → Speichern-Button
3. **DataSource-Status**: Drei Ampeln (Google/OpenThesaurus/Wikipedia) + "Jetzt testen"-Button → GET /admin/datasources/status
4. **Szenarien**: Liste + "+ Neues Szenario" (Name, Beschreibung, JSON-Config-Editor)

Route-Guard: Redirect auf /campaigns wenn `user.role !== 'admin'`

**✓ Done when:**
- [ ] Trainee sieht /admin nicht (Sidebar) und wird redirectet
- [ ] Konkurrent editieren → Werte in DB geändert
- [ ] DataSource-Test zeigt reales Ergebnis (keine Hardcoded-Ampeln)

---

### WP-4.9 · Keyword-Planer
**Ziel:** Keyword-Ideen-Tool analog zu Google Keyword Planner.  
**Deps:** WP-3.5, WP-4.3  
**Files:** `client/src/pages/KeywordPlannerPage.tsx`, `client/src/components/KeywordPlanner.tsx`, `client/src/components/KeywordGroupTree.tsx`

**Layout:**
- Suchfeld (Seed-Keyword) + Suchen-Button
- Ergebnistabelle: Keyword | Ø Suchvolumen | Ø CPC | Intent-Icon (🛒🔍🧭📖)
- Checkbox pro Zeile + "Zur Kampagne hinzufügen"-Button → öffnet Dropdown: Kampagne + Anzeigengruppe wählen + Match-Type
- Linke Sidebar: `KeywordGroupTree` (verschachtelter Baum, Klick filtert Tabelle auf Gruppe)

**✓ Done when:**
- [ ] Suche nach "sneaker" → zeigt relevante Keywords
- [ ] Klick auf Gruppe → Tabelle filtert auf Gruppen-Mitglieder
- [ ] "Zur Kampagne hinzufügen" → POST /campaigns/:id/keywords → Toast

---

## Phase 5 — Erweiterungen

### WP-5.1 · Negative Keywords (bereits in WP-3.2 + WP-4.6 vorbereitet)
**Ziel:** Negative Keywords werden in der Simulation berücksichtigt.  
**Deps:** WP-1.2, WP-4.6 (negative_keywords-Tabelle aus WP-0.2 bereits vorhanden)  
**Files:** `server/src/services/auction.engine.ts` (Anpassung)

**Implementierung:**
- In `runSimulation()`: vor Stunden-Loop alle `negative_keywords` der Kampagne laden
- In der Keyword-Schleife: `if (negatives.some(n => keyword.keyword.includes(n.keyword))) continue;`
- Frontend (bereits in WP-4.6): Textarea für Negatives, GET/POST/DELETE Endpunkte (bereits in WP-3.2)

**✓ Done when:**
- [ ] Kampagne mit Keyword "sneaker kaufen" + Negatives-KW "kaufen" → Keyword wird nicht simuliert
- [ ] Ohne Negatives-KW: keine Auswirkung auf Simulation

---

### WP-5.2 · Szenario-Service
**Ziel:** Ausbilder kann aktive Szenarien setzen, die Konkurrenten-Verhalten überschreiben.  
**Deps:** WP-3.4, WP-4.8  
**Files:** `server/src/services/scenario.service.ts`

**Implementierung:**
- `scenarios.config`-JSON-Schema: `{ competitorOverrides: [{id, base_bid?, quality_score?, daily_budget?, active_hours?}], marketConditions: { baseCpcMultiplier?: number } }`
- `ScenarioService.getActiveConfig()`: liest aktives Szenario aus DB (Flag `active: boolean` auf scenarios-Tabelle)
- `AuctionEngine` liest beim Simulation-Start `ScenarioService.getActiveConfig()` und wendet Overrides auf Competitor-Profile an (nur für diese Simulation, kein DB-Schreiben der Overrides)

**✓ Done when:**
- [ ] Szenario aktivieren, Simulation starten → Konkurrenten verhalten sich gemäß Override
- [ ] Szenario deaktivieren → Simulation nutzt Standard-Werte aus competitor_profiles

---

### WP-5.3 · LLM-Integration (optional)
**Ziel:** Optionale Qualitätsverbesserung der Keyword-Analyse durch LLM.  
**Deps:** WP-2.3, WP-3.4  
**Files:** `server/src/services/datasource/llm.ts`

**Implementierung:**
- `isLLMConfigured(): boolean` — prüft `process.env.LLM_PROVIDER`
- `callLLM(systemPrompt, userPrompt): Promise<string|null>` — unterstützt openai/ollama/anthropic, gibt null bei Fehler
- System-Prompt: SEA-Experte, analysiert Keyword + Autocomplete-Ergebnisse, antwortet als JSON: `{ groupName, intent, intentReason, suggestedKeywords, volumePlausibility }`
- `manager.ts`: wenn `isLLMConfigured()`, nach den drei APIs ein LLM-Call, verfeinert groupName + intent, fügt intentReason ins heuristic_data-JSON ein
- `intentReason` wird in Frontend-Toast bei heuristisch eingefügten Keywords angezeigt (WP-4.6)
- Admin-Panel (WP-4.8): LLM-Config-UI (Provider-Auswahl, API-Key, Modell) → PUT /admin/datasources/config

**✓ Done when:**
- [ ] `LLM_PROVIDER=` leer → kein LLM-Call, kein Fehler
- [ ] `LLM_PROVIDER=ollama` + Ollama läuft → intentReason in heuristic_data vorhanden
- [ ] LLM antwortet invalides JSON → Fallback auf API-Ergebnisse ohne Crash

---

## Parallelisierungshinweise

| Zeitpunkt | Parallel möglich |
|---|---|
| Nach WP-0.3 | WP-1.1 + WP-2.2 gleichzeitig |
| Nach WP-0.3 + WP-1.1 | WP-1.2 + WP-2.1 gleichzeitig |
| Nach WP-0.3 | WP-1.3 parallel zu WP-1.2 |
| Nach WP-0.4 | WP-3.1 bis WP-3.5 weitgehend parallel (wenn jeweilige Services fertig) |
| Nach WP-4.1 | WP-4.2 + WP-4.3 parallel |
| Nach WP-4 Kern | WP-5.1 + WP-5.2 + WP-5.3 parallel |

---

*Letzte Aktualisierung: 2026-06-02 — 24 Arbeitspakete total*
