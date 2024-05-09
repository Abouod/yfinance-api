CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    verification_token TEXT,
    email_verified BOOLEAN,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    manager_name VARCHAR(100),
    superior_name VARCHAR(100),
    department VARCHAR(50),
    phone_number VARCHAR(20),
    job_title VARCHAR(100),
    division VARCHAR(100),
    employee_id VARCHAR(20),
    passport VARCHAR(30),
    superior_id VARCHAR(10),
    superior_email VARCHAR(40),
    manager_id VARCHAR(40),
    manager_email VARCHAR(40),
    signature text,
    bank_name VARCHAR(30),
    bank_account VARCHAR(100),
    address text
);
CREATE TABLE IF NOT EXISTS purchase_request (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    customer_name character varying(255) NOT NULL,
    requisition_no character varying(255) NOT NULL,
    pr_count integer DEFAULT 1,
    last_submission_date VARCHAR(30)
)