-- Create issue categories table
CREATE TABLE "issue_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text
);

-- Create predefined organizations table
CREATE TABLE "predefined_organizations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "category_id" integer NOT NULL REFERENCES "issue_categories"("id"),
  "description" text
);

-- Insert issue categories
INSERT INTO "issue_categories" ("name", "description") VALUES
('Waterlogging & Drainage Issues', 'Issues related to waterlogging and drainage systems'),
('Garbage Overflow & Waste Management', 'Issues related to waste management and garbage collection'),
('Road Maintenance & Potholes', 'Issues related to road maintenance and potholes'),
('Unmaintained Public Places', 'Issues related to parks, playgrounds, and footpaths'),
('Streetlight & Electricity Issues', 'Issues related to streetlights and electricity'),
('Broken Pipelines & Water Supply Issues', 'Issues related to water supply and pipelines');

-- Insert predefined organizations
INSERT INTO "predefined_organizations" ("name", "category_id", "description") VALUES
-- Waterlogging & Drainage Issues
('BMC Stormwater Drain Department', 1, 'Responsible for stormwater drainage in Mumbai'),
('Public Works Department (PWD)', 1, 'State-level public works department'),
('Maharashtra Jeevan Pradhikaran (MJP)', 1, 'Water supply and sanitation authority'),
('Mumbai Metropolitan Region Development Authority (MMRDA)', 1, 'Regional development authority'),
('State Urban Development Authority (SUDA)', 1, 'State urban development authority'),

-- Garbage Overflow & Waste Management
('BMC Solid Waste Management Department', 2, 'Municipal solid waste management'),
('Maharashtra Pollution Control Board (MPCB)', 2, 'State pollution control authority'),
('Swachh Bharat Abhiyan (SBA) Local Ward Office', 2, 'Local cleanliness initiative office'),
('Municipal Corporation Waste Management Division', 2, 'Municipal waste management division'),

-- Road Maintenance & Potholes
('Public Works Department (PWD)', 3, 'State-level public works department'),
('Mumbai Metropolitan Region Development Authority (MMRDA)', 3, 'Regional development authority'),
('Municipal Road Maintenance Department', 3, 'Municipal road maintenance authority'),

-- Unmaintained Public Places
('BMC - Garden & Recreation Department', 4, 'Municipal garden and recreation authority'),
('Mumbai Urban Development Authority (MUDA)', 4, 'Urban development authority'),
('State Urban Development Authority (SUDA)', 4, 'State urban development authority'),
('Municipal Park Maintenance Division', 4, 'Municipal park maintenance authority'),

-- Streetlight & Electricity Issues
('Maharashtra State Electricity Board (MSEB)', 5, 'State electricity board'),
('Tata Power', 5, 'Private power distribution company'),
('Adani Electricity Mumbai', 5, 'Private power distribution company'),
('Local Municipal Electricity Department', 5, 'Municipal electricity department'),

-- Broken Pipelines & Water Supply Issues
('BMC Water Supply Department', 6, 'Municipal water supply authority'),
('Maharashtra Jeevan Pradhikaran (MJP)', 6, 'Water supply and sanitation authority'),
('City Water Management Authorities', 6, 'City water management authority');

-- Update existing users to have null organization_name
UPDATE "users" SET "organization_name" = NULL WHERE "organization_name" IS NOT NULL;

-- Add foreign key constraint to users table
ALTER TABLE "users" 
ADD CONSTRAINT "users_organization_name_fkey" 
FOREIGN KEY ("organization_name") 
REFERENCES "predefined_organizations"("name"); 