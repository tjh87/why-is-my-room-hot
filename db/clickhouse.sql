CREATE DATABASE IF NOT EXISTS hotroom;
CREATE TABLE IF NOT EXISTS hotroom.apartment_events (event_id UUID, room_id String, event_type LowCardinality(String), temperature Nullable(Float64), action Nullable(String), amount_cents Nullable(Int64), payload String, occurred_at DateTime64(3, 'UTC')) ENGINE = MergeTree() ORDER BY (room_id, occurred_at);
