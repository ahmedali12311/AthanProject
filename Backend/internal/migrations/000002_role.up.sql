CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, name)
VALUES
    (1, 'admin')

ON CONFLICT (id) DO NOTHING;