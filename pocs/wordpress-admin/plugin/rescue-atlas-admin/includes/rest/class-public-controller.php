<?php
/**
 * La lecture publique pour la carte Rescue Atlas : /wp-json/rescue-atlas/v1/<route>.
 *
 * Seules les fiches publiées et archivées sortent, jamais un brouillon ni une fiche en relecture.
 * Une fiche archivée ne porte que sa clé, son statut et sa date : la carte sait la retirer.
 * Le format suit le contrat (contract/rescue-atlas.openapi.yaml), vérifié par `pnpm test`.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin\Rest;

use RescueAtlas\Admin\Fields;
use RescueAtlas\Admin\Post_Types;
use WP_Error;
use WP_Post;
use WP_Query;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * Une route de lecture par type de contenu.
 */
final class Public_Controller extends WP_REST_Controller {

	public const NAMESPACE = 'rescue-atlas/v1';

	/**
	 * Type de contenu servi.
	 *
	 * @var string
	 */
	private string $post_type;

	/**
	 * Constructeur.
	 *
	 * @param string $post_type Type de contenu servi.
	 */
	public function __construct( string $post_type ) {
		$this->post_type = $post_type;
		$this->namespace = self::NAMESPACE;
		$this->rest_base = Fields::types()[ $post_type ]['route'];
	}

	/**
	 * Enregistre la route, avec ses paramètres et son schéma (OPTIONS les renvoie).
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * La route du message affiché pendant une rotation (WebLogBook dans le contrat).
	 */
	public static function register_web_log_book_route(): void {
		register_rest_route(
			self::NAMESPACE,
			'/web-log-book',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => array( self::class, 'check_api_key' ),
				'callback'            => static fn() => rest_ensure_response(
					array(
						'status'        => '' === get_option( 'rsatlas_status_message', '' ) ? null : get_option( 'rsatlas_status_message' ),
						'_last_updated' => self::iso_utc( (string) get_option( 'rsatlas_status_updated', '' ) ),
					)
				),
			)
		);
	}

	/**
	 * Lecture publique, sauf si une clé est réglée : elle est alors demandée (en-tête X-API-Key).
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		return self::check_api_key( $request );
	}

	/**
	 * Vérifie la clé de lecture réglée dans Rescue Atlas > Réglages.
	 *
	 * @param WP_REST_Request $request Requête.
	 * @return true|WP_Error
	 */
	public static function check_api_key( WP_REST_Request $request ) {
		$key = (string) get_option( 'rsatlas_api_key', '' );
		if ( '' === $key || hash_equals( $key, (string) $request->get_header( 'x-api-key' ) ) ) {
			return true;
		}
		return new WP_Error( 'rsatlas_unauthorized', __( 'Missing or wrong API key.', 'rescue-atlas-admin' ), array( 'status' => 401 ) );
	}

	/**
	 * Les paramètres de la liste : modified_after, page, per_page (100 au plus), order.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public function get_collection_params(): array {
		return array(
			'modified_after' => array(
				'description' => __( 'Only items changed after this date (ISO 8601).', 'rescue-atlas-admin' ),
				'type'        => 'string',
				'format'      => 'date-time',
			),
			'page'           => array(
				'type'    => 'integer',
				'default' => 1,
				'minimum' => 1,
			),
			'per_page'       => array(
				'type'    => 'integer',
				'default' => 100,
				'minimum' => 1,
				'maximum' => 100,
			),
			'order'          => array(
				'type'    => 'string',
				'default' => 'asc',
				'enum'    => array( 'asc', 'desc' ),
			),
		);
	}

	/**
	 * La liste, triée par date de modification, avec les en-têtes de pagination.
	 *
	 * @param WP_REST_Request $request Requête.
	 */
	public function get_items( $request ): WP_REST_Response {
		$args = array(
			'post_type'      => $this->post_type,
			'post_status'    => array( 'publish', Post_Types::ARCHIVED ),
			'posts_per_page' => (int) $request['per_page'],
			'paged'          => (int) $request['page'],
			'orderby'        => 'modified',
			'order'          => strtoupper( (string) $request['order'] ),
		);
		if ( ! empty( $request['modified_after'] ) ) {
			$args['date_query'] = array(
				array(
					'column'    => 'post_modified_gmt',
					'after'     => gmdate( 'Y-m-d H:i:s', (int) strtotime( (string) $request['modified_after'] ) ),
					'inclusive' => false,
				),
			);
		}
		$query    = new WP_Query( $args );
		$response = rest_ensure_response( array_map( array( $this, 'to_contract' ), $query->posts ) );
		$response->header( 'X-WP-Total', (string) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (string) $query->max_num_pages );
		return $response;
	}

	/**
	 * Une fiche au format du contrat.
	 *
	 * @param WP_Post $post Fiche.
	 * @return array<string, mixed>
	 */
	public function to_contract( WP_Post $post ): array {
		$type = Fields::types()[ $this->post_type ];
		$key  = match ( $type['id'] ) {
			'post' => array( $type['key'] => $type['prefix'] . $post->ID ),
			'slug' => array( $type['key'] => $post->post_name ),
			default => array(),
		};
		$meta = array(
			'_status'       => Post_Types::ARCHIVED === $post->post_status ? 'archived' : 'published',
			'_last_updated' => self::iso_utc( $post->post_modified_gmt ),
		);
		if ( Post_Types::ARCHIVED === $post->post_status && array() !== $key ) {
			return $key + $meta;
		}

		$out = $key;
		if ( in_array( $this->post_type, array( 'rsatlas_port', 'rsatlas_ship' ), true ) ) {
			$out['name'] = $post->post_title;
		}
		if ( 'rsatlas_glossary' === $this->post_type ) {
			$out['term']       = $post->post_title;
			$out['definition'] = $post->post_content;
			$out['letter']     = mb_strtoupper( mb_substr( remove_accents( $post->post_title ), 0, 1 ) );
		}
		foreach ( Fields::for_type( $this->post_type ) as $field_key => $field ) {
			$out[ $field_key ] = self::field_value( get_post_meta( $post->ID, $field_key, true ), $field_key, $field );
		}
		return $out + $meta;
	}

	/**
	 * La valeur d'un champ dans le contrat : null si vide, une référence par son slug.
	 *
	 * @param mixed                $raw   Valeur en base.
	 * @param string               $key   Nom du champ.
	 * @param array<string, mixed> $field Définition du champ.
	 * @return mixed
	 */
	private static function field_value( $raw, string $key, array $field ) {
		if ( 'sources' === $key ) {
			return array_values( array_filter( array_map( 'trim', explode( "\n", (string) $raw ) ) ) );
		}
		if ( 'bool' === $field['type'] ) {
			return (bool) $raw;
		}
		if ( '' === $raw || null === $raw ) {
			return null;
		}
		return match ( $field['type'] ) {
			'ref' => '' === get_post_field( 'post_name', (int) $raw ) ? null : get_post_field( 'post_name', (int) $raw ),
			'int' => (int) $raw,
			'number' => (float) $raw,
			default => $raw,
		};
	}

	/**
	 * Le schéma d'un élément, tiré du catalogue des champs (renvoyé par OPTIONS).
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema(): array {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
		$properties = array(
			'_status'       => array(
				'type' => 'string',
				'enum' => array( 'published', 'archived' ),
			),
			'_last_updated' => array(
				'type'   => 'string',
				'format' => 'date-time',
			),
		);
		foreach ( Fields::for_type( $this->post_type ) as $key => $field ) {
			$properties[ $key ] = array(
				'description' => $field['label'],
				'type'        => 'sources' === $key ? 'array' : array( 'ref' === $field['type'] ? 'string' : Fields::json_type( $field['type'] ), 'null' ),
			);
		}
		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'rescue-atlas-' . $this->rest_base,
			'type'       => 'object',
			'properties' => $properties,
		);
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Une date en ISO 8601 UTC, comme le contrat le demande ; null si elle manque.
	 *
	 * @param string $value Date en base (« AAAA-MM-JJ HH:MM:SS » en UTC) ou déjà en ISO.
	 */
	public static function iso_utc( string $value ): ?string {
		if ( '' === $value ) {
			return null;
		}
		$time = strtotime( preg_match( '/(Z|[+-]\d\d:?\d\d)$/i', $value ) ? $value : $value . ' UTC' );
		return false === $time ? null : gmdate( 'Y-m-d\TH:i:s\Z', $time );
	}
}
