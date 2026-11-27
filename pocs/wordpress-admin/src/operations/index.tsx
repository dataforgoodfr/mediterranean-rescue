// Point d'entrée : monte l'écran dans la page que PHP a préparée (admin/class-operations-screen.php).
import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { App } from './App';
import { parseInitialData } from './data';
import './screen.css';

declare global {
	interface Window {
		rsatlasOperations?: unknown;
	}
}

domReady( () => {
	const root = document.getElementById( 'rsatlas-operations' );
	if ( ! root ) {
		return;
	}
	const data = parseInitialData( window.rsatlasOperations );
	if ( ! data ) {
		root.textContent = __(
			'The screen could not start: missing data from WordPress.',
			'rescue-atlas-admin'
		);
		return;
	}
	createRoot( root ).render( <App data={ data } /> );
} );
