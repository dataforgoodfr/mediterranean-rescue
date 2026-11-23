// L'écran Opérations : la carte au centre, la liste ou la fiche à gauche.
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { errorMessage, fetchOperations, saveOperation } from './api';
import { asNumber } from './data';
import { OperationForm } from './OperationForm';
import { OperationList } from './OperationList';
import { OperationsMap } from './OperationsMap';
import type {
	FieldValue,
	InitialData,
	Intent,
	Operation,
	SaveResult,
} from './types';

type Selection =
	| { kind: 'list' }
	| { kind: 'new' }
	| { kind: 'edit'; id: number };

export function App( { data }: { data: InitialData } ) {
	const [ operations, setOperations ] = useState< Operation[] | null >(
		null
	);
	const [ loadError, setLoadError ] = useState< string | null >( null );
	const [ selection, setSelection ] = useState< Selection >( {
		kind: 'list',
	} );
	const [ values, setValues ] = useState< Record< string, FieldValue > >(
		{}
	);
	const [ result, setResult ] = useState< SaveResult | null >( null );
	const [ failure, setFailure ] = useState< string | null >( null );
	const [ saving, setSaving ] = useState( false );

	const load = useCallback( () => {
		setLoadError( null );
		fetchOperations().then( setOperations, ( error: unknown ) =>
			setLoadError( errorMessage( error ) )
		);
	}, [] );
	useEffect( load, [ load ] );

	const open = ( next: Selection ) => {
		const op =
			next.kind === 'edit'
				? operations?.find( ( o ) => o.id === next.id )
				: undefined;
		setSelection( next );
		setValues( op ? { ...op.fields } : { operation_type: 'rescue' } );
		setResult( null );
		setFailure( null );
	};

	const save = async ( intent: Intent ) => {
		setSaving( true );
		setFailure( null );
		try {
			const saved = await saveOperation(
				selection.kind === 'edit' ? selection.id : null,
				values,
				intent
			);
			setOperations( ( list ) => [
				saved.item,
				...( list ?? [] ).filter( ( o ) => o.id !== saved.item.id ),
			] );
			setSelection( { kind: 'edit', id: saved.item.id } );
			setValues( { ...saved.item.fields } );
			setResult( saved );
		} catch ( error ) {
			setFailure( errorMessage( error ) );
		} finally {
			setSaving( false );
		}
	};

	const current =
		selection.kind === 'edit'
			? operations?.find( ( o ) => o.id === selection.id ) ?? null
			: null;
	const lat = asNumber( values.latitude );
	const lon = asNumber( values.longitude );
	const editing = selection.kind !== 'list';
	const published =
		operations?.filter( ( o ) => o.status === 'publish' ).length ?? 0;

	let side;
	if ( loadError ) {
		side = (
			<div className="rsatlas-side__scroll">
				<p className="rsatlas-state rsatlas-state--error">
					{ sprintf(
						/* translators: %s: error message. */ __(
							'The operations could not be loaded (%s).',
							'rescue-atlas-admin'
						),
						loadError
					) }
				</p>
				<button
					type="button"
					className="rsatlas-button"
					onClick={ load }
				>
					{ __( 'Try again', 'rescue-atlas-admin' ) }
				</button>
			</div>
		);
	} else if ( operations === null ) {
		side = (
			<p className="rsatlas-state">
				{ __( 'Loading the operations…', 'rescue-atlas-admin' ) }
			</p>
		);
	} else if ( editing ) {
		side = (
			<OperationForm
				data={ data }
				operation={ current }
				values={ values }
				result={ result }
				failure={ failure }
				saving={ saving }
				onChange={ ( key, value ) =>
					setValues( ( v ) => ( { ...v, [ key ]: value } ) )
				}
				onSave={ save }
				onBack={ () => open( { kind: 'list' } ) }
			/>
		);
	} else {
		side = (
			<div className="rsatlas-side__scroll">
				<OperationList
					data={ data }
					operations={ operations }
					onOpen={ ( id ) => open( { kind: 'edit', id } ) }
				/>
			</div>
		);
	}

	return (
		<div className="rsatlas-shell">
			<header className="rsatlas-head">
				<div>
					<h1>{ __( 'Map operations', 'rescue-atlas-admin' ) }</h1>
					{ operations && (
						<p>
							{ sprintf(
								/* translators: 1: number of operations, 2: number of published operations. */
								_n(
									'%1$d operation, %2$d published',
									'%1$d operations, %2$d published',
									operations.length,
									'rescue-atlas-admin'
								),
								operations.length,
								published
							) }
						</p>
					) }
				</div>
				<button
					type="button"
					className="rsatlas-button rsatlas-button--on-dark"
					onClick={ () => open( { kind: 'new' } ) }
				>
					{ __( 'Add an operation', 'rescue-atlas-admin' ) }
				</button>
			</header>
			<div className="rsatlas-body">
				<aside
					className="rsatlas-side"
					aria-label={ __( 'Operations', 'rescue-atlas-admin' ) }
				>
					{ side }
				</aside>
				<OperationsMap
					operations={ operations ?? [] }
					ports={ data.ports }
					position={
						editing && lat !== null && lon !== null
							? { lat, lon }
							: null
					}
					editing={ editing && ! ( current && ! current.canEdit ) }
					onPick={ ( pickedLat, pickedLon ) =>
						setValues( ( v ) => ( {
							...v,
							latitude: Math.round( pickedLat * 1e4 ) / 1e4,
							longitude: Math.round( pickedLon * 1e4 ) / 1e4,
						} ) )
					}
					onSelect={ ( id ) => open( { kind: 'edit', id } ) }
				/>
			</div>
		</div>
	);
}
