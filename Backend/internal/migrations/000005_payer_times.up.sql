
CREATE TABLE prayer_times (
    id SERIAL PRIMARY KEY,
    day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    fajr_first_time TIME NOT NULL,
    fajr_second_time TIME NOT NULL,
    sunrise_time TIME NOT NULL,
    dhuhr_time TIME NOT NULL,
    asr_time TIME NOT NULL,
    maghrib_time TIME NOT NULL,
    isha_time TIME NOT NULL,
    section_id INTEGER NOT NULL REFERENCES sections(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT prayer_times_day_month_section_id_key UNIQUE (day, month, section_id)
);

CREATE INDEX idx_day_month_section_id ON prayer_times(day, month, section_id);