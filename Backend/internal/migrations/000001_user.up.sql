CREATE TABLE users (
    id                        uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name                      VARCHAR(100) NOT NULL,
    password                  VARCHAR(255) NOT NULL,
    phone_number              VARCHAR(15) UNIQUE NOT NULL,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_id ON users(id);