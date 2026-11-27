import { __ } from '@wordpress/i18n';
import type { Status } from './types';

// Un état se lit en toutes lettres, avec sa couleur sur un filet : pas de pastille.
export const STATUS_COLOR: Record< Status, string > = {
	publish: 'var(--rsatlas-color-primary)',
	pending: 'var(--rsatlas-color-secondary-text)',
	draft: 'var(--rsatlas-color-muted)',
	rsatlas_archived: 'var(--rsatlas-color-archived)',
};

export function statusLabel( status: Status ): string {
	switch ( status ) {
		case 'publish':
			return __( 'published', 'rescue-atlas-admin' );
		case 'pending':
			return __( 'in review', 'rescue-atlas-admin' );
		case 'draft':
			return __( 'draft', 'rescue-atlas-admin' );
		case 'rsatlas_archived':
			return __( 'archived', 'rescue-atlas-admin' );
	}
}
