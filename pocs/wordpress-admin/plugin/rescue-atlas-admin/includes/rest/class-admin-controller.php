<?php
/**
 * Les routes de l'écran Opérations : /wp-json/rescue-atlas/v1/admin/operations.
 *
 * Réservées aux comptes connectés qui ont les droits : la connexion passe par le cookie de
 * WordPress et le jeton `wp_rest` (X-WP-Nonce), que @wordpress/api-fetch envoie tout seul.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin\Rest;

use RescueAtlas\Admin\Fields;
use RescueAtlas\Admin\Post_Types;
use RescueAtlas\Admin\Validator;
use WP_Error;
use WP_Post;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Lister, créer, enregistrer, envoyer en relecture, publier, archiver une opération.
 */
final class Admin_Controller extends WP_REST_Controller {

	private const POST_TYPE = 'rsatlas_operation';

	/** Ce que l'on peut demander en enregistrant une fiche. */
	public const INTENTS = array( 'save', 'submit', 'publish', 'archive' );

	/**
	 * Constructeur.
	 */
	public function __construct() {
		$this->namespace = Public_Controller::NAMESPACE;
		$this->rest_base = 'admin/operations';
	}

	/**
	 * Enregistre les routes.
	 */
	public function register_routes(): void {
		$save_args = array(
			'fields' => array(
				'type'                 => 'object',
				'default'              => array(),
				'additionalProperties' => array( 'type' => array( 'string', 'number', 'boolean', 'null' ) ),
			),
			'intent' => array(
				'type'    => 'string',
				'enum'    => self::INTENTS,
				'default' => 'save',
			),
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $save_args,
				),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'save_item' ),
				'permission_callback' => array( $this, 'update_item_permissions_check' ),
				'args'                => array_merge(
					array(
						'id' => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
					),
					$save_args
				),
			)
		);
	}

	/**
	 * Voir la liste : il faut pouvoir saisir.
	 *
	 * @param WP_REST_Request $request Requête.
	 */
	public function get_items_permissions_check( $request ): bool {
		return current_user_can( 'edit_rsatlas_records' );
	}

	/**
	 * Créer : il faut pouvoir saisir, et pouvoir publier pour publier.
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_rsatlas_records' ) ) {
			return false;
		}
		return $this->check_intent( (string) $request['intent'] );
	}

	/**
	 * Modifier : il faut pouvoir modifier cette fiche-là (WordPress tient compte de l'auteur et du statut).
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		$post = get_post( (int) $request['id'] );
		if ( ! $post || self::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'rsatlas_not_found', __( 'Unknown operation.', 'rescue-atlas-admin' ), array( 'status' => 404 ) );
		}
		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return false;
		}
		return $this->check_intent( (string) $request['intent'] );
	}

	/**
	 * Publier et archiver sont réservés au rôle Validation (et à l'administrateur).
	 *
	 * @param string $intent Ce qui est demandé.
	 * @return true|WP_Error
	 */
	private function check_intent( string $intent ) {
		if ( in_array( $intent, array( 'publish', 'archive' ), true ) && ! current_user_can( 'publish_rsatlas_records' ) ) {
			return new WP_Error( 'rsatlas_forbidden', __( 'Only the validation role can publish or archive.', 'rescue-atlas-admin' ), array( 'status' => 403 ) );
		}
		return true;
	}

	/**
	 * Toutes les opérations, de la plus récemment modifiée à la plus ancienne.
	 *
	 * @param WP_REST_Request $request Requête.
	 */
	public function get_items( $request ): WP_REST_Response {
		$posts = get_posts(
			array(
				'post_type'      => self::POST_TYPE,
				'post_status'    => array( 'publish', 'pending', 'draft', Post_Types::ARCHIVED ),
				'posts_per_page' => 500, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- quelques centaines de fiches au plus, toutes utiles à l'écran.
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);
		return rest_ensure_response( array_map( array( self::class, 'item' ), $posts ) );
	}

	/**
	 * Crée ou enregistre une opération. Une fiche avec des erreurs est enregistrée, mais ne sort
	 * jamais publiée : une fiche publiée qui devient fausse repasse en relecture.
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_item( $request ) {
		$id     = (int) ( $request['id'] ?? 0 );
		$intent = (string) $request['intent'];
		if ( 0 === $id ) {
			$id = wp_insert_post(
				array(
					'post_type'   => self::POST_TYPE,
					'post_status' => 'draft',
					'post_title'  => '',
				),
				true
			);
			if ( is_wp_error( $id ) ) {
				return $id;
			}
		}
		$status = (string) get_post_status( $id );

		if ( 'archive' === $intent ) {
			wp_update_post(
				array(
					'ID'          => $id,
					'post_status' => Post_Types::ARCHIVED,
				)
			);
			return $this->respond( $id, array(), array(), __( 'Operation archived: the map will remove it.', 'rescue-atlas-admin' ) );
		}

		$input                         = (array) $request['fields'];
		[ $values, $by_field, $cross ] = Validator::validate_and_store( $id, self::POST_TYPE, $input );
		$valid                         = array() === $by_field && array() === $cross;
		$can_publish                   = current_user_can( 'publish_rsatlas_records' );

		$new_status = match ( $intent ) {
			'publish' => $valid ? 'publish' : ( 'publish' === $status ? 'pending' : $status ),
			'submit' => $valid ? ( $can_publish ? 'publish' : 'pending' ) : $status,
			default => ( 'publish' === $status && ! $valid ) ? 'pending' : $status,
		};
		wp_update_post(
			array(
				'ID'          => $id,
				'post_status' => $new_status,
				'post_title'  => Post_Types::operation_title( $values ),
			)
		);

		$message = match ( true ) {
			! $valid => __( 'Saved, but not published: please fix the errors.', 'rescue-atlas-admin' ),
			'publish' === $new_status => __( 'Operation published: it will appear in the map API.', 'rescue-atlas-admin' ),
			'pending' === $new_status => __( 'Sent for review.', 'rescue-atlas-admin' ),
			default => __( 'Draft saved.', 'rescue-atlas-admin' ),
		};
		return $this->respond( $id, $by_field, $cross, $message );
	}

	/**
	 * La réponse commune : la fiche, ses erreurs, un message.
	 *
	 * @param int                   $id       Fiche.
	 * @param array<string, string> $by_field Erreurs par champ.
	 * @param array<string, string> $general  Erreurs entre champs (code => message).
	 * @param string                $message  Message pour l'écran.
	 */
	private function respond( int $id, array $by_field, array $general, string $message ): WP_REST_Response {
		return rest_ensure_response(
			array(
				'item'    => self::item( get_post( $id ) ),
				'errors'  => array(
					'fields'  => (object) $by_field,
					'general' => array_values( $general ),
					'codes'   => array_keys( $general ),
				),
				'message' => $message,
			)
		);
	}

	/**
	 * Une opération telle que l'écran la lit (valeurs brutes, statut WordPress, droits).
	 *
	 * @param WP_Post $post Fiche.
	 * @return array<string, mixed>
	 */
	public static function item( WP_Post $post ): array {
		$fields = array();
		foreach ( array_keys( Fields::for_type( self::POST_TYPE ) ) as $key ) {
			$raw            = get_post_meta( $post->ID, $key, true );
			$fields[ $key ] = '' === $raw ? null : $raw;
		}
		return array(
			'id'       => $post->ID,
			'title'    => $post->post_title,
			'status'   => $post->post_status,
			'modified' => get_post_modified_time( 'c', true, $post ),
			'author'   => get_the_author_meta( 'display_name', (int) $post->post_author ),
			'canEdit'  => current_user_can( 'edit_post', $post->ID ),
			'fields'   => $fields,
		);
	}
}
