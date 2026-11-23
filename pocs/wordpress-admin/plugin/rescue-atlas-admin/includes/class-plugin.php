<?php
/**
 * Branche le plugin sur WordPress : un seul endroit où lire tous les crochets.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Le chargeur du plugin.
 */
final class Plugin {

	/**
	 * Enregistre les crochets. Rien ne s'exécute au chargement du fichier.
	 */
	public static function boot(): void {
		// Les traductions d'un plugin hors wordpress.org se chargent sur `init` (avertissement depuis 6.7).
		add_action( 'init', array( self::class, 'load_textdomain' ), 0 );
		add_action( 'init', array( Post_Types::class, 'register' ) );
		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );
		// La date du message de rotation suit chaque changement, d'où qu'il vienne (réglages, script).
		add_action( 'add_option_rsatlas_status_message', array( self::class, 'stamp_status_message' ) );
		add_action( 'update_option_rsatlas_status_message', array( self::class, 'stamp_status_message' ) );

		// Le code de l'admin ne se charge que dans l'admin. is_admin() ne vérifie aucun droit :
		// chaque écran et chaque action vérifient la capacité de l'utilisateur.
		if ( is_admin() ) {
			require_once dirname( PLUGIN_FILE ) . '/admin/class-classic-form.php';
			require_once dirname( PLUGIN_FILE ) . '/admin/class-operations-screen.php';
			require_once dirname( PLUGIN_FILE ) . '/admin/class-settings.php';
			Classic_Form::boot();
			Operations_Screen::boot();
			Settings::boot();
		}
	}

	/**
	 * Charge les traductions livrées avec le plugin (dossier languages/).
	 */
	public static function load_textdomain(): void {
		load_plugin_textdomain( 'rescue-atlas-admin', false, dirname( plugin_basename( PLUGIN_FILE ) ) . '/languages' );
	}

	/**
	 * Enregistre la date du dernier changement du message de rotation.
	 */
	public static function stamp_status_message(): void {
		update_option( 'rsatlas_status_updated', gmdate( 'Y-m-d\TH:i:s\Z' ) );
	}

	/**
	 * Les routes REST : la lecture publique pour la carte, et les routes de l'écran Opérations.
	 */
	public static function register_rest_routes(): void {
		foreach ( array_keys( Fields::types() ) as $post_type ) {
			( new Rest\Public_Controller( $post_type ) )->register_routes();
		}
		Rest\Public_Controller::register_web_log_book_route();
		( new Rest\Admin_Controller() )->register_routes();
	}
}
