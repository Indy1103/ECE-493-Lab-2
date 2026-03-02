CREATE TABLE registration_price_lists (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  published_at TIMESTAMPTZ NULL,
  effective_from DATE NULL,
  effective_to DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT registration_price_lists_published_requires_timestamp
    CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL),
  CONSTRAINT registration_price_lists_effective_window
    CHECK (
      effective_from IS NULL
      OR effective_to IS NULL
      OR effective_to >= effective_from
    )
);

CREATE UNIQUE INDEX registration_price_lists_single_published_idx
  ON registration_price_lists ((status))
  WHERE status = 'PUBLISHED';

CREATE TABLE registration_prices (
  id UUID PRIMARY KEY,
  price_list_id UUID NOT NULL REFERENCES registration_price_lists (id) ON DELETE CASCADE,
  attendance_type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX registration_prices_price_list_idx
  ON registration_prices (price_list_id);

CREATE UNIQUE INDEX registration_prices_unique_attendance_type_idx
  ON registration_prices (price_list_id, attendance_type);
