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
CREATE TABLE IF NOT EXISTS purchase_request (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    request_by VARCHAR(255) NOT NULL,
    request_date DATE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    requisition_no VARCHAR(255) NOT NULL,
    online_purchase VARCHAR(255) NOT NULL,
    quotation_no VARCHAR(255) NOT NULL,
    pr_type VARCHAR(30) NOT NULL,
    project_category VARCHAR(255) NOT NULL,
    type_for_purchase VARCHAR(30) NOT NULL,
    customer_po VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    project_description TEXT NOT NULL,
    supplier_type VARCHAR(20) NOT NULL,
    item int NOT NULL,
    description text not null,
    part_no text,
    brand VARCHAR(255) NOT NULL,
    date_required DATE NOT NULL,
    quantity int NOT NULL,
    currency char(3) NOT NULL,
    unit_price DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    internal_use TEXT,
    purchase_department TEXT,
    delivery_term TEXT,
    lead_time TEXT,
    tax DECIMAL,
    exwork TEXT
);