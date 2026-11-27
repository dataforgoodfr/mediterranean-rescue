<?php
/**
 * Les types de contenu et leurs champs, décrits une seule fois.
 *
 * Les écrans, les contrôles, la lecture publique et le schéma de l'API en sont tirés : pour ajouter
 * un champ, on l'ajoute ici et nulle part ailleurs (GUIDE.md, « Ajouter un champ »).
 * Les noms des champs sont ceux du contrat de données (contract/rescue-atlas.openapi.yaml).
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Le catalogue des types de contenu et des champs.
 */
final class Fields {

	/**
	 * Les types de contenu du plugin.
	 *
	 * Clé : nom du type dans WordPress (préfixe rsatlas_, 20 caractères au plus).
	 * route : chemin dans l'API publique ; key : nom de la clé dans le contrat ; id : comment la
	 * fabriquer (« post » : préfixe + identifiant WordPress ; « slug » : le slug de la fiche).
	 *
	 * @return array<string, array{route: string, key: string, id: string, prefix?: string}>
	 */
	public static function types(): array {
		return array(
			'rsatlas_operation' => array(
				'route'  => 'map-operations',
				'key'    => 'operation_id',
				'id'     => 'post',
				'prefix' => 'op-',
			),
			'rsatlas_event'     => array(
				'route'  => 'map-other',
				'key'    => 'event_id',
				'id'     => 'post',
				'prefix' => 'ev-',
			),
			'rsatlas_port'      => array(
				'route' => 'ports',
				'key'   => 'port_id',
				'id'    => 'slug',
			),
			'rsatlas_ship'      => array(
				'route' => 'ships',
				'key'   => 'ship_id',
				'id'    => 'slug',
			),
			'rsatlas_glossary'  => array(
				'route' => 'glossary',
				'key'   => 'term_slug',
				'id'    => 'meta',
			),
		);
	}

	/**
	 * Les libellés des types, traduits. Appelée après `init` seulement.
	 *
	 * @return array<string, array{0: string, 1: string}> pluriel, singulier
	 */
	public static function labels(): array {
		return array(
			'rsatlas_operation' => array( __( 'Map operations', 'rescue-atlas-admin' ), __( 'Map operation', 'rescue-atlas-admin' ) ),
			'rsatlas_event'     => array( __( 'Events', 'rescue-atlas-admin' ), __( 'Event', 'rescue-atlas-admin' ) ),
			'rsatlas_port'      => array( __( 'Ports', 'rescue-atlas-admin' ), __( 'Port', 'rescue-atlas-admin' ) ),
			'rsatlas_ship'      => array( __( 'Ships', 'rescue-atlas-admin' ), __( 'Ship', 'rescue-atlas-admin' ) ),
			'rsatlas_glossary'  => array( __( 'Glossary', 'rescue-atlas-admin' ), __( 'Glossary term', 'rescue-atlas-admin' ) ),
		);
	}

	/**
	 * Vrai si le type de contenu appartient au plugin.
	 *
	 * @param string $post_type Type de contenu.
	 */
	public static function is_ours( string $post_type ): bool {
		return isset( self::types()[ $post_type ] );
	}

	/**
	 * Les champs d'un type de contenu.
	 *
	 * Types : date, int, number, text, textarea, url, select (options), ref (fiche d'un autre type),
	 * bool. Bornes : min, max ; format d'un texte : pattern. section : début d'un groupe à l'écran.
	 *
	 * @param string $post_type Type de contenu.
	 * @return array<string, array<string, mixed>>
	 */
	public static function for_type( string $post_type ): array {
		return self::all()[ $post_type ] ?? array();
	}

