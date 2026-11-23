<?php
/**
 * Données FICTIVES du WordPress de test local. Jamais de vraies données de SOS MEDITERRANEE ici.
 * Lancé une fois au démarrage par dev/blueprint.json.
 *
 * @package RescueAtlas\Admin
 */

require_once '/wordpress/wp-load.php';

$rsatlas_add = static function ( string $type, string $title, array $meta, string $status = 'publish', string $slug = '' ): int {
	$id = wp_insert_post(
		array(
			'post_type'   => $type,
			'post_title'  => $title,
			'post_status' => $status,
			'post_name'   => $slug,
		)
	);
	foreach ( $meta as $key => $value ) {
		update_post_meta( $id, $key, $value );
	}
	return $id;
};

$salerno = $rsatlas_add(
	'rsatlas_port',
	'Salerno',
	array(
		'country'            => 'IT',
		'is_place_of_safety' => true,
		'latitude'           => 40.6777,
		'longitude'          => 14.7655,
	),
	'publish',
	'port-salerno'
);
$rsatlas_add(
	'rsatlas_port',
	'Ancona',
	array(
		'country'            => 'IT',
		'is_place_of_safety' => true,
		'latitude'           => 43.6158,
		'longitude'          => 13.5189,
	),
	'publish',
	'port-ancona'
);
$rsatlas_add(
	'rsatlas_port',
	'Bari',
	array(
		'country'            => 'IT',
		'is_place_of_safety' => true,
		'latitude'           => 41.1258,
		'longitude'          => 16.8667,
	),
	'publish',
	'port-bari'
);
$rsatlas_add(
	'rsatlas_ship',
	'Ocean Viking',
	array(
		'flag'      => 'NO',
		'operator'  => 'SOS MEDITERRANEE',
		'ship_type' => 'rescue vessel',
	),
	'publish',
	'ocean-viking'
);
$rsatlas_add( 'rsatlas_ship', 'FICTIF merchant ship', array( 'ship_type' => 'other' ), 'publish', 'fictif-merchant-ship' );

$rsatlas_add(
	'rsatlas_operation',
	'FICTIF. Rescue of 2026-10-26 (48 people)',
	array(
		'operation_date'      => '2026-10-26',
		'operation_type'      => 'rescue',
		'latitude'            => 35.3333,
		'longitude'           => 14.8167,
		'nb_survivor'         => 48,
		'male'                => 31,
		'female'              => 17,
		'under_18'            => 12,
		'under_18_unacc'      => 9,
		'under_5'             => 2,
		'pregnant_women'      => 1,
		'nb_nationalities'    => 6,
		'wind_force'          => 3,
		'wave_height'         => 1.5,
		'boat_type'           => 'rubber',
		'port_disembarkation' => $salerno,
	)
);
$rsatlas_add(
	'rsatlas_operation',
	'FICTIF. Transfer of 2026-10-27',
	array(
		'operation_date' => '2026-10-27',
		'operation_type' => 'transfer',
		'transfer_type'  => 'FICTIF',
		'latitude'       => 35.1,
		'longitude'      => 15.2,
		'nb_survivor'    => 20,
	),
	'pending'
);
$rsatlas_add(
	'rsatlas_event',
	'FICTIF. Incident of 2026-09-14',
	array(
		'event_date' => '2026-09-14',
		'event_type' => 'incident',
		'latitude'   => 33.5833,
		'longitude'  => 14.0833,
		'inc_action' => 'FICTIF. Shots fired near the ship.',
	)
);
$rsatlas_term = wp_insert_post(
	array(
		'post_type'    => 'rsatlas_glossary',
		'post_title'   => 'Lieu sûr',
		'post_content' => 'FICTIF. Lieu où une opération de sauvetage prend fin.',
		'post_status'  => 'publish',
	)
);
update_post_meta( $rsatlas_term, 'term_slug', 'place-of-safety' );
update_post_meta( $rsatlas_term, 'language', 'fr' );

update_option( 'rsatlas_status_message', 'FICTIF. The Ocean Viking is at sea. The latest operations will be published soon.' );

// Comptes de test du site local, listés dans GUIDE.md. Jamais ailleurs que sur ce site jetable.
wp_insert_user(
	array(
		'user_login'   => 'saisie',
		'user_pass'    => 'ra-test-saisie-7Qx',
		'role'         => 'rsatlas_entry',
		'display_name' => 'FICTIF data entry',
		'user_email'   => 'saisie@example.test',
	)
);
wp_insert_user(
	array(
		'user_login'   => 'validation',
		'user_pass'    => 'ra-test-valid-3Kp',
		'role'         => 'rsatlas_validation',
		'display_name' => 'FICTIF validation',
		'user_email'   => 'validation@example.test',
	)
);
