-- Drop existing tables if they exist
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    is_organization BOOLEAN NOT NULL DEFAULT false,
    organization_name TEXT
);

-- Create issues table
CREATE TABLE issues (
    id SERIAL PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    coordinates JSONB,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported',
    priority TEXT NOT NULL DEFAULT 'medium',
    user_id INTEGER NOT NULL REFERENCES users(id),
    assigned_org_id INTEGER REFERENCES users(id),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    issue_id INTEGER NOT NULL REFERENCES issues(id)
); 