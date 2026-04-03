UPDATE artist_profiles
SET bio = regexp_replace(bio, '^@[A-Za-z0-9_.]+\s*\n*', '', 'n'),
    updated_at = now()
WHERE bio ~ '^@[A-Za-z0-9_.]+';
