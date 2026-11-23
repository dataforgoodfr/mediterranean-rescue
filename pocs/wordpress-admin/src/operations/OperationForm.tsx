// La fiche d'une opération : les champs groupés par section, les erreurs sur chaque champ, et des
// boutons qui dépendent du rôle (Saisie envoie en relecture, Validation publie et archive).
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { STATUS_COLOR, statusLabel } from './status';
import type {
	FieldDef,
	FieldType,
	FieldValue,
	InitialData,
	Intent,
	Operation,
	SaveResult,
} from './types';

interface Props {
	data: InitialData;
	operation: Operation | null;
	values: Record< string, FieldValue >;
	result: SaveResult | null;
	failure: string | null;
	saving: boolean;
	onChange: ( key: string, value: string ) => void;
	onSave: ( intent: Intent ) => void;
	onBack: () => void;
}

interface Group {
	title: string;
	keys: string[];
}

function groups( fields: Record< string, FieldDef > ): Group[] {
	const out: Group[] = [];
	for ( const [ key, field ] of Object.entries( fields ) ) {
		const last = out[ out.length - 1 ];
		if ( field.section || ! last ) {
			out.push( { title: field.section ?? '', keys: [ key ] } );
		} else {
			last.keys.push( key );
		}
	}
	return out;
}

const STEP: Partial< Record< FieldType, number | string > > = {
	int: 1,
	number: 'any',
};
const INPUT_MODE: Partial< Record< FieldType, 'numeric' | 'decimal' > > = {
	int: 'numeric',
	number: 'decimal',
};

function inputType( type: FieldType ): string {
	if ( type === 'int' || type === 'number' ) {
		return 'number';
	}
	return type === 'date' || type === 'url' ? type : 'text';
}

function Field( props: {
	name: string;
	field: FieldDef;
	value: FieldValue | undefined;
	error: string | undefined;
	disabled: boolean;
	data: InitialData;
	onChange: ( key: string, value: string ) => void;
} ) {
	const { name, field, value, error, disabled, data, onChange } = props;
	const id = `rsatlas-field-${ name }`;
	const describedBy =
		[ field.help ? `${ id }-help` : '', error ? `${ id }-error` : '' ]
			.filter( Boolean )
			.join( ' ' ) || undefined;
	const current =
		value === null || value === undefined ? '' : String( value );
	const common = {
		id,
		name,
		disabled,
		'aria-invalid': error ? true : undefined,
		'aria-describedby': describedBy,
	};
	let control;
	if ( field.type === 'select' || field.type === 'ref' ) {
		const places =
			field.postType === 'rsatlas_port' ? data.ports : data.ships;
		const options =
			field.type === 'select'
				? Object.entries( field.options ?? {} )
				: places.map( ( place ): [ string, string ] => [
						String( place.id ),
						place.name,
				  ] );
		control = (
			<select
				{ ...common }
				value={ current }
				onChange={ ( e ) => onChange( name, e.target.value ) }
			>
				<option value="">{ __( 'None', 'rescue-atlas-admin' ) }</option>
				{ options.map( ( [ optionValue, label ] ) => (
					<option key={ optionValue } value={ optionValue }>
						{ label }
					</option>
				) ) }
			</select>
		);
	} else {
		const type = inputType( field.type );
		control = (
			<input
				{ ...common }
				type={ type }
				value={ current }
				min={ field.min }
				max={ field.max }
				step={ STEP[ field.type ] }
				inputMode={ INPUT_MODE[ field.type ] }
				onChange={ ( e ) => onChange( name, e.target.value ) }
			/>
		);
	}
	const wide =
		field.type === 'text' ||
		field.type === 'url' ||
		field.type === 'ref' ||
		name === 'operation_type';
	return (
		<div
			className={
				wide ? 'rsatlas-field rsatlas-field--wide' : 'rsatlas-field'
			}
		>
			<label htmlFor={ id }>
				{ field.label }
				{ field.required && <span aria-hidden="true"> *</span> }
			</label>
			{ control }
			{ field.help && (
				<p className="rsatlas-help" id={ `${ id }-help` }>
					{ field.help }
				</p>
			) }
			{ error && (
				<p className="rsatlas-error" id={ `${ id }-error` }>
					{ error }
				</p>
			) }
		</div>
	);
}

