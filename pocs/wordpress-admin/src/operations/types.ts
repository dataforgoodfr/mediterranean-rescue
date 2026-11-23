// Les formes de données de l'écran. Celles qui viennent du serveur sont vérifiées à l'arrivée
// (data.ts) : TypeScript ne fait jamais confiance à ce qu'il n'a pas contrôlé.

export type FieldType =
	| 'date'
	| 'int'
	| 'number'
	| 'text'
	| 'textarea'
	| 'url'
	| 'select'
	| 'ref'
	| 'bool';

export interface FieldDef {
	label: string;
	type: FieldType;
	required: boolean;
	min?: number;
	max?: number;
	help?: string;
	section?: string;
	pattern?: string;
	options?: Record< string, string >;
	postType?: string;
}

export interface Place {
	id: number;
	name: string;
	lat: number | null;
	lon: number | null;
}

export interface InitialData {
	fields: Record< string, FieldDef >;
	ports: Place[];
	ships: Place[];
	canPublish: boolean;
}

export type Status = 'publish' | 'pending' | 'draft' | 'rsatlas_archived';

export type FieldValue = string | number | boolean | null;

export interface Operation {
	id: number;
	title: string;
	status: Status;
	author: string;
	canEdit: boolean;
	fields: Record< string, FieldValue >;
}

export type Intent = 'save' | 'submit' | 'publish' | 'archive';

export interface SaveResult {
	item: Operation;
	fieldErrors: Record< string, string >;
	generalErrors: string[];
	message: string;
}
