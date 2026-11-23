<?php
/**
 * Prépare le WordPress de test commun au démarrage de chaque instance (CC_PRE_RUN_HOOK).
 * Rien ne se refait deux fois : chaque étape vérifie d'abord si elle est déjà faite.
 *
 *   php setup/setup.php install   installe WordPress en français et active le plugin
 *   php setup/setup.php seed      charge les données FICTIVES une fois, puis règle les mots de passe
 *
 * Deux processus, car les types de contenu du plugin ne sont déclarés qu'au chargement suivant
 * son activation. Les mots de passe viennent des variables RA_PASS_* : jamais dans Git.
 *
 * @package RescueAtlas\Admin
 */

$rsatlas_site = (string) getenv( 'RA_SITE_URL' );
if ( '' === $rsatlas_site ) {
	fwrite( STDERR, "RA_SITE_URL manque.\n" );
	exit( 1 );
}
// WordPress lit l'hôte de la requête, absente en ligne de commande.
// WordPress n'est pas encore chargé : parse_url plutôt que wp_parse_url.
$_SERVER['HTTP_HOST']   = (string) parse_url( $rsatlas_site, PHP_URL_HOST );
$_SERVER['SERVER_NAME'] = $_SERVER['HTTP_HOST'];

$rsatlas_web  = dirname( __DIR__ ) . '/web';
$rsatlas_mode = $argv[1] ?? '';

if ( 'install' === $rsatlas_mode ) {
	define( 'WP_INSTALLING', true );
	require $rsatlas_web . '/wp-load.php';
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	require_once ABSPATH . 'wp-admin/includes/plugin.php';

	if ( ! is_blog_installed() ) {
		// Site non indexé par les moteurs de recherche (4e argument à false).
		wp_install( 'Rescue Atlas : site de test (FICTIF)', 'admin', 'admin@example.test', false, '', (string) getenv( 'RA_PASS_ADMIN' ), 'fr_FR' );
		update_option( 'permalink_structure', '/%postname%/' );
		echo "WordPress installé.\n";
	}
	$rsatlas_result = activate_plugin( 'rescue-atlas-admin/rescue-atlas-admin.php' );
	if ( is_wp_error( $rsatlas_result ) ) {
		fwrite( STDERR, $rsatlas_result->get_error_message() . "\n" );
		exit( 1 );
	}
	exit( 0 );
}

if ( 'seed' === $rsatlas_mode ) {
	require $rsatlas_web . '/wp-load.php';

	if ( ! get_option( 'rsatlas_test_seeded' ) ) {
		require __DIR__ . '/seed.php';
		update_option( 'rsatlas_test_seeded', gmdate( 'c' ) );
		echo "Données FICTIVES chargées.\n";
	}
	// À chaque démarrage, pour qu'un changement de variable suffise à changer un mot de passe.
	foreach ( array( 'admin' => 'RA_PASS_ADMIN', 'saisie' => 'RA_PASS_SAISIE', 'validation' => 'RA_PASS_VALIDATION' ) as $rsatlas_login => $rsatlas_var ) {
		$rsatlas_user = get_user_by( 'login', $rsatlas_login );
		$rsatlas_pass = (string) getenv( $rsatlas_var );
		if ( ! $rsatlas_user || strlen( $rsatlas_pass ) < 16 ) {
			fwrite( STDERR, "Compte $rsatlas_login absent, ou $rsatlas_var manque ou fait moins de 16 caractères.\n" );
			exit( 1 );
		}
		if ( ! wp_check_password( $rsatlas_pass, $rsatlas_user->user_pass, $rsatlas_user->ID ) ) {
			wp_set_password( $rsatlas_pass, $rsatlas_user->ID );
		}
	}
	exit( 0 );
}

fwrite( STDERR, "Usage : php setup/setup.php install|seed\n" );
exit( 1 );
