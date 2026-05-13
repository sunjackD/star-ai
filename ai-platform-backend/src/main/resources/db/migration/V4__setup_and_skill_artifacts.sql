ALTER TABLE skills ADD COLUMN artifact_type VARCHAR(32) NOT NULL DEFAULT 'TEXT';
ALTER TABLE skills ADD COLUMN artifact_path VARCHAR(600) NULL;
ALTER TABLE skills ADD COLUMN artifact_file_name VARCHAR(255) NULL;
ALTER TABLE skills ADD COLUMN artifact_size BIGINT NOT NULL DEFAULT 0;
ALTER TABLE skills ADD COLUMN icon VARCHAR(600) NULL;

UPDATE skills
SET artifact_type = 'TEXT',
    artifact_file_name = CONCAT(name, '.skill.md'),
    artifact_size = LENGTH(source_code)
WHERE artifact_file_name IS NULL;

DELETE FROM user_roles
WHERE user_id IN (
    SELECT id FROM users WHERE username = 'admin' AND email = 'admin@example.com'
);

DELETE FROM api_keys
WHERE user_id IN (
    SELECT id FROM users WHERE username = 'admin' AND email = 'admin@example.com'
);

DELETE FROM users
WHERE username = 'admin' AND email = 'admin@example.com';
