-- SEA-AdArena Simulator — Datenbankschema
-- Zeichensatz: utf8mb4, Engine: InnoDB
-- Import: mysql -u sea_user -p sea_adarena < docs/schema.sql

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)      NOT NULL,
  `email`         VARCHAR(255)     NOT NULL,
  `password_hash` VARCHAR(255)     NOT NULL,
  `role`          ENUM('admin','trainee') NOT NULL DEFAULT 'trainee',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id`                   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`              INT UNSIGNED  NOT NULL,
  `name`                 VARCHAR(200)  NOT NULL,
  `status`               ENUM('running','paused','budget_exhausted','ended')
                                       NOT NULL DEFAULT 'paused',
  `daily_budget`         DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
  `monthly_budget`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `bid_strategy`         ENUM('manual_cpc','maximize_conversions')
                                       NOT NULL DEFAULT 'manual_cpc',
  `network`              ENUM('search','search_display')
                                       NOT NULL DEFAULT 'search',
  `start_date`           DATE          NULL,
  `budget_exhausted_at`  TIME          NULL,
  `impressions`          INT UNSIGNED  NOT NULL DEFAULT 0,
  `clicks`               INT UNSIGNED  NOT NULL DEFAULT 0,
  `cost`                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `conversions`          INT UNSIGNED  NOT NULL DEFAULT 0,
  `avg_position`         DECIMAL(3,1)  NOT NULL DEFAULT 0.0,
  `created_at`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaigns_user_id` (`user_id`),
  CONSTRAINT `fk_campaigns_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ad_groups