export function OperationForm( {
	data,
	operation,
	values,
	result,
	failure,
	saving,
	onChange,
	onSave,
	onBack,
}: Props ) {
	const alert = useRef< HTMLDivElement >( null );
	const readOnly = operation !== null && ! operation.canEdit;
	const problems = result
		? [
				...result.generalErrors,
				...Object.entries( result.fieldErrors ).map(
					( [ key, message ] ) =>
						`${ data.fields[ key ]?.label ?? key } : ${ message }`
				),
		  ]
		: [];

	// Après un enregistrement, le focus va au message : un lecteur d'écran le lit tout de suite.
	useEffect( () => {
		if ( result || failure ) {
			alert.current?.focus();
		}
	}, [ result, failure ] );

	return (
		<form
			className="rsatlas-form"
			noValidate
			onSubmit={ ( e ) => e.preventDefault() }
		>
			<div className="rsatlas-side__scroll">
				<p>
					<button
						type="button"
						className="rsatlas-link"
						onClick={ onBack }
					>
						{ __( '← All operations', 'rescue-atlas-admin' ) }
					</button>
				</p>
				<h2>
					{ operation
						? operation.title
						: __( 'New operation', 'rescue-atlas-admin' ) }
				</h2>
				{ operation && (
					<p className="rsatlas-form__status">
						{ __( 'Status:', 'rescue-atlas-admin' ) }{ ' ' }
						<strong
							style={ {
								color: STATUS_COLOR[ operation.status ],
							} }
						>
							{ statusLabel( operation.status ) }
						</strong>
						{ operation.author &&
							`, ${ sprintf(
								/* translators: %s: name of the author. */ __(
									'by %s',
									'rescue-atlas-admin'
								),
								operation.author
							) }` }
					</p>
				) }
				<div
					ref={ alert }
					tabIndex={ -1 }
					role={ problems.length || failure ? 'alert' : 'status' }
				>
					{ failure && (
						<div className="rsatlas-alert">
							<strong>
								{ sprintf(
									/* translators: %s: error message. */ __(
										'Not saved: %s',
										'rescue-atlas-admin'
									),
									failure
								) }
							</strong>
						</div>
					) }
					{ result && (
						<div
							className={
								problems.length
									? 'rsatlas-alert'
									: 'rsatlas-alert rsatlas-alert--ok'
							}
						>
							<strong>{ result.message }</strong>
							{ problems.length > 0 && (
								<ul>
									{ problems.map( ( problem ) => (
										<li key={ problem }>{ problem }</li>
									) ) }
								</ul>
							) }
						</div>
					) }
				</div>
				{ groups( data.fields ).map( ( group ) => (
					<section key={ group.keys[ 0 ] }>
						{ group.title && <h3>{ group.title }</h3> }
						<div className="rsatlas-grid">
							{ group.keys.map( ( key ) => {
								const field = data.fields[ key ];
								return field ? (
									<Field
										key={ key }
										name={ key }
										field={ field }
										value={ values[ key ] }
										error={ result?.fieldErrors[ key ] }
										disabled={ readOnly || saving }
										data={ data }
										onChange={ onChange }
									/>
								) : null;
							} ) }
						</div>
					</section>
				) ) }
			</div>
			<div className="rsatlas-actions">
				{ readOnly ? (
					<p className="rsatlas-help">
						{ __(
							'Read only: this record is published or belongs to someone else.',
							'rescue-atlas-admin'
						) }
					</p>
				) : (
					<>
						{ data.canPublish ? (
							<button
								type="button"
								className="rsatlas-button rsatlas-button--primary"
								disabled={ saving }
								onClick={ () => onSave( 'publish' ) }
							>
								{ __( 'Publish', 'rescue-atlas-admin' ) }
							</button>
						) : (
							<button
								type="button"
								className="rsatlas-button rsatlas-button--primary"
								disabled={ saving }
								onClick={ () => onSave( 'submit' ) }
							>
								{ __(
									'Send for review',
									'rescue-atlas-admin'
								) }
							</button>
						) }
						<button
							type="button"
							className="rsatlas-button"
							disabled={ saving }
							onClick={ () => onSave( 'save' ) }
						>
							{ __( 'Save', 'rescue-atlas-admin' ) }
						</button>
						{ data.canPublish &&
							operation?.status === 'publish' && (
								<button
									type="button"
									className="rsatlas-button"
									disabled={ saving }
									onClick={ () => onSave( 'archive' ) }
								>
									{ __( 'Archive', 'rescue-atlas-admin' ) }
								</button>
							) }
					</>
				) }
			</div>
		</form>
	);
}
