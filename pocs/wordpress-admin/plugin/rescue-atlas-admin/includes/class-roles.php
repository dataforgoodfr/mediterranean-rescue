<?php
/**
 * Les rôles du back-office, calqués sur la Data structure : saisie, validation, lecture.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Rôles et capacités.
 */
final class Roles {

	public const ENTRY      = 'rsatlas_entry';
	public const VALIDATION = 'rsatlas_validation';
	public const READER     = 'rsatlas_reader';

	/** Capacité de la page de réglages (clé de l'API, message de rotation). */
	public const MANAGE = 'manage_rescue_atlas';

	/**
	 * Toutes les capacités générées par capability_type (Post_Types::CAPABILITY_TYPE).
	 *
	 * @return list<string>
	 */
	public static function record_caps(): array {
		$verbs = array( 'edit', 'edit_others', 'edit_published', 'edit_private', 'publish', 'read_private', 'delete', 'delete_others', 'delete_published', 'delete_private' );
		return array_map( static fn( string $verb ): string => $verb . '_rsatlas_records', $verbs );
	}

	/**
	 * Activation : crée les rôles et donne les capacités à l'administrateur.
	 * add_role écrit en base une seule fois ; le relancer ne crée pas de doublon.
	 */
	public static function activate(): void {
		add_role(
			self::ENTRY,
			'Rescue Atlas: data entry',
			array(
				'read'                   => true,
				'upload_files'           => true,
				'edit_rsatlas_records'   => true,
				'delete_rsatlas_records' => true,
			)
		);
		add_role( self::VALIDATION, 'Rescue Atlas: validation', array_fill_keys( array_merge( array( 'read', 'upload_files' ), self::record_caps() ), true ) );
		add_role( self::READER, 'Rescue Atlas: read only', array( 'read' => true ) );

		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( array_merge( self::record_caps(), array( self::MANAGE ) ) as $cap ) {
				$admin->add_cap( $cap );
			}
		}
	}

	/**
	 * Désinstallation : retire les rôles et les capacités (appelée par uninstall.php).
	 */
	public static function remove(): void {
		foreach ( array( self::ENTRY, self::VALIDATION, self::READER ) as $role ) {
			remove_role( $role );
		}
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( array_merge( self::record_caps(), array( self::MANAGE ) ) as $cap ) {
				$admin->remove_cap( $cap );
			}
		}
	}
}
