import 'dotenv/config';
import con from '../config/database.js';

async function createTables() {
  const ddl = `
    -- Create tables
    CREATE TABLE IF NOT EXISTS tbl_user (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      social_id VARCHAR(255),
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      country_code VARCHAR(20) DEFAULT '',
      mobile_number VARCHAR(50) DEFAULT '',
      password TEXT,
      login_type CHAR(1),
      otp VARCHAR(20),
      otp_expiry TIMESTAMPTZ,
      forgot_token TEXT,
      forgot_expiry TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      is_online BOOLEAN DEFAULT FALSE,
      is_delete BOOLEAN DEFAULT FALSE,
      is_verify BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Indexes on tbl_user
    CREATE INDEX IF NOT EXISTS idx_tbl_user_social_id ON tbl_user (social_id);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_first_name ON tbl_user (first_name);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_last_name ON tbl_user (last_name);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_email ON tbl_user (email);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_mobile_number ON tbl_user (mobile_number);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_is_active_is_delete ON tbl_user (is_active, is_delete);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_is_delete ON tbl_user (is_delete);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_is_verify ON tbl_user (is_verify);

    CREATE TABLE IF NOT EXISTS tbl_user_device (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL,
      token TEXT,
      device_name VARCHAR(255),
      device_type CHAR(1),
      device_token TEXT,
      model_name VARCHAR(255),
      uuid VARCHAR(255),
      os_version VARCHAR(50),
      ip VARCHAR(100),
      language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Function to auto-update updated_at
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Triggers (idempotent via DO block)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_timestamp_tbl_user'
      ) THEN
        CREATE TRIGGER set_timestamp_tbl_user
        BEFORE UPDATE ON tbl_user
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END;
    $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_timestamp_tbl_user_device'
      ) THEN
        CREATE TRIGGER set_timestamp_tbl_user_device
        BEFORE UPDATE ON tbl_user_device
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      END IF;
    END;
    $$;

    -- Indexes on tbl_user_device
    CREATE INDEX IF NOT EXISTS idx_tbl_user_device_user ON tbl_user_device (user_id);
    CREATE INDEX IF NOT EXISTS idx_tbl_user_device_token ON tbl_user_device (token);

    -- Create country table with comprehensive schema
CREATE TABLE IF NOT EXISTS tbl_country (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  iso3 CHAR(3),
  numeric_code CHAR(3),
  iso2 CHAR(2),
  phonecode VARCHAR(255),
  capital VARCHAR(255),
  currency VARCHAR(255),
  currency_name VARCHAR(255),
  currency_symbol VARCHAR(255),
  tld VARCHAR(255),
  native VARCHAR(255),
  region VARCHAR(255),
  subregion VARCHAR(255),
  timezones TEXT,
  translations TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  emoji VARCHAR(191),
  emojiU VARCHAR(191),
  image VARCHAR(128),
  flag BOOLEAN DEFAULT TRUE,
  wikiDataId VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Add indexes for commonly queried fields
  CONSTRAINT uq_country_iso2 UNIQUE (iso2),
  CONSTRAINT uq_country_iso3 UNIQUE (iso3)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_country_name ON tbl_country (name);
CREATE INDEX IF NOT EXISTS idx_country_iso2 ON tbl_country (iso2);
CREATE INDEX IF NOT EXISTS idx_country_iso3 ON tbl_country (iso3);
CREATE INDEX IF NOT EXISTS idx_country_phonecode ON tbl_country (phonecode);
CREATE INDEX IF NOT EXISTS idx_country_region ON tbl_country (region);
CREATE INDEX IF NOT EXISTS idx_country_status ON tbl_country (status);

  `;

  try {
    await con.query(ddl);
    console.log('Tables, triggers, and indexes for tbl_user and tbl_user_device are created or already exist.');
  } catch (err) {
    console.error('Error creating tables, triggers, or indexes:', err);
    process.exitCode = 1;
  } finally {
    await con.end();
  }
}

createTables();
