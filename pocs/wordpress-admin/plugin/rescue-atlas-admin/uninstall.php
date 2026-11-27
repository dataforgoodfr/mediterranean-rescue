<?php
/**
 * Désinstallation (Extensions > Supprimer) : retire les réglages, les rôles et les capacités.
 *
 * Les fiches (opérations, ports, etc.) restent en base, volontairement : ce sont les données de
 * SOS MEDITERRANEE, et une suppression ne se rattrape pas. Les effacer est une décision humaine.
 * La désactivation, elle, ne touche à rien.
 *
 * @package RescueAtlas\Admin
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

require_once __DIR__ . '/includes/class-roles.php';

delete_option( 'rsatlas_status_message' );
delete_option( 'rsatlas_status_updated' );
delete_option( 'rsatlas_api_key' );
RescueAtlas\Admin\Roles::remove();
