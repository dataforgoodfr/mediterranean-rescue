<?php
/**
 * Configuration du WordPress de test commun, sur Clever Cloud. Aucun secret ici : tout vient des
 * variables d'environnement de l'application (GUIDE.md, « Le site de test commun »).
 * D'après le guide officiel : https://www.clever.cloud/developers/guides/self-hosted/wordpress/
 *
 * @package RescueAtlas\Admin
 */

// La base MySQL liée à l'application.
define( 'DB_NAME', getenv( 'MYSQL_ADDON_DB' ) );
define( 'DB_USER', getenv( 'MYSQL_ADDON_USER' ) );
define( 'DB_PASSWORD', getenv( 'MYSQL_ADDON_PASSWORD' ) );
define( 'DB_HOST', getenv( 'MYSQL_ADDON_HOST' ) . ':' . getenv( 'MYSQL_ADDON_PORT' ) );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

// Clés et sels, tirés au hasard à la création du site.
foreach ( array( 'AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY', 'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT' ) as $rsatlas_key ) {
	define( $rsatlas_key, getenv( 'WORDPRESS_' . $rsatlas_key ) );
}

$table_prefix = 'wp_';

// L'adresse du site, fixée : l'installation tourne en ligne de commande, sans requête HTTP.
define( 'WP_HOME', getenv( 'RA_SITE_URL' ) );
define( 'WP_SITEURL', getenv( 'RA_SITE_URL' ) );

// Clever Cloud termine le HTTPS devant l'application.
if ( isset( $_SERVER['HTTP_X_FORWARDED_PROTO'] ) && str_contains( $_SERVER['HTTP_X_FORWARDED_PROTO'], 'https' ) ) {
	$_SERVER['HTTPS'] = 'on';
}

// Le code ne change que par un nouveau déploiement : ni extension ni mise à jour depuis l'admin.
define( 'DISALLOW_FILE_MODS', true );
define( 'WP_ENVIRONMENT_TYPE', 'staging' );
define( 'WP_DEBUG', false );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
