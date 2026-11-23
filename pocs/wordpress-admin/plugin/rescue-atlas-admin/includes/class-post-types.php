<?php
/**
 * Les types de contenu, leurs champs (méta) et le statut « Archivé ».
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Enregistrement des types de contenu.
 */
final class Post_Types {

	/** Statut d'une fiche retirée de la carte : on archive, on ne supprime pas. */
	public const ARCHIVED = 'rsatlas_archived';

	/** Capacités propres au plugin : elles ne donnent aucun droit sur les articles et les pages. */
	public const CAPABILITY_TYPE = array( 'rsatlas_record', 'rsatlas_records' );

	/**
	 * Enregistre les types, les champs et le statut, sur `init`.
	 */
	public static function register(): void {
		$first = true;
		foreach ( Fields::labels() as $post_type => [ $plural, $singular ] ) {
			register_post_type( $post_type, self::post_type_args( $plural, $singular, $first ) );
			$first = false;
			foreach ( Fields::for_type( $post_type ) as $key => $field ) {
				register_post_meta(
					$post_type,
					$key,
					array(
						'type'              => Fields::json_type( $field['type'] ),
						'single'            => true,
						'label'             => $field['label'],
						// La méta passe toujours par le contrôle du champ, d'où qu'elle soit écrite.
						'sanitize_callback' => static fn( $value ) => self::sanitize_meta( $value, $field ),
						'auth_callback'     => static fn( $allowed, $meta_key, $object_id ) => current_user_can( 'edit_post', $object_id ),
					)
				);
			}
		}

		register_post_status(
			self::ARCHIVED,
			array(
				'label'                     => _x( 'Archived', 'post status', 'rescue-atlas-admin' ),
				'public'                    => false,
				'protected'                 => true,
				'exclude_from_search'       => true,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				/* translators: %s: number of archived items. */
				'label_count'               => _n_noop( 'Archived <span class="count">(%s)</span>', 'Archived <span class="count">(%s)</span>', 'rescue-atlas-admin' ),
			)
		);

		// L'éditeur de blocs n'affiche pas les statuts personnalisés (ticket Gutenberg #3144) : nos
		// fiches s'éditent dans le formulaire classique, et l'archivage passe par une action dédiée.
		add_filter( 'use_block_editor_for_post_type', static fn( $use_block_editor, $post_type ) => Fields::is_ours( $post_type ) ? false : $use_block_editor, 10, 2 );
	}

	/**
	 * Les arguments d'un type de contenu.
	 *
	 * @param string $plural   Libellé au pluriel.
	 * @param string $singular Libellé au singulier.
	 * @param bool   $is_menu  Le premier type porte le menu « Rescue Atlas » ; les autres s'y rangent.
	 * @return array<string, mixed>
	 */
	private static function post_type_args( string $plural, string $singular, bool $is_menu ): array {
		return array(
			'labels'          => array(
				'name'          => $plural,
				'singular_name' => $singular,
				'all_items'     => $plural,
				'menu_name'     => $is_menu ? 'Rescue Atlas' : $plural,
				/* translators: %s: name of the content type, singular. */
				'add_new_item'  => sprintf( __( 'Add: %s', 'rescue-atlas-admin' ), $singular ),
				/* translators: %s: name of the content type, singular. */
				'edit_item'     => sprintf( __( 'Edit: %s', 'rescue-atlas-admin' ), $singular ),
			),
			'public'          => false,
			'show_ui'         => true,
			'show_in_menu'    => $is_menu ? true : 'edit.php?post_type=rsatlas_operation',
			'menu_icon'       => 'dashicons-location-alt',
			'menu_position'   => 25,
			'supports'        => array( 'title', 'revisions' ),
			'capability_type' => self::CAPABILITY_TYPE,
			'map_meta_cap'    => true,
			// La carte lit notre propre API (includes/rest), pas wp/v2 : aucun brouillon n'y sort.
			'show_in_rest'    => false,
		);
	}

	/**
	 * Assainit une méta selon son champ.
	 *
	 * @param mixed                $value Valeur à enregistrer.
	 * @param array<string, mixed> $field Définition du champ.
	 * @return mixed
	 */
	private static function sanitize_meta( $value, array $field ) {
		if ( 'bool' === $field['type'] ) {
			return (bool) $value;
		}
		[ $clean ] = Validator::clean( is_scalar( $value ) ? (string) $value : '', $field );
		return $clean;
	}

	/**
	 * Le titre d'une opération, fabriqué à partir de ses champs : personne n'a à le saisir.
	 *
	 * @param array<string, mixed> $values Valeurs nettoyées.
	 */
	public static function operation_title( array $values ): string {
		if ( empty( $values['operation_date'] ) ) {
			return __( 'Operation without a date', 'rescue-atlas-admin' );
		}
		$title = 'transfer' === ( $values['operation_type'] ?? '' )
			/* translators: %s: date of the transfer, YYYY-MM-DD. */
			? sprintf( __( 'Transfer of %s', 'rescue-atlas-admin' ), $values['operation_date'] )
			/* translators: %s: date of the rescue, YYYY-MM-DD. */
			: sprintf( __( 'Rescue of %s', 'rescue-atlas-admin' ), $values['operation_date'] );
		if ( isset( $values['nb_survivor'] ) ) {
			/* translators: %d: number of people rescued. */
			$title .= ' ' . sprintf( _n( '(%d person)', '(%d people)', (int) $values['nb_survivor'], 'rescue-atlas-admin' ), (int) $values['nb_survivor'] );
		}
		return $title;
	}
}
