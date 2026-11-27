<?php
/**
 * Plugin Name:       Rescue Atlas Admin
 * Description:       Back office for the Rescue Atlas map of SOS MEDITERRANEE: map operations, events, ports, ships and glossary, with checks before publication, roles and a read-only API for the map.
 * Version:           0.1.0
 * Requires at least: 7.0
 * Requires PHP:      8.2
 * Author:            Data for Good volunteers
 * Author URI:        https://github.com/dataforgoodfr/mediterranean-rescue
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       rescue-atlas-admin
 * Domain Path:       /languages
 * Update URI:        https://github.com/dataforgoodfr/mediterranean-rescue
 *
 * Fichier d'amorçage : il charge les classes et branche les crochets, rien d'autre.
 * Le plan du plugin et les règles à suivre : GUIDE.md, à la racine du POC.
 *
 * @package RescueAtlas\Admin
 */

namespace RescueAtlas\Admin;

defined( 'ABSPATH' ) || exit;

const VERSION     = '0.1.0';
const PLUGIN_FILE = __FILE__;

require_once __DIR__ . '/includes/class-fields.php';
require_once __DIR__ . '/includes/class-validator.php';
require_once __DIR__ . '/includes/class-post-types.php';
require_once __DIR__ . '/includes/class-roles.php';
require_once __DIR__ . '/includes/rest/class-public-controller.php';
require_once __DIR__ . '/includes/rest/class-admin-controller.php';
require_once __DIR__ . '/includes/class-plugin.php';

// Activation : les rôles s'écrivent une seule fois en base. Ces crochets restent au niveau du fichier
// principal, jamais dans un autre crochet (Plugin Handbook, « Activation / Deactivation Hooks »).
register_activation_hook( __FILE__, array( Roles::class, 'activate' ) );

Plugin::boot();
