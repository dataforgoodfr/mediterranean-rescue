<?php
/**
 * L'écran Opérations : une page de l'admin où monte une application React (src/operations/).
 *
 * WordPress fournit la page, la connexion, les droits et React lui-même : le script est construit
 * par @wordpress/scripts, qui écrit dans build/operations.asset.php la liste des scripts de
 * WordPress dont il dépend. On n'embarque jamais notre propre copie de React.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Page, scripts et données de départ de l'écran Opérations.
 */
final class Operations_Screen {

	public const SLUG    = 'rsatlas-operations';
	private const HANDLE = 'rsatlas-operations';

	/**
	 * Suffixe de la page renvoyé par add_submenu_page, pour ne charger nos scripts que sur elle.
	 *
	 * @var string
	 */
	private static string $hook = '';

	/**
	 * Branche les crochets de l'admin.
	 */
	public static function boot(): void {
		add_action( 'admin_menu', array( self::class, 'add_page' ) );
		add_action( 'admin_enqueue_scripts', array( self::class, 'enqueue' ) );
		add_filter( 'admin_body_class', array( self::class, 'body_class' ) );
	}

	/**
	 * Ajoute « Écran Opérations » en tête du menu Rescue Atlas.
	 */
	public static function add_page(): void {
		self::$hook = (string) add_submenu_page(
			'edit.php?post_type=rsatlas_operation',
			__( 'Map operations', 'rescue-atlas-admin' ),
			__( 'Operations screen', 'rescue-atlas-admin' ),
			'edit_rsatlas_records',
			self::SLUG,
			array( self::class, 'render' ),
			0
		);
	}

	/**
	 * Le point de montage de l'application, avec un texte pour qui n'a pas JavaScript.
	 */
	public static function render(): void {
		echo '<div id="rsatlas-operations" class="rsatlas-app"><p>' . esc_html__( 'Loading the operations…', 'rescue-atlas-admin' ) . '</p></div>';
	}

	/**
	 * Charge le script et la feuille de style construits, seulement sur notre page.
	 *
	 * @param string $hook_suffix Page affichée.
	 */
	public static function enqueue( string $hook_suffix ): void {
		if ( $hook_suffix !== self::$hook ) {
			return;
		}
		$dir   = plugin_dir_path( PLUGIN_FILE ) . 'build/';
		$asset = $dir . 'operations.asset.php';
		if ( ! file_exists( $asset ) ) {
			// Le plugin vient des sources sans build : on le dit au lieu d'afficher une page vide.
			wp_add_inline_script( 'common', 'console.error("Rescue Atlas: build/operations.js is missing, run pnpm build.")' );
			return;
		}
		$meta = require $asset;
		$url  = plugin_dir_url( PLUGIN_FILE ) . 'build/';
		wp_enqueue_script( self::HANDLE, $url . 'operations.js', $meta['dependencies'], $meta['version'], true );
		wp_enqueue_style( self::HANDLE, $url . 'operations.css', array( 'wp-components' ), $meta['version'] );
		wp_set_script_translations( self::HANDLE, 'rescue-atlas-admin', plugin_dir_path( PLUGIN_FILE ) . 'languages' );
		wp_add_inline_script( self::HANDLE, 'window.rsatlasOperations = ' . wp_json_encode( self::initial_data(), JSON_HEX_TAG | JSON_HEX_AMP ) . ';', 'before' );
	}

	/**
	 * Les données de départ : la définition des champs, les ports et navires, les droits.
	 *
	 * @return array<string, mixed>
	 */
	private static function initial_data(): array {
		return array(
			'fields'     => Fields::for_type( 'rsatlas_operation' ),
			'ports'      => self::places( 'rsatlas_port' ),
			'ships'      => self::places( 'rsatlas_ship' ),
			'canPublish' => current_user_can( 'publish_rsatlas_records' ),
		);
	}

	/**
	 * Les ports ou navires publiés, avec leur position quand elle existe.
	 *
	 * @param string $post_type Type de contenu.
	 * @return list<array{id: int, name: string, lat: ?float, lon: ?float}>
	 */
	private static function places( string $post_type ): array {
		$posts = get_posts(
			array(
				'post_type'      => $post_type,
				'post_status'    => 'publish',
				'posts_per_page' => 500, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- quelques centaines de fiches au plus, toutes utiles à l'écran.
				'orderby'        => 'title',
				'order'          => 'ASC',
			)
		);
		return array_map(
			static function ( \WP_Post $post ): array {
				$lat = get_post_meta( $post->ID, 'latitude', true );
				$lon = get_post_meta( $post->ID, 'longitude', true );
				return array(
					'id'   => $post->ID,
					'name' => $post->post_title,
					'lat'  => '' === $lat ? null : (float) $lat,
					'lon'  => '' === $lon ? null : (float) $lon,
				);
			},
			$posts
		);
	}

	/**
	 * Une classe sur le body de notre page, pour la mise en page pleine largeur.
	 *
	 * @param string $classes Classes du body.
	 */
	public static function body_class( string $classes ): string {
		$screen = get_current_screen();
		return ( $screen && $screen->id === self::$hook ) ? $classes . ' rsatlas-screen' : $classes;
	}
}
