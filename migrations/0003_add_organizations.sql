-- Create issue categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS "issue_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text
);

-- Create predefined organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "predefined_organizations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "category_id" integer NOT NULL REFERENCES "issue_categories"("id"),
  "description" text
);

-- Insert issue categories if they don't exist
INSERT INTO "issue_categories" ("name", "description")
SELECT 'Waterlogging & Drainage Issues', 'Issues related to waterlogging and drainage systems'
WHERE NOT EXISTS (SELECT 1 FROM "issue_categories" WHERE "name" = 'Waterlogging & Drainage Issues');

INSERT INTO "issue_categories" ("name", "description")
SELECT 'Garbage Overflow & Waste Management', 'Issues related to waste management and garbage collection'
WHERE NOT EXISTS (SELECT 1 FROM "issue_categories" WHERE "name" = 'Garbage Overflow & Waste Management');

INSERT INTO "issue_categories" ("name", "description")
SELECT 'Road Maintenance & Potholes', 'Issues related to road maintenance and potholes'
WHERE NOT EXISTS (SELECT 1 FROM "issue_categories" WHERE "name" = 'Road Maintenance & Potholes');

INSERT INTO "issue_categories" ("name", "description")
SELECT 'Unmaintained Public Places', 'Issues related to parks, playgrounds, and footpaths'
WHERE NOT EXISTS (SELECT 1 FROM "issue_categories" WHERE "name" = 'Unmaintained Public Places');

INSERT INTO "issue_categories" ("name", "description")
SELECT 'Streetlight & Electricity Issues', 'Issues related to streetlights and electricity'
WHERE NOT EXISTS (SELECT 1 FROM "issue_categories" WHERE "name" = 'Streetlight & Electricity Issues');

INSERT INTO "issue_categories" ("name", "description")
SELECT 'Broken Pipelines & Water Supply Issues', 'Issues related to water supply and pipelines'
WHERE NOT EXISTS (SELECT 1 FROM "issue_categories" WHERE "name" = 'Broken Pipelines & Water Supply Issues');

-- Insert predefined organizations if they don't exist
-- Waterlogging & Drainage Issues
INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'BMC Stormwater Drain Department', 1, 'Responsible for stormwater drainage in Mumbai'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'BMC Stormwater Drain Department');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Public Works Department (PWD)', 1, 'State-level public works department'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Public Works Department (PWD)');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Maharashtra Jeevan Pradhikaran (MJP)', 1, 'Water supply and sanitation authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Maharashtra Jeevan Pradhikaran (MJP)');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Mumbai Metropolitan Region Development Authority (MMRDA)', 1, 'Regional development authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Mumbai Metropolitan Region Development Authority (MMRDA)');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'State Urban Development Authority (SUDA)', 1, 'State urban development authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'State Urban Development Authority (SUDA)');

-- Garbage Overflow & Waste Management
INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'BMC Solid Waste Management Department', 2, 'Municipal solid waste management'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'BMC Solid Waste Management Department');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Maharashtra Pollution Control Board (MPCB)', 2, 'State pollution control authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Maharashtra Pollution Control Board (MPCB)');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Swachh Bharat Abhiyan (SBA) Local Ward Office', 2, 'Local cleanliness initiative office'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Swachh Bharat Abhiyan (SBA) Local Ward Office');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Municipal Corporation Waste Management Division', 2, 'Municipal waste management division'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Municipal Corporation Waste Management Division');

-- Road Maintenance & Potholes
INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Municipal Road Maintenance Department', 3, 'Municipal road maintenance authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Municipal Road Maintenance Department');

-- Unmaintained Public Places
INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'BMC - Garden & Recreation Department', 4, 'Municipal garden and recreation authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'BMC - Garden & Recreation Department');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Mumbai Urban Development Authority (MUDA)', 4, 'Urban development authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Mumbai Urban Development Authority (MUDA)');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Municipal Park Maintenance Division', 4, 'Municipal park maintenance authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Municipal Park Maintenance Division');

-- Streetlight & Electricity Issues
INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Maharashtra State Electricity Board (MSEB)', 5, 'State electricity board'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Maharashtra State Electricity Board (MSEB)');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Tata Power', 5, 'Private power distribution company'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Tata Power');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Adani Electricity Mumbai', 5, 'Private power distribution company'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Adani Electricity Mumbai');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'Local Municipal Electricity Department', 5, 'Municipal electricity department'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'Local Municipal Electricity Department');

-- Broken Pipelines & Water Supply Issues
INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'BMC Water Supply Department', 6, 'Municipal water supply authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'BMC Water Supply Department');

INSERT INTO "predefined_organizations" ("name", "category_id", "description")
SELECT 'City Water Management Authorities', 6, 'City water management authority'
WHERE NOT EXISTS (SELECT 1 FROM "predefined_organizations" WHERE "name" = 'City Water Management Authorities'); 