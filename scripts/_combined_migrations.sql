-- ===== 003 =====
-- Push subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  min_wind integer not null default 15,
  alert_day_before boolean not null default true,
  alert_morning boolean not null default true,
  offshore_warnings boolean not null default true,
  created_at timestamp with time zone default now(),
  last_notified_at timestamp with time zone,
  last_notification_tag text
);

create index if not exists push_subscriptions_endpoint_idx on push_subscriptions(endpoint);

-- Notification log to avoid duplicates per session window
create table if not exists push_notifications_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references push_subscriptions(id) on delete cascade,
  window_key text not null,
  sent_at timestamp with time zone default now()
);

create unique index if not exists push_notifications_unique
  on push_notifications_log(subscription_id, window_key);

-- Nota: les taules wind_calibration / calibration_factors han estat eliminades.
-- El calibratge ara és automàtic i s'emmagatzema en local (.calibration-state.json).
