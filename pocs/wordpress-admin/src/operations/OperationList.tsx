// La liste des opérations : date, nombre de personnes, lieu de débarquement et état, en toutes lettres.
import { __, _n, sprintf } from '@wordpress/i18n';
import { asNumber } from './data';
import { STATUS_COLOR, statusLabel } from './status';
import type { InitialData, Operation } from './types';

interface Props {
	data: InitialData;
	operations: Operation[];
	onOpen: ( id: number ) => void;
}

function formatDate( value: string ): string {
	const date = new Date( `${ value }T12:00:00` );
	return Number.isNaN( date.getTime() )
		? value
		: date.toLocaleDateString( undefined, {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
		  } );
}

function describe( data: InitialData, op: Operation ): string {
	const people = asNumber( op.fields.nb_survivor );
	const port = data.ports.find(
		( p ) => p.id === asNumber( op.fields.port_disembarkation )
	);
	const ship = data.ships.find(
		( s ) => s.id === asNumber( op.fields.disembarkation_vessel )
	);
	const parts: string[] = [];
	if ( people === null ) {
		parts.push( __( 'number unknown', 'rescue-atlas-admin' ) );
	} else {
		parts.push(
			sprintf(
				/* translators: %d: number of people rescued. */
				_n( '%d person', '%d people', people, 'rescue-atlas-admin' ),
				people
			)
		);
	}
	if ( port ) {
		parts.push(
			sprintf(
				/* translators: %s: name of the port. */
				__( 'disembarked in %s', 'rescue-atlas-admin' ),
				port.name
			)
		);
	}
	if ( ship ) {
		parts.push(
			sprintf(
				/* translators: %s: name of the ship. */
				__( 'transferred to %s', 'rescue-atlas-admin' ),
				ship.name
			)
		);
	}
	if ( asNumber( op.fields.latitude ) === null ) {
		parts.push( __( 'no position', 'rescue-atlas-admin' ) );
	}
	return parts.join( ', ' );
}

export function OperationList( { data, operations, onOpen }: Props ) {
	if ( operations.length === 0 ) {
		return (
			<p className="rsatlas-state">
				{ __(
					'No operation yet. Click “Add an operation”, then on the map to place the first one.',
					'rescue-atlas-admin'
				) }
			</p>
		);
	}
	return (
		<ul className="rsatlas-list">
			{ operations.map( ( op ) => {
				const date =
					typeof op.fields.operation_date === 'string'
						? formatDate( op.fields.operation_date )
						: __( 'no date', 'rescue-atlas-admin' );
				const title =
					op.fields.operation_type === 'transfer'
						? sprintf(
								/* translators: %s: date of the transfer. */
								__( 'Transfer of %s', 'rescue-atlas-admin' ),
								date
						  )
						: sprintf(
								/* translators: %s: date of the rescue. */
								__( 'Rescue of %s', 'rescue-atlas-admin' ),
								date
						  );
				return (
					<li key={ op.id }>
						<button
							type="button"
							className="rsatlas-item"
							style={ {
								borderLeftColor: STATUS_COLOR[ op.status ],
							} }
							onClick={ () => onOpen( op.id ) }
						>
							<span className="rsatlas-item__title">
								{ title }
							</span>
							<span className="rsatlas-item__meta">
								{ describe( data, op ) }
							</span>
							<span
								className="rsatlas-item__status"
								style={ { color: STATUS_COLOR[ op.status ] } }
							>
								{ statusLabel( op.status ) }
							</span>
						</button>
					</li>
				);
			} ) }
		</ul>
	);
}