-- ============================================================
CREATE TABLE IF NOT EXISTS `ad_groups` (
  `id`                      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `campaign_id`             INT UNSIGNED  NOT NULL,
  `name`                    VARCHAR(200)  NOT NULL,
  `max_cpc`                 DECIMAL(6,2)  NOT NULL DEFAULT 1.00,
  `quality_score`           TINYINT UNSIGNED NOT NULL DEFAULT 5,
  `qs_expected_ctr`         ENUM('below','average','above') NOT NULL DEFAULT 'average',
  `qs_ad_relevance`         ENUM('below','average','above') NOT NULL DEFAULT 'average',
  `qs_landing_page`         ENUM('below','average','above') NOT NULL DEFAULT 'average',
  `landing_page_experience` ENUM('poor','average','excellent') NOT NULL DEFAULT 'average',
  PRIMARY KEY (`id`),
  KEY `idx_ad_groups_campaign_id` (`campaign_id`),
  CONSTRAINT `fk_ad_groups_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- keywords  (Stammdatenpool + Live-Einfügung via Heuristik)
-- ============================================================
CREATE TABLE IF NOT EXISTS `keywords` (
  `id`                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `keyword`               VARCHAR(255)  NOT NULL,
  `monthly_search_volume` INT UNSIGNED  NOT NULL DEFAULT 0,
  `base_cpc`              DECIMAL(4,2)  NOT NULL DEFAULT 0.50,
  `intent_category`       ENUM('informational','transactional','commercial','navigational')
                                        NOT NULL DEFAULT 'commercial',
  `intent_source`         ENUM('seed','heuristic') NOT NULL DEFAULT 'seed',
  `competition_level`     ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  `seasonality_factors`   JSON          NOT NULL,
  `heuristic_data`        JSON          NULL,
  `created_at`            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_keywords_keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- campaign_keywords  (Zuordnung Keyword → Anzeigengruppe + Match-Type)
-- ============================================================
CREATE TABLE IF NOT EXISTS `campaign_keywords` (
  `id`                    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `ad_group_id`           INT UNSIGNED  NOT NULL,
  `keyword_id`            INT UNSIGNED  NOT NULL,
  `match_type`            ENUM('broad','phrase','exact') NOT NULL DEFAULT 'phrase',
  `max_cpc_override`      DECIMAL(6,2)  NULL,
  `generated_by_heuristic` BOOLEAN      NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ck_adgroup_keyword` (`ad_group_id`, `keyword_id`),
  KEY `idx_ck_keyword_id` (`keyword_id`),
  CONSTRAINT `fk_ck_ad_group`
    FOREIGN KEY (`ad_group_id`) REFERENCES `ad_groups` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ck_keyword`
    FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- negative_keywords
-- ============================================================
CREATE TABLE IF NOT EXISTS `negative_keywords` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id` INT UNSIGNED NOT NULL,
  `keyword`     VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_nk_campaign_id` (`campaign_id`),
  CONSTRAINT `fk_nk_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- keyword_groups  (Themen-Cluster, selbstreferenzierende Hierarchie)
-- ============================================================
CREATE TABLE IF NOT EXISTS `keyword_groups` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(100)  NOT NULL,
  `description`    VARCHAR(255)  NULL,
  `parent_group_id` INT UNSIGNED NULL,
  `default_intent` ENUM('informational','transactional','commercial','navigational') NULL,
  `icon`           VARCHAR(50)   NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kg_parent` (`parent_group_id`),
  CONSTRAINT `fk_kg_parent`
    FOREIGN KEY (`parent_group_id`) REFERENCES `keyword_groups` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- keyword_group_members  (N:M Keyword ↔ Gruppe)
-- ============================================================
CREATE TABLE IF NOT EXISTS `keyword_group_members` (
  `id`                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `keyword_id`        INT UNSIGNED  NOT NULL,
  `group_id`          INT UNSIGNED  NOT NULL,
  `relationship_type` ENUM('primary','synonym','broader','narrower','related')
                                    NOT NULL DEFAULT 'related',
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_kgm_keyword_group` (`keyword_id`, `group_id`),
  KEY `idx_kgm_group_id` (`group_id`),
  CONSTRAINT `fk_kgm_keyword`
    FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_kgm_group`
    FOREIGN KEY (`group_id`) REFERENCES `keyword_groups` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- competitor_profiles  (KI-Konkurrenten)
-- ============================================================
CREATE TABLE IF NOT EXISTS `competitor_profiles` (
  `id`                  TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`                VARCHAR(100)     NOT NULL,
  `strategy_label`      VARCHAR(50)      NOT NULL,
  `base_bid`            DECIMAL(6,2)     NOT NULL,
  `quality_score`       TINYINT UNSIGNED NOT NULL,
  `daily_budget`        DECIMAL(8,2)     NULL COMMENT 'NULL = unbegrenzt',
  `active_hours_start`  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `active_hours_end`    TINYINT UNSIGNED NOT NULL DEFAULT 23,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- auction_results  (pro Keyword, Stunde und Bieter)
-- ============================================================
CREATE TABLE IF NOT EXISTS `auction_results` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `campaign_id`  INT UNSIGNED    NOT NULL,
  `keyword_id`   INT UNSIGNED    NOT NULL,
  `hour`         TINYINT UNSIGNED NOT NULL,
  `bidder_type`  ENUM('player','competitor') NOT NULL,
  `bidder_id`    INT             NOT NULL,
  `ad_rank`      DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
  `impressions`  INT UNSIGNED    NOT NULL DEFAULT 0,
  `clicks`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `cost`         DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
  `avg_position` DECIMAL(3,1)    NOT NULL DEFAULT 0.0,
  PRIMARY KEY (`id`),
  KEY `idx_ar_campaign_id` (`campaign_id`),
  KEY `idx_ar_keyword_id`  (`keyword_id`),
  KEY `idx_ar_hour`        (`hour`),
  CONSTRAINT `fk_ar_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ar_keyword`
    FOREIGN KEY (`keyword_id`) REFERENCES `keywords` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- hourly_stats  (Dashboard-Aggregat pro Stunde)
-- ============================================================
CREATE TABLE IF NOT EXISTS `hourly_stats` (
  `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `campaign_id`      INT UNSIGNED    NOT NULL,
  `hour`             TINYINT UNSIGNED NOT NULL,
  `impressions`      INT UNSIGNED    NOT NULL DEFAULT 0,
  `clicks`           INT UNSIGNED    NOT NULL DEFAULT 0,
  `cost`             DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
  `avg_position`     DECIMAL(3,1)    NOT NULL DEFAULT 0.0,
  `budget_remaining` DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
  `conversions`      INT UNSIGNED    NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hs_campaign_hour` (`campaign_id`, `hour`),
  CONSTRAINT `fk_hs_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- simulation_log  (Lern-Audit-Trail, deutschsprachige Ereignisse)
-- ============================================================
CREATE TABLE IF NOT EXISTS `simulation_log` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `campaign_id` INT UNSIGNED     NOT NULL,
  `hour`        TINYINT UNSIGNED NOT NULL,
  `event_type`  VARCHAR(50)      NOT NULL,
  `message`     TEXT             NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sl_campaign_id` (`campaign_id`),
  CONSTRAINT `fk_sl_campaign`
    FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- scenarios  (Ausbilder-Szenarien)
-- ============================================================
CREATE TABLE IF NOT EXISTS `scenarios` (
  `id`          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)     NOT NULL,
  `description` TEXT             NULL,
  `config`      JSON             NOT NULL,
  `active`      BOOLEAN          NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed: Drei KI-Konkurrenten
-- ============================================================
INSERT INTO `competitor_profiles`
  (`id`, `name`, `strategy_label`, `base_bid`, `quality_score`, `daily_budget`,
   `active_hours_start`, `active_hours_end`)
VALUES
  (1, 'Der Riese',      'Marktführer',      2.20, 8, NULL,  0, 23),
  (2, 'Der Discounter', 'Low-Budget',        0.60, 3, 20.00, 6, 10),
  (3, 'Der Smarte',     'Qualitätsfokus',   1.30, 9, 100.00, 8, 22)
ON DUPLICATE KEY UPDATE
  `name`               = VALUES(`name`),
  `strategy_label`     = VALUES(`strategy_label`),
  `base_bid`           = VALUES(`base_bid`),
  `quality_score`      = VALUES(`quality_score`),
  `daily_budget`       = VALUES(`daily_budget`),
  `active_hours_start` = VALUES(`active_hours_start`),
  `active_hours_end`   = VALUES(`active_hours_end`);

SET foreign_key_checks = 1;
