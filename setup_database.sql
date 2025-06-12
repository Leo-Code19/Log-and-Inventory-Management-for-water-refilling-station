-- Create database and user
CREATE DATABASE cleaar_oasis_db;
CREATE USER cleaar_oasis_user WITH PASSWORD 'your-secure-password';
ALTER ROLE cleaar_oasis_user SET client_encoding TO 'utf8';
ALTER ROLE cleaar_oasis_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE cleaar_oasis_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE cleaar_oasis_db TO cleaar_oasis_user;

-- Connect to the database
\c cleaar_oasis_db

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Set up PostGIS if needed for location features
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;
