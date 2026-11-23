// Build de l'écran Opérations avec la configuration officielle de @wordpress/scripts.
// On ne change que l'entrée et le dossier de sortie (le plugin). React, @wordpress/element,
// api-fetch et i18n ne sont pas embarqués : WordPress les fournit, et build/operations.asset.php
// liste ces dépendances pour wp_enqueue_script (Operations_Screen::enqueue).
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: { operations: path.resolve( __dirname, 'src/operations/index.tsx' ) },
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'plugin/rescue-atlas-admin/build' ),
	},
};
