-- WorthIt ledger. Column names match the JSON the server writes.
-- Run this in the Supabase SQL editor, then set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

create table if not exists users (
  id text primary key,
  "pairCode" text not null,
  "consentAt" timestamptz,
  place text,
  latitude double precision,
  longitude double precision,
  "tzOffsetMinutes" integer default 0,
  "createdAt" timestamptz not null
);

create table if not exists scans (
  id text primary key,
  "userId" text not null references users (id) on delete cascade,
  "createdAt" timestamptz not null,
  purpose text not null,
  mode text not null,
  gated boolean not null,
  "lightLabel" text,
  "groupId" text,
  "latencyMs" integer not null,
  cached boolean not null,
  "taskId" text,
  "imageFile" text
);

create table if not exists concern_scores (
  id text primary key,
  "scanId" text not null,
  "userId" text not null,
  concern text not null,
  raw double precision not null,
  ui double precision,
  region text,
  "maskFile" text,
  "left" double precision,
  "right" double precision
);

create table if not exists events (
  id text primary key,
  "userId" text not null,
  "createdAt" timestamptz not null,
  type text not null,
  payload jsonb
);

create table if not exists trials (
  id text primary key,
  "userId" text not null,
  "productName" text not null,
  active text,
  concern text not null,
  design text not null,
  "startedOn" date not null,
  "claimText" text,
  "claimDelta" double precision,
  "createdAt" timestamptz not null
);

create table if not exists products (
  id text primary key,
  "userId" text not null,
  "createdAt" timestamptz not null,
  name text,
  "claimText" text,
  concern text,
  barcode text,
  "requestedIntensity" double precision,
  "measuredDelta" double precision,
  mdc double precision,
  decision text,
  "renderFile" text
);

create table if not exists nights (
  id text primary key,
  "userId" text not null,
  day date not null,
  "sleepHours" double precision,
  "sleepScore" double precision,
  rmssd double precision,
  "restingHr" double precision,
  humidity double precision,
  "cyclePhase" text
);

create table if not exists gestures (
  id text primary key,
  "userId" text not null,
  "createdAt" timestamptz not null,
  label text not null,
  predicted text not null
);

alter table users enable row level security;
alter table scans enable row level security;
alter table concern_scores enable row level security;
alter table events enable row level security;
alter table trials enable row level security;
alter table products enable row level security;
alter table nights enable row level security;
alter table gestures enable row level security;
