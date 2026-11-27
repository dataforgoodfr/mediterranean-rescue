// Les appels à l'API du plugin. @wordpress/api-fetch ajoute tout seul l'adresse de l'API et le
// jeton de sécurité (X-WP-Nonce) : on ne le manipule jamais à la main.
import apiFetch from '@wordpress/api-fetch';
import { parseOperations, parseSaveResult } from './data';
import type { FieldValue, Intent, Operation, SaveResult } from './types';

const PATH = '/rescue-atlas/v1/admin/operations';

export async function fetchOperations(): Promise< Operation[] > {
	return parseOperations( await apiFetch( { path: PATH } ) );
}

export async function saveOperation(
	id: number | null,
	fields: Record< string, FieldValue >,
	intent: Intent
): Promise< SaveResult > {
	const result = parseSaveResult(
		await apiFetch( {
			path: id === null ? PATH : `${ PATH }/${ id }`,
			method: 'POST',
			data: { fields, intent },
		} )
	);
	if ( ! result ) {
		throw new Error( 'Unexpected answer from the server.' );
	}
	return result;
}

/**
 * Le message d'une erreur renvoyée par api-fetch (objet WordPress { code, message }) ou par JS.
 * @param error
 */
export function errorMessage( error: unknown ): string {
	if ( error instanceof Error ) {
		return error.message;
	}
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message;
	}
	return String( error );
}
