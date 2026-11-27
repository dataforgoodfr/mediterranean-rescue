<?php
/**
 * Rescue Atlas > Réglages : le message affiché pendant une rotation et la clé de lecture de l'API.
 * Construit avec l'API de réglages de WordPress (Settings API).
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * La page de réglages.
 */
final class Settings {

	private const PAGE  = 'rsatlas-settings';
	private const GROUP = 'rsatlas_settings';

	/**
	 * Branche les crochets de l'admin.
	 */
	public static function boot(): void {
		add_action( 'admin_menu', array( self::class, 'add_page' ) );
		add_action( 'admin_init', array( self::class, 'register' ) );
	}

	/**
	 * Ajoute la page sous le menu Rescue Atlas.
	 */
	public static function add_page(): void {
		add_submenu_page( 'edit.php?post_type=rsatlas_operation', __( 'Rescue Atlas settings', 'rescue-atlas-admin' ), __( 'Settings', 'rescue-atlas-admin' ), Roles::MANAGE, self::PAGE, array( self::class, 'render' ) );
	}

	/**
	 * Déclare les réglages, leur section et leurs champs.
	 */
	public static function register(): void {
		register_setting(
			self::GROUP,
			'rsatlas_status_message',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
				'default'           => '',
			)
		);
		register_setting(
			self::GROUP,
			'rsatlas_api_key',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
			)
		);
		add_settings_section( 'rsatlas_main', '', '__return_empty_string', self::PAGE );
		add_settings_field( 'rsatlas_status_message', __( 'Message during a rotation', 'rescue-atlas-admin' ), array( self::class, 'field_message' ), self::PAGE, 'rsatlas_main', array( 'label_for' => 'rsatlas_status_message' ) );
		add_settings_field( 'rsatlas_api_key', __( 'API read key', 'rescue-atlas-admin' ), array( self::class, 'field_key' ), self::PAGE, 'rsatlas_main', array( 'label_for' => 'rsatlas_api_key' ) );
	}

	/**
	 * Le champ du message.
	 */
	public static function field_message(): void {
		printf( '<textarea id="rsatlas_status_message" name="rsatlas_status_message" rows="3" class="large-text">%s</textarea>', esc_textarea( (string) get_option( 'rsatlas_status_message', '' ) ) );
		printf( '<p class="description">%s</p>', esc_html__( 'Shown on the operations page while the ship is at sea. Never a position.', 'rescue-atlas-admin' ) );
	}

	/**
	 * Le champ de la clé.
	 */
	public static function field_key(): void {
		printf( '<input type="text" id="rsatlas_api_key" name="rsatlas_api_key" class="regular-text" autocomplete="off" value="%s">', esc_attr( (string) get_option( 'rsatlas_api_key', '' ) ) );
		printf( '<p class="description">%s</p>', esc_html__( 'Empty: the read API is open (test site only). Otherwise the map sends it in the X-API-Key header.', 'rescue-atlas-admin' ) );
	}

	/**
	 * La page.
	 */
	public static function render(): void {
		if ( ! current_user_can( Roles::MANAGE ) ) {
			return;
		}
		echo '<div class="wrap"><h1>' . esc_html( get_admin_page_title() ) . '</h1><form method="post" action="options.php">';
		settings_fields( self::GROUP );
		do_settings_sections( self::PAGE );
		submit_button();
		echo '</form></div>';
	}
}
