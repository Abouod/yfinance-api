CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    manager VARCHAR(100),
    superior VARCHAR(100),
    department VARCHAR(50),
    phoneNumber VARCHAR(20),
    jobTitle VARCHAR(100),
    division VARCHAR(100)
);