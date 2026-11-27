<?php
/**
 * Le formulaire classique de WordPress pour toutes nos fiches (ports, navires, glossaire, etc.).
 *
 * L'écran Opérations (class-operations-screen.php) est l'écran principal des opérations ; ce
 * formulaire reste le chemin de secours et sert pour les listes simples.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Formulaire, enregistrement, archivage et colonnes de la liste.
 */
final class Classic_Form {

	private const NONCE = 'rsatlas_fields_nonce';

	/**
	 * Branche les crochets de l'admin.
	 */
	public static function boot(): void {
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_box' ) );
		add_action( 'save_post', array( self::class, 'save' ), 10, 2 );
		add_action( 'admin_notices', array( self::class, 'notices' ) );
		add_filter( 'post_row_actions', array( self::class, 'row_actions' ), 10, 2 );
		add_action( 'admin_post_rsatlas_archive', array( self::class, 'toggle_archive' ) );
		add_filter( 'display_post_states', array( self::class, 'post_states' ), 10, 2 );
		add_filter( 'manage_rsatlas_operation_posts_columns', array( self::class, 'columns' ) );
		add_action( 'manage_rsatlas_operation_posts_custom_column', array( self::class, 'column' ), 10, 2 );
	}

	/**
	 * Ajoute la boîte « Fiche » sur nos types de contenu.
	 *
	 * @param string $post_type Type de contenu affiché.
	 */
	public static function add_meta_box( string $post_type ): void {
		if ( Fields::is_ours( $post_type ) ) {
			add_meta_box( 'rsatlas-fields', __( 'Record', 'rescue-atlas-admin' ), array( self::class, 'render' ), $post_type, 'normal', 'high' );
		}
	}

	/**
	 * Affiche les champs. Tout ce qui sort est échappé ici, au dernier moment.
	 *
	 * @param \WP_Post $post Fiche.
	 */
	public static function render( \WP_Post $post ): void {
		wp_nonce_field( 'rsatlas_save_' . $post->ID, self::NONCE );
		echo '<table class="form-table" role="presentation"><tbody>';
		foreach ( Fields::for_type( $post->post_type ) as $key => $field ) {
			if ( ! empty( $field['section'] ) ) {
				printf( '<tr><th colspan="2"><h3>%s</h3></th></tr>', esc_html( $field['section'] ) );
			}
			$id    = 'rsatlas-' . $key;
			$value = get_post_meta( $post->ID, $key, true );
			printf(
				'<tr><th scope="row"><label for="%1$s">%2$s%3$s</label></th><td>',
				esc_attr( $id ),
				esc_html( $field['label'] ),
				empty( $field['required'] ) ? '' : ' <span aria-hidden="true">*</span>'
			);
			self::render_control( $id, 'rsatlas[' . $key . ']', $field, $value );
			if ( ! empty( $field['help'] ) ) {
				printf( '<p class="description">%s</p>', esc_html( $field['help'] ) );
			}
			echo '</td></tr>';
		}
		echo '</tbody></table>';
	}

	/**
	 * Un contrôle de formulaire, selon le type du champ.
	 *
	 * @param string               $id    Identifiant HTML.
	 * @param string               $name  Nom du champ dans le formulaire.
	 * @param array<string, mixed> $field Définition du champ.
	 * @param mixed                $value Valeur actuelle.
	 */
	private static function render_control( string $id, string $name, array $field, $value ): void {
		switch ( $field['type'] ) {
			case 'select':
			case 'ref':
				$options = 'select' === $field['type'] ? $field['options'] : self::ref_options( (string) $field['post_type'] );
				printf( '<select id="%s" name="%s"><option value="">%s</option>', esc_attr( $id ), esc_attr( $name ), esc_html__( 'None', 'rescue-atlas-admin' ) );
				foreach ( $options as $option_value => $label ) {
					printf( '<option value="%s"%s>%s</option>', esc_attr( (string) $option_value ), selected( (string) $value, (string) $option_value, false ), esc_html( $label ) );
				}
				echo '</select>';
				return;
			case 'bool':
				printf( '<input type="hidden" name="%1$s" value="0"><input type="checkbox" id="%2$s" name="%1$s" value="1"%3$s>', esc_attr( $name ), esc_attr( $id ), checked( (bool) $value, true, false ) );
				return;
			case 'textarea':
				printf( '<textarea id="%s" name="%s" rows="4" class="large-text">%s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( (string) $value ) );
				return;
			default:
				$html_type = array(
					'int'    => 'number',
					'number' => 'number',
					'date'   => 'date',
					'url'    => 'url',
				)[ $field['type'] ] ?? 'text';
				$step      = 'int' === $field['type'] ? '1' : ( 'number' === $field['type'] ? 'any' : '' );
				printf(
					'<input type="%1$s" id="%2$s" name="%3$s" value="%4$s" class="regular-text"%5$s%6$s%7$s%8$s>',
					esc_attr( $html_type ),
					esc_attr( $id ),
					esc_attr( $name ),
					esc_attr( (string) $value ),
					isset( $field['min'] ) ? ' min="' . esc_attr( (string) $field['min'] ) . '"' : '',
					isset( $field['max'] ) ? ' max="' . esc_attr( (string) $field['max'] ) . '"' : '',
					'' !== $step ? ' step="' . esc_attr( $step ) . '"' : '',
					isset( $field['pattern'] ) ? ' pattern="' . esc_attr( (string) $field['pattern'] ) . '"' : ''
				);
		}
	}

	/**
	 * Les fiches publiées d'un type, pour une liste déroulante.
	 *
	 * @param string $post_type Type de contenu.
	 * @return array<int, string>
	 */
	private static function ref_options( string $post_type ): array {
		$posts = get_posts(
			array(
				'post_type'      => $post_type,
				'post_status'    => 'publish',
				'posts_per_page' => 500, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- quelques centaines de fiches au plus, toutes utiles à l'écran.
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);
		return wp_list_pluck( $posts, 'post_title', 'ID' );
	}

	/**
	 * Enregistre les champs : nonce, droits, puis contrôles. Une fiche fausse ne reste pas publiée.
	 *
	 * @param int      $post_id Fiche.
	 * @param \WP_Post $post    Fiche.
	 */
	public static function save( int $post_id, \WP_Post $post ): void {
		if ( ! Fields::is_ours( $post->post_type ) || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}
		$nonce = isset( $_POST[ self::NONCE ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::NONCE ] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, 'rsatlas_save_' . $post_id ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		// Chaque champ est lu par son nom et contrôlé dans Validator::clean().
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- nettoyé champ par champ.
		$input                         = isset( $_POST['rsatlas'] ) && is_array( $_POST['rsatlas'] ) ? wp_unslash( $_POST['rsatlas'] ) : array();
		[ $values, $by_field, $cross ] = Validator::validate_and_store( $post_id, $post->post_type, $input );
		$fields                        = Fields::for_type( $post->post_type );
		$errors                        = array_merge(
			array_map( static fn( $key ) => $fields[ $key ]['label'] . ' : ' . $by_field[ $key ], array_keys( $by_field ) ),
			array_values( $cross )
		);

		$update = array();
		if ( 'rsatlas_operation' === $post->post_type ) {
			$update['post_title'] = Post_Types::operation_title( $values );
		}
		if ( array() !== $errors ) {
			set_transient( 'rsatlas_errors_' . get_current_user_id(), $errors, MINUTE_IN_SECONDS * 2 );
			if ( 'publish' === $post->post_status ) {
				$update['post_status'] = 'pending';
			}
		}
		if ( array() !== $update ) {
			remove_action( 'save_post', array( self::class, 'save' ), 10 );
			wp_update_post( array_merge( array( 'ID' => $post_id ), $update ) );
			add_action( 'save_post', array( self::class, 'save' ), 10, 2 );
		}
	}

	/**
	 * Affiche les erreurs de la dernière fiche enregistrée.
	 */
	public static function notices(): void {
		$key    = 'rsatlas_errors_' . get_current_user_id();
		$errors = get_transient( $key );
		if ( ! is_array( $errors ) || array() === $errors ) {
			return;
		}
		delete_transient( $key );
		echo '<div class="notice notice-error"><p><strong>' . esc_html__( 'Record saved, but not published: please fix the errors.', 'rescue-atlas-admin' ) . '</strong></p><ul>';
		foreach ( $errors as $error ) {
			echo '<li>' . esc_html( $error ) . '</li>';
		}
		echo '</ul></div>';
	}

	/**
	 * Dans la liste : « Archiver » à la place de « Corbeille ». Une suppression ne peut pas être
	 * retirée de la carte ; un archivage, si.
	 *
	 * @param array<string, string> $actions Actions de la ligne.
	 * @param \WP_Post              $post    Fiche.
	 * @return array<string, string>
	 */
	public static function row_actions( array $actions, \WP_Post $post ): array {
		if ( ! Fields::is_ours( $post->post_type ) ) {
			return $actions;
		}
		unset( $actions['trash'] );
		if ( ! current_user_can( 'publish_rsatlas_records' ) || ! in_array( $post->post_status, array( 'publish', Post_Types::ARCHIVED ), true ) ) {
			return $actions;
		}
		$url                        = wp_nonce_url( admin_url( 'admin-post.php?action=rsatlas_archive&post=' . $post->ID ), 'rsatlas_archive_' . $post->ID );
		$label                      = Post_Types::ARCHIVED === $post->post_status ? __( 'Back to draft', 'rescue-atlas-admin' ) : __( 'Archive', 'rescue-atlas-admin' );
		$actions['rsatlas_archive'] = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html( $label ) );
		return $actions;
	}

	/**
	 * Archive une fiche publiée, ou remet une fiche archivée en brouillon.
	 */
	public static function toggle_archive(): void {
		$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
		check_admin_referer( 'rsatlas_archive_' . $post_id );
		$post = get_post( $post_id );
		if ( ! $post || ! Fields::is_ours( $post->post_type ) || ! current_user_can( 'publish_rsatlas_records' ) || ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'You are not allowed to do this.', 'rescue-atlas-admin' ), 403 );
		}
		wp_update_post(
			array(
				'ID'          => $post_id,
				'post_status' => Post_Types::ARCHIVED === $post->post_status ? 'draft' : Post_Types::ARCHIVED,
			)
		);
		wp_safe_redirect( admin_url( 'edit.php?post_type=' . $post->post_type ) );
		exit;
	}

	/**
	 * Affiche « Archivé » à côté du titre dans la liste.
	 *
	 * @param array<string, string> $states États affichés.
	 * @param \WP_Post              $post   Fiche.
	 * @return array<string, string>
	 */
	public static function post_states( array $states, \WP_Post $post ): array {
		if ( Post_Types::ARCHIVED === $post->post_status ) {
			$states['rsatlas_archived'] = _x( 'Archived', 'post status', 'rescue-atlas-admin' );
		}
		return $states;
	}

	/**
	 * Les colonnes de la liste des opérations.
	 *
	 * @param array<string, string> $columns Colonnes.
	 * @return array<string, string>
	 */
	public static function columns( array $columns ): array {
		$date = $columns['date'] ?? '';
		unset( $columns['date'] );
		return array_merge(
			$columns,
			array(
				'rsatlas_date'   => __( 'Date', 'rescue-atlas-admin' ),
				'rsatlas_type'   => __( 'Type', 'rescue-atlas-admin' ),
				'rsatlas_people' => __( 'People', 'rescue-atlas-admin' ),
				'rsatlas_place'  => __( 'Disembarkation', 'rescue-atlas-admin' ),
				'date'           => $date,
			)
		);
	}

	/**
	 * Le contenu d'une colonne.
	 *
	 * @param string $column  Colonne.
	 * @param int    $post_id Fiche.
	 */
	public static function column( string $column, int $post_id ): void {
		$meta  = static fn( string $key ) => get_post_meta( $post_id, $key, true );
		$place = (int) ( '' !== $meta( 'port_disembarkation' ) ? $meta( 'port_disembarkation' ) : $meta( 'disembarkation_vessel' ) );
		$text  = match ( $column ) {
			'rsatlas_date' => (string) $meta( 'operation_date' ),
			'rsatlas_type' => Fields::for_type( 'rsatlas_operation' )['operation_type']['options'][ (string) $meta( 'operation_type' ) ] ?? '',
			'rsatlas_people' => (string) $meta( 'nb_survivor' ),
			'rsatlas_place' => $place ? get_the_title( $place ) : '',
			default => '',
		};
		echo esc_html( $text );
	}
}
