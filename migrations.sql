-- migrations.sql
CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  word TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS words_used (
  id SERIAL PRIMARY KEY,
  word_id INTEGER REFERENCES words(id),
  word TEXT NOT NULL,
  used_on DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(word_id, used_on),
  UNIQUE(word, used_on)
);

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY,
  game_date DATE NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
