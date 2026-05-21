UPDATE api_keys
SET scopes = REPLACE(
        REPLACE(
            REPLACE(
                REPLACE(scopes, ',users:read', ''),
                'users:read,',
                ''
            ),
            ',users:write',
            ''
        ),
        'users:write,',
        ''
    )
WHERE scopes LIKE '%users:read%'
   OR scopes LIKE '%users:write%';

UPDATE api_keys
SET status = 'REVOKED'
WHERE scopes = '';
