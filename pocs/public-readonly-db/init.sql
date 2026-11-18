-- POC : l'API publique se connecte avec un rôle qui ne voit que les opérations publiées.
-- Doc : https://www.postgresql.org/docs/18/sql-grant.html et .../ddl-priv.html

CREATE TABLE operation (
    id text PRIMARY KEY,
    label text NOT NULL,
    status text NOT NULL CHECK (status IN ('to_check', 'published'))
);

INSERT INTO operation VALUES
    ('FICTIF-1', 'Sauvetage FICTIF publié', 'published'),
    ('FICTIF-2', 'Sauvetage FICTIF publié', 'published'),
    ('FICTIF-3', 'Sauvetage FICTIF à vérifier', 'to_check');

-- Ce que le public a le droit de voir : les opérations publiées, et pas la colonne status.
CREATE VIEW published_operation AS
    SELECT id, label FROM operation WHERE status = 'published';

-- L'API publique : lecture de la vue seulement.
CREATE ROLE public_api LOGIN PASSWORD 'fictif';
GRANT CONNECT ON DATABASE rescue_atlas_poc TO public_api;
GRANT USAGE ON SCHEMA public TO public_api;
GRANT SELECT ON published_operation TO public_api;

-- Le back-office : lit et corrige la table, sans pouvoir la supprimer ni en changer la forme.
CREATE ROLE admin_api LOGIN PASSWORD 'fictif';
GRANT CONNECT ON DATABASE rescue_atlas_poc TO admin_api;
GRANT USAGE ON SCHEMA public TO admin_api;
GRANT SELECT, INSERT, UPDATE ON operation TO admin_api;
