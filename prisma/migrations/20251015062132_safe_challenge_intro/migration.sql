-- 🔐 0) Vorbereitung (nur Stage): Hilfsdatensätze für Backfills
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User" WHERE "email" = 'legacy@example.com') THEN
    INSERT INTO "User" ("id","name","nameId","email","emailVerified","password","createdAt")
    VALUES ('00000000-0000-0000-0000-000000000001','Legacy User','legacy-user','legacy@example.com', true, 'legacy-migrated', now());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Group") THEN
    INSERT INTO "Group" ("id","name","nameId")
    VALUES ('00000000-0000-0000-0000-000000000002','Legacy Group','legacy-group');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Posting" WHERE "id" = '00000000-0000-0000-0000-000000000003') THEN
    INSERT INTO "Posting" ("id","date","text","userId","visibility","season")
    VALUES ('00000000-0000-0000-0000-000000000003', now(), 'Legacy Posting', '00000000-0000-0000-0000-000000000001', 'protected', 'legacy');
  END IF;
END $$;

-- 1) Comment: neue Pflichtspalten optional anlegen, befüllen, dann NOT NULL
ALTER TABLE "Comment"
  ADD COLUMN IF NOT EXISTS "postingId" UUID,
  ADD COLUMN IF NOT EXISTS "userId" UUID;

UPDATE "Comment"
SET "postingId" = COALESCE("postingId", '00000000-0000-0000-0000-000000000003'),
    "userId"    = COALESCE("userId",    '00000000-0000-0000-0000-000000000001')
WHERE ("postingId" IS NULL OR "userId" IS NULL);

ALTER TABLE "Comment"
  ALTER COLUMN "postingId" SET NOT NULL,
  ALTER COLUMN "userId"    SET NOT NULL;

-- 2) Group: nameId hinzufügen, befüllen, dann NOT NULL
ALTER TABLE "Group"
  ADD COLUMN IF NOT EXISTS "nameId" TEXT;

UPDATE "Group"
SET "nameId" = LOWER(REGEXP_REPLACE("name", '[^a-z0-9]+', '-', 'g'))
WHERE "nameId" IS NULL OR "nameId" = '';

ALTER TABLE "Group"
  ALTER COLUMN "nameId" SET NOT NULL;

-- 3) Reaction.type: Enum/Typ-Wechsel sicher via Temp-Spalte
ALTER TABLE "Reaction" ADD COLUMN IF NOT EXISTS "type_text" TEXT;
UPDATE "Reaction" SET "type_text" = "type"::text WHERE "type_text" IS NULL;
ALTER TABLE "Reaction" DROP COLUMN "type";
ALTER TABLE "Reaction" RENAME COLUMN "type_text" TO "type";

-- 4) RunningStatistic: fehlende Pflichtspalten mit Default 0 anlegen
ALTER TABLE "RunningStatistic"
  ADD COLUMN IF NOT EXISTS "distanceInMeters" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "durationInSeconds" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "numberOfRuns" INTEGER DEFAULT 0;

ALTER TABLE "RunningStatistic"
  ALTER COLUMN "distanceInMeters" SET NOT NULL,
  ALTER COLUMN "durationInSeconds" SET NOT NULL,
  ALTER COLUMN "numberOfRuns" SET NOT NULL;

-- 5) User: nameId + password hinzufügen, befüllen, dann NOT NULL
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "nameId" TEXT,
  ADD COLUMN IF NOT EXISTS "password" TEXT;

UPDATE "User"
SET "nameId" = COALESCE(
  NULLIF(LOWER(REGEXP_REPLACE("name",  '[^a-z0-9]+','-','g')), ''),
  NULLIF(LOWER(REGEXP_REPLACE("email", '[^a-z0-9]+','-','g')), ''),
  'user-' || SUBSTRING("id"::text, 1, 8)
)
WHERE "nameId" IS NULL OR "nameId" = '';

UPDATE "User"
SET "password" = COALESCE("password",'legacy-migrated')
WHERE "password" IS NULL OR "password" = '';

ALTER TABLE "User"
  ALTER COLUMN "nameId" SET NOT NULL,
  ALTER COLUMN "password" SET NOT NULL;

-- (FKs/Indizes/Unique-Constraints werden durch Prisma gemäß aktuellem Schema ergänzt)