	/**
	 * Tous les champs, par type. Appelée après `init` seulement (les libellés sont traduits).
	 *
	 * @return array<string, array<string, array<string, mixed>>>
	 */
	public static function all(): array {
		$position = array(
			'latitude'  => array(
				'label' => __( 'Latitude', 'rescue-atlas-admin' ),
				'type'  => 'number',
				'min'   => -90,
				'max'   => 90,
				'help'  => __( 'Decimal degrees (WGS 84), for example 35.3333.', 'rescue-atlas-admin' ),
			),
			'longitude' => array(
				'label' => __( 'Longitude', 'rescue-atlas-admin' ),
				'type'  => 'number',
				'min'   => -180,
				'max'   => 180,
			),
		);
		$weather  = array(
			'wind_force'  => array(
				'label'   => __( 'Wind force', 'rescue-atlas-admin' ),
				'type'    => 'int',
				'min'     => 0,
				'max'     => 12,
				'help'    => __( 'Beaufort scale (unit to be confirmed).', 'rescue-atlas-admin' ),
				'section' => __( 'Conditions', 'rescue-atlas-admin' ),
			),
			'wave_height' => array(
				'label' => __( 'Wave height', 'rescue-atlas-admin' ),
				'type'  => 'number',
				'min'   => 0,
				'help'  => __( 'In metres (unit to be confirmed).', 'rescue-atlas-admin' ),
			),
			'boat_type'   => array(
				'label'   => __( 'Type of boat in distress', 'rescue-atlas-admin' ),
				'type'    => 'select',
				'options' => self::boat_types(),
			),
		);
		$count    = static fn( string $label, string $help = '' ): array => array(
			'label' => $label,
			'type'  => 'int',
			'min'   => 0,
			'help'  => $help,
		);

		return array(
			'rsatlas_operation' => array_merge(
				array(
					'operation_date' => array(
						'label'    => __( 'Date', 'rescue-atlas-admin' ),
						'type'     => 'date',
						'required' => true,
						'section'  => __( 'Where and when', 'rescue-atlas-admin' ),
					),
					'operation_type' => array(
						'label'    => __( 'Type of operation', 'rescue-atlas-admin' ),
						'type'     => 'select',
						'required' => true,
						'options'  => array(
							'rescue'   => __( 'Rescue', 'rescue-atlas-admin' ),
							'transfer' => __( 'Transfer', 'rescue-atlas-admin' ),
						),
					),
					'transfer_type'  => array(
						'label' => __( 'Type of transfer', 'rescue-atlas-admin' ),
						'type'  => 'text',
						'help'  => __( 'Only for a transfer.', 'rescue-atlas-admin' ),
					),
					'rotation_id'    => array(
						'label' => __( 'Rotation', 'rescue-atlas-admin' ),
						'type'  => 'int',
						'min'   => 1,
						'help'  => __( 'Identifier of the rotation in the logbook.', 'rescue-atlas-admin' ),
					),
				),
				$position,
				array(
					'nb_survivor'      => array_merge( $count( __( 'People rescued', 'rescue-atlas-admin' ) ), array( 'section' => __( 'People rescued (totals only)', 'rescue-atlas-admin' ) ) ),
					'male'             => $count( __( 'Men', 'rescue-atlas-admin' ) ),
					'female'           => $count( __( 'Women', 'rescue-atlas-admin' ) ),
					'under_18'         => $count( __( 'Minors', 'rescue-atlas-admin' ) ),
					'under_18_unacc'   => $count( __( 'Unaccompanied minors', 'rescue-atlas-admin' ) ),
					'under_5'          => $count( __( 'Children under 5', 'rescue-atlas-admin' ) ),
					'pregnant_women'   => $count( __( 'Pregnant women', 'rescue-atlas-admin' ) ),
					'nb_nationalities' => $count( __( 'Number of nationalities', 'rescue-atlas-admin' ), __( 'The number only, never the list.', 'rescue-atlas-admin' ) ),
				),
				$weather,
				array(
					'port_disembarkation'   => array(
						'label'     => __( 'Port of disembarkation', 'rescue-atlas-admin' ),
						'type'      => 'ref',
						'post_type' => 'rsatlas_port',
						'section'   => __( 'Disembarkation', 'rescue-atlas-admin' ),
						'help'      => __( 'A port from the list, or a ship below.', 'rescue-atlas-admin' ),
					),
					'disembarkation_vessel' => array(
						'label'     => __( 'Ship of disembarkation', 'rescue-atlas-admin' ),
						'type'      => 'ref',
						'post_type' => 'rsatlas_ship',
						'help'      => __( 'When people are transferred to another ship.', 'rescue-atlas-admin' ),
					),
					'testimony_src'         => array(
						'label'   => __( 'Testimony link', 'rescue-atlas-admin' ),
						'type'    => 'url',
						'section' => __( 'Links', 'rescue-atlas-admin' ),
					),
				)
			),
			'rsatlas_event'     => array_merge(
				array(
					'event_date' => array(
						'label'    => __( 'Date', 'rescue-atlas-admin' ),
						'type'     => 'date',
						'required' => true,
						'section'  => __( 'Where and when', 'rescue-atlas-admin' ),
					),
					'event_type' => array(
						'label'    => __( 'Type of event', 'rescue-atlas-admin' ),
						'type'     => 'select',
						'required' => true,
						'options'  => array(
							'shipwreck'        => __( 'Shipwreck', 'rescue-atlas-admin' ),
							'dead-and-missing' => __( 'Dead and missing', 'rescue-atlas-admin' ),
							'incident'         => __( 'Incident', 'rescue-atlas-admin' ),
						),
					),
				),
				$position,
				$weather,
				array(
					'boat_involved'   => array(
						'label'   => __( 'Boat involved', 'rescue-atlas-admin' ),
						'type'    => 'text',
						'section' => __( 'Outcome', 'rescue-atlas-admin' ),
					),
					'death_nb_people' => $count( __( 'Dead and missing', 'rescue-atlas-admin' ) ),
					'shipwreck_nb'    => $count( __( 'Shipwrecks', 'rescue-atlas-admin' ) ),
					'inc_action'      => array(
						'label' => __( 'What happened', 'rescue-atlas-admin' ),
						'type'  => 'textarea',
						'help'  => __( 'Never the name of a witness.', 'rescue-atlas-admin' ),
					),
					'testimony_src'   => array(
						'label' => __( 'Testimony link', 'rescue-atlas-admin' ),
						'type'  => 'url',
					),
				)
			),
			'rsatlas_port'      => array_merge(
				array(
					'country'            => array(
						'label'    => __( 'Country', 'rescue-atlas-admin' ),
						'type'     => 'text',
						'required' => true,
						'pattern'  => '[A-Z]{2}',
						'help'     => __( 'Two-letter ISO code, for example IT.', 'rescue-atlas-admin' ),
					),
					'is_place_of_safety' => array(
						'label' => __( 'Place of safety', 'rescue-atlas-admin' ),
						'type'  => 'bool',
					),
				),
				$position
			),
			'rsatlas_ship'      => array(
				'imo'       => array(
					'label' => __( 'IMO number', 'rescue-atlas-admin' ),
					'type'  => 'int',
					'min'   => 1000000,
					'max'   => 9999999,
				),
				'mmsi'      => array(
					'label' => __( 'MMSI', 'rescue-atlas-admin' ),
					'type'  => 'int',
					'min'   => 100000000,
					'max'   => 999999999,
				),
				'flag'      => array(
					'label'   => __( 'Flag', 'rescue-atlas-admin' ),
					'type'    => 'text',
					'pattern' => '[A-Z]{2}',
					'help'    => __( 'Two-letter ISO code.', 'rescue-atlas-admin' ),
				),
				'operator'  => array(
					'label' => __( 'Operator', 'rescue-atlas-admin' ),
					'type'  => 'text',
				),
				'ship_type' => array(
					'label'   => __( 'Type of ship', 'rescue-atlas-admin' ),
					'type'    => 'select',
					'options' => array(
						'rescue vessel' => __( 'Rescue vessel', 'rescue-atlas-admin' ),
						'patrol vessel' => __( 'Patrol vessel', 'rescue-atlas-admin' ),
						'other'         => __( 'Other', 'rescue-atlas-admin' ),
					),
				),
			),
			'rsatlas_glossary'  => array(
				'term_slug' => array(
					'label'    => __( 'Term identifier', 'rescue-atlas-admin' ),
					'type'     => 'text',
					'required' => true,
					'pattern'  => '[a-z0-9-]+',
					'help'     => __( 'The same in every language, for example place-of-safety.', 'rescue-atlas-admin' ),
				),
				'language'  => array(
					'label'    => __( 'Language', 'rescue-atlas-admin' ),
					'type'     => 'select',
					'required' => true,
					'options'  => array(
						'en' => __( 'English', 'rescue-atlas-admin' ),
						'fr' => __( 'French', 'rescue-atlas-admin' ),
						'ar' => __( 'Arabic', 'rescue-atlas-admin' ),
					),
				),
				'sources'   => array(
					'label' => __( 'Sources', 'rescue-atlas-admin' ),
					'type'  => 'textarea',
					'help'  => __( 'One web address per line.', 'rescue-atlas-admin' ),
				),
			),
		);
	}

	/**
	 * Types de bateau en détresse. Liste supposée : à remplacer par la liste boat-type de SOS.
	 *
	 * @return array<string, string>
	 */
	public static function boat_types(): array {
		return array(
			'rubber'     => __( 'Rubber boat', 'rescue-atlas-admin' ),
			'wooden'     => __( 'Wooden boat', 'rescue-atlas-admin' ),
			'fiberglass' => __( 'Fiberglass boat', 'rescue-atlas-admin' ),
			'other'      => __( 'Other', 'rescue-atlas-admin' ),
		);
	}

	/**
	 * Le type d'une méta dans register_post_meta et dans le schéma REST.
	 *
	 * @param string $field_type Type de champ du catalogue.
	 */
	public static function json_type( string $field_type ): string {
		return match ( $field_type ) {
			'int', 'ref' => 'integer',
			'number' => 'number',
			'bool' => 'boolean',
			default => 'string',
		};
	}
}
