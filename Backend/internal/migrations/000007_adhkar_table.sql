-- Create the adhkar table with reference to categories
CREATE TABLE adhkar (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    repeat INTEGER NOT NULL DEFAULT 1,
    category_id INTEGER NOT NULL REFERENCES adhkar_categories(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on category_id
CREATE INDEX idx_adhkar_category_id ON adhkar(category_id);
