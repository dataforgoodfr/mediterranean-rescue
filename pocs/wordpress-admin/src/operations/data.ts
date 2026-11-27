// Lecture et contrôle des données qui viennent de WordPress : rien n'est pris sans vérification.
import type {
	FieldDef,
	FieldType,
	FieldValue,
	InitialData,
	Operation,
	Place,
	SaveResult,
	Status,
} from './types';

const FIELD_TYPES: readonly FieldType[] = [
	'date',
	'int',
	'number',
	'text',
	'textarea',
	'url',
	'select',
	'ref',
	'bool',
];
const STATUSES: readonly Status[] = [
	'publish',
	'pending',
	'draft',
	'rsatlas_archived',
];

function isRecord( value: unknown ): value is Record< string, unknown > {
	return (
		typeof value === 'object' && value !== null && ! Array.isArray( value )
	);
}

function str( value: unknown ): string | undefined {
	return typeof value === 'string' ? value : undefined;
}

function num( value: unknown ): number | undefined {
	return typeof value === 'number' && Number.isFinite( value )
		? value
		: undefined;
}

function isFieldType( value: unknown ): value is FieldType {
	return FIELD_TYPES.some( ( type ) => type === value );
}

function isStatus( value: unknown ): value is Status {
	return STATUSES.some( ( status ) => status === value );
}

function stringRecord( value: unknown ): Record< string, string > | undefined {
	if ( ! isRecord( value ) ) {
		return undefined;
	}
	const out: Record< string, string > = {};
	for ( const [ key, label ] of Object.entries( value ) ) {
		if ( typeof label === 'string' ) {
			out[ key ] = label;
		}
	}
	return out;
}

function parseField( value: unknown ): FieldDef | undefined {
	if ( ! isRecord( value ) || ! isFieldType( value.type ) ) {
		return undefined;
	}
	return {
		label: str( value.label ) ?? '',
		type: value.type,
		required: value.required === true,
		min: num( value.min ),
		max: num( value.max ),
		help: str( value.help ),
		section: str( value.section ),
		pattern: str( value.pattern ),
		options: stringRecord( value.options ),
		postType: str( value.post_type ),
	};
}

function parsePlace( value: unknown ): Place | undefined {
	if ( ! isRecord( value ) || typeof value.id !== 'number' ) {
		return undefined;
	}
	return {
		id: value.id,
		name: str( value.name ) ?? '',
		lat: num( value.lat ) ?? null,
		lon: num( value.lon ) ?? null,
	};
}

function parseList< T >(
	value: unknown,
	parse: ( item: unknown ) => T | undefined
): T[] {
	return Array.isArray( value )
		? value.map( parse ).filter( ( item ): item is T => item !== undefined )
		: [];
}

/**
 * Les données de départ posées par PHP dans window.rsatlasOperations.
 * @param value
 */
export function parseInitialData( value: unknown ): InitialData | undefined {
	if ( ! isRecord( value ) || ! isRecord( value.fields ) ) {
		return undefined;
	}
	const fields: Record< string, FieldDef > = {};
	for ( const [ key, def ] of Object.entries( value.fields ) ) {
		const field = parseField( def );
		if ( field ) {
			fields[ key ] = field;
		}
	}
	return {
		fields,
		ports: parseList( value.ports, parsePlace ),
		ships: parseList( value.ships, parsePlace ),
		canPublish: value.canPublish === true,
	};
}

function fieldValue( value: unknown ): FieldValue {
	return typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
		? value
		: null;
}

export function parseOperation( value: unknown ): Operation | undefined {
	if (
		! isRecord( value ) ||
		typeof value.id !== 'number' ||
		! isStatus( value.status )
	) {
		return undefined;
	}
	const fields: Record< string, FieldValue > = {};
	if ( isRecord( value.fields ) ) {
		for ( const [ key, raw ] of Object.entries( value.fields ) ) {
			fields[ key ] = fieldValue( raw );
		}
	}
	return {
		id: value.id,
		title: str( value.title ) ?? '',
		status: value.status,
		author: str( value.author ) ?? '',
		canEdit: value.canEdit === true,
		fields,
	};
}

export function parseOperations( value: unknown ): Operation[] {
	return parseList( value, parseOperation );
}

export function parseSaveResult( value: unknown ): SaveResult | undefined {
	if ( ! isRecord( value ) ) {
		return undefined;
	}
	const item = parseOperation( value.item );
	if ( ! item ) {
		return undefined;
	}
	const errors = isRecord( value.errors ) ? value.errors : {};
	return {
		item,
		fieldErrors: stringRecord( errors.fields ) ?? {},
		generalErrors: Array.isArray( errors.general )
			? errors.general.filter(
					( e ): e is string => typeof e === 'string'
			  )
			: [],
		message: str( value.message ) ?? '',
	};
}

/**
 * Un nombre lu dans une valeur de champ (le serveur renvoie les métas en texte).
 * @param value
 */
export function asNumber( value: FieldValue | undefined ): number | null {
	if (
		value === null ||
		value === undefined ||
		value === '' ||
		typeof value === 'boolean'
	) {
		return null;
	}
	const n = Number( value );
	return Number.isFinite( n ) ? n : null;
}
