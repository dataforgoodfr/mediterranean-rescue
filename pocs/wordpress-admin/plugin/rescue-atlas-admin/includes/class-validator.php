<?php
/**
 * Les contrôles d'une fiche : chaque champ (type, bornes, liste), puis les champs entre eux.
 *
 * Règle de WordPress : valider par liste blanche, assainir tôt, échapper tard. Ici on valide et on
 * assainit ; l'échappement se fait à l'affichage. Les règles entre champs viennent des issues de
 * l'équipe (#33, #117 à #120) et restent à relire avec SOS MEDITERRANEE.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Contrôles et enregistrement des champs.
 */
final class Validator {

	/**
	 * Nettoie et enregistre les champs d'une fiche, puis la contrôle dans son ensemble.
	 * Une fiche avec des erreurs est quand même enregistrée : on ne perd pas la saisie.
	 *
	 * @param int                  $post_id   Fiche.
	 * @param string               $post_type Type de contenu.
	 * @param array<string, mixed> $input     Valeurs reçues, déjà passées par wp_unslash().
	 * @return array{0: array<string, mixed>, 1: array<string, string>, 2: array<string, string>} valeurs, erreurs par champ, erreurs entre champs (code => message)
	 */
	public static function validate_and_store( int $post_id, string $post_type, array $input ): array {
		$values   = array();
		$by_field = array();
		foreach ( Fields::for_type( $post_type ) as $key => $field ) {
			$raw             = $input[ $key ] ?? '';
			[ $value, $err ] = self::clean( is_scalar( $raw ) ? (string) $raw : '', $field );
			if ( null !== $err ) {
				$by_field[ $key ] = $err;
			}
			$values[ $key ] = $value;
			if ( null === $value ) {
				delete_post_meta( $post_id, $key );
			} else {
				update_post_meta( $post_id, $key, $value );
			}
		}
		return array( $values, $by_field, self::cross_checks( $post_type, $values, $post_id ) );
	}

	/**
	 * Contrôle un champ.
	 *
	 * @param string               $raw   Valeur reçue.
	 * @param array<string, mixed> $field Définition du champ (Fields).
	 * @return array{0: mixed, 1: ?string} valeur nettoyée (null si vide), message d'erreur
	 */
	public static function clean( string $raw, array $field ): array {
		$raw = trim( $raw );
		if ( 'bool' === $field['type'] ) {
			return array( '1' === $raw, null );
		}
		if ( '' === $raw ) {
			// Inconnu reste vide, jamais zéro.
			return array( null, empty( $field['required'] ) ? null : __( 'required', 'rescue-atlas-admin' ) );
		}
		switch ( $field['type'] ) {
			case 'int':
			case 'ref':
				if ( ! preg_match( '/^-?\d+$/', $raw ) ) {
					return array( null, __( 'whole number expected', 'rescue-atlas-admin' ) );
				}
				$value = (int) $raw;
				if ( 'ref' === $field['type'] ) {
					return get_post_type( $value ) === $field['post_type'] ? array( $value, null ) : array( null, __( 'unknown item', 'rescue-atlas-admin' ) );
				}
				break;
			case 'number':
				$raw = str_replace( ',', '.', $raw );
				if ( ! is_numeric( $raw ) ) {
					return array( null, __( 'number expected', 'rescue-atlas-admin' ) );
				}
				$value = (float) $raw;
				break;
			case 'date':
				$date = \DateTimeImmutable::createFromFormat( '!Y-m-d', $raw );
				return ( $date && $date->format( 'Y-m-d' ) === $raw ) ? array( $raw, null ) : array( null, __( 'date expected (YYYY-MM-DD)', 'rescue-atlas-admin' ) );
			case 'url':
				$url = esc_url_raw( $raw, array( 'http', 'https' ) );
				return '' !== $url ? array( $url, null ) : array( null, __( 'invalid web address', 'rescue-atlas-admin' ) );
			case 'select':
				return array_key_exists( $raw, $field['options'] ) ? array( $raw, null ) : array( null, __( 'value not in the list', 'rescue-atlas-admin' ) );
			case 'textarea':
				return array( sanitize_textarea_field( $raw ), null );
			default:
				$text = sanitize_text_field( $raw );
				if ( isset( $field['pattern'] ) && ! preg_match( '/^(?:' . $field['pattern'] . ')$/', $text ) ) {
					return array( $text, __( 'wrong format', 'rescue-atlas-admin' ) );
				}
				return array( $text, null );
		}
		if ( isset( $field['min'] ) && $value < $field['min'] ) {
			/* translators: %s: smallest value allowed. */
			return array( $value, sprintf( __( 'at least %s', 'rescue-atlas-admin' ), $field['min'] ) );
		}
		if ( isset( $field['max'] ) && $value > $field['max'] ) {
			/* translators: %s: largest value allowed. */
			return array( $value, sprintf( __( 'at most %s', 'rescue-atlas-admin' ), $field['max'] ) );
		}
		return array( $value, null );
	}

	/**
	 * Contrôles entre champs. Chaque erreur a un code stable (pour les tests et l'API) et un message traduit.
	 *
	 * @param string               $post_type Type de contenu.
	 * @param array<string, mixed> $v         Valeurs nettoyées.
	 * @param int                  $post_id   Fiche (pour exclure la fiche elle-même d'un doublon).
	 * @return array<string, string> code => message
	 */
	public static function cross_checks( string $post_type, array $v, int $post_id ): array {
		$errors = array();
		$set    = static fn( string $k ): bool => isset( $v[ $k ] );
		$above  = static function ( string $code, string $small, string $big, string $message ) use ( &$errors, $v, $set ): void {
			if ( $set( $small ) && $set( $big ) && $v[ $small ] > $v[ $big ] ) {
				$errors[ $code ] = $message;
			}
		};

		if ( array_key_exists( 'latitude', $v ) && $set( 'latitude' ) !== $set( 'longitude' ) ) {
			$errors['position_incomplete'] = __( 'Position: latitude and longitude go together.', 'rescue-atlas-admin' );
		}
		foreach ( array( 'operation_date', 'event_date' ) as $key ) {
			if ( $set( $key ) && $v[ $key ] > wp_date( 'Y-m-d' ) ) {
				$errors['date_in_future'] = __( 'The date is in the future.', 'rescue-atlas-admin' );
			}
		}
		if ( 'rsatlas_operation' === $post_type ) {
			if ( $set( 'male' ) && $set( 'female' ) && $set( 'nb_survivor' ) && $v['male'] + $v['female'] > $v['nb_survivor'] ) {
				$errors['men_women_over_total'] = __( 'Men plus women is more than the number of people rescued.', 'rescue-atlas-admin' );
			}
			$above( 'minors_over_total', 'under_18', 'nb_survivor', __( 'More minors than people rescued.', 'rescue-atlas-admin' ) );
			$above( 'unaccompanied_over_minors', 'under_18_unacc', 'under_18', __( 'More unaccompanied minors than minors.', 'rescue-atlas-admin' ) );
			$above( 'under_5_over_minors', 'under_5', 'under_18', __( 'More children under 5 than minors.', 'rescue-atlas-admin' ) );
			$above( 'pregnant_over_women', 'pregnant_women', 'female', __( 'More pregnant women than women.', 'rescue-atlas-admin' ) );
			if ( $set( 'port_disembarkation' ) && $set( 'disembarkation_vessel' ) ) {
				$errors['port_and_ship'] = __( 'Disembarkation: a port or a ship, not both.', 'rescue-atlas-admin' );
			}
		}
		if ( 'rsatlas_glossary' === $post_type && $set( 'term_slug' ) && $set( 'language' ) && self::glossary_duplicate( (string) $v['term_slug'], (string) $v['language'], $post_id ) ) {
			$errors['glossary_duplicate'] = __( 'This term already exists in this language.', 'rescue-atlas-admin' );
		}
		return $errors;
	}

	/**
	 * Vrai si un autre terme porte le même identifiant dans la même langue.
	 *
	 * @param string $slug     Identifiant du terme.
	 * @param string $language Langue.
	 * @param int    $post_id  Fiche à exclure.
	 */
	private static function glossary_duplicate( string $slug, string $language, int $post_id ): bool {
		$found = get_posts(
			array(
				'post_type'      => 'rsatlas_glossary',
				'post_status'    => array( 'publish', 'pending', 'draft', Post_Types::ARCHIVED ),
				'post__not_in'   => array( $post_id ),
				'posts_per_page' => 1,
				'fields'         => 'ids',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- quelques centaines de termes au plus.
				'meta_query'     => array(
					array(
						'key'   => 'term_slug',
						'value' => $slug,
					),
					array(
						'key'   => 'language',
						'value' => $language,
					),
				),
			)
		);
		return array() !== $found;
	}
}
