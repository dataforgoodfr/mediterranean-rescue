// La carte de l'écran : les opérations en points (couleur de leur état), les ports, et le point
// de la fiche ouverte, déplaçable. Même fond et même cadre que la carte publique (frontend/src/map).
import type { FeatureCollection } from 'geojson';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	GeoJSONSource,
	Map as MapLibreMap,
	Marker,
	NavigationControl,
	setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { asNumber } from './data';
import type { Operation, Place } from './types';

// Le worker de MapLibre est un fichier à part, que webpack copie à côté du build.
setWorkerUrl(
	new URL( 'maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url ).href
);

// Fond libre, sans compte ni clé : https://openfreemap.org/quick_start/
const BASE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const CENTRAL_MEDITERRANEAN: [ [ number, number ], [ number, number ] ] = [
	[ 10, 30.5 ],
	[ 20, 38.5 ],
];
const MEDITERRANEAN: [ [ number, number ], [ number, number ] ] = [
	[ -6, 29 ],
	[ 37, 46.5 ],
];
const STATUS_HEX: Record< string, string > = {
	publish: '#1a2747',
	pending: '#c53215',
	draft: '#6b6a75',
	rsatlas_archived: '#b9b8c4',
};

interface Props {
	operations: Operation[];
	ports: Place[];
	/** Position de la fiche ouverte, ou null si aucune fiche n'est ouverte ou placée. */
	position: { lat: number; lon: number } | null;
	/** Vrai quand une fiche est ouverte : un clic place alors le point. */
	editing: boolean;
	onPick: ( lat: number, lon: number ) => void;
	onSelect: ( id: number ) => void;
}

function operationsGeoJSON( operations: Operation[] ): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: operations.flatMap( ( op ) => {
			const lat = asNumber( op.fields.latitude );
			const lon = asNumber( op.fields.longitude );
			if ( lat === null || lon === null ) {
				return [];
			}
			return [
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [ lon, lat ] },
					properties: {
						id: op.id,
						people: asNumber( op.fields.nb_survivor ) ?? 0,
						color: STATUS_HEX[ op.status ] ?? '#6b6a75',
					},
				},
			];
		} ),
	};
}

function portsGeoJSON( ports: Place[] ): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: ports.flatMap( ( port ) =>
			port.lat === null || port.lon === null
				? []
				: [
						{
							type: 'Feature',
							geometry: {
								type: 'Point',
								coordinates: [ port.lon, port.lat ],
							},
							properties: { name: port.name },
						},
				  ]
		),
	};
}

export function OperationsMap( {
	operations,
	ports,
	position,
	editing,
	onPick,
	onSelect,
}: Props ) {
	const container = useRef< HTMLDivElement >( null );
	const map = useRef< MapLibreMap | null >( null );
	const marker = useRef< Marker | null >( null );
	// Les rappels changent à chaque rendu : la carte lit toujours la dernière version.
	const handlers = useRef( { editing, onPick, onSelect } );
	handlers.current = { editing, onPick, onSelect };
	// Les opérations peuvent arriver avant que la carte ait fini de charger : on garde la
	// dernière liste pour la poser au chargement.
	const latest = useRef( { operations, ports } );
	latest.current = { operations, ports };

	useEffect( () => {
		if ( ! container.current ) {
			return undefined;
		}
		const instance = new MapLibreMap( {
			container: container.current,
			style: BASE_MAP_STYLE,
			bounds: CENTRAL_MEDITERRANEAN,
			maxBounds: MEDITERRANEAN,
		} );
		instance.addControl( new NavigationControl( { showCompass: false } ) );
		// Sans gestionnaire d'erreur, MapLibre écrit lui-même dans la console une tuile qui ne
		// charge pas, et la carte reste en place.
		instance.on( 'load', () => {
			instance.addSource( 'ports', {
				type: 'geojson',
				data: portsGeoJSON( latest.current.ports ),
			} );
			instance.addLayer( {
				id: 'ports',
				type: 'circle',
				source: 'ports',
				paint: {
					'circle-radius': 4,
					'circle-color': '#ffffff',
					'circle-stroke-color': '#1a2747',
					'circle-stroke-width': 2,
				},
			} );
			instance.addSource( 'operations', {
				type: 'geojson',
				data: operationsGeoJSON( latest.current.operations ),
			} );
			instance.addLayer( {
				id: 'operations',
				type: 'circle',
				source: 'operations',
				paint: {
					'circle-radius': [
						'interpolate',
						[ 'linear' ],
						[ 'get', 'people' ],
						0,
						6,
						100,
						12,
						500,
						20,
					],
					'circle-color': [ 'get', 'color' ],
					'circle-opacity': 0.85,
					'circle-stroke-color': '#ffffff',
					'circle-stroke-width': 2,
				},
			} );
		} );
		instance.on( 'click', 'operations', ( event ) => {
			const id = event.features?.[ 0 ]?.properties?.id;
			if ( ! handlers.current.editing && typeof id === 'number' ) {
				handlers.current.onSelect( id );
			}
		} );
		instance.on( 'click', ( event ) => {
			if ( handlers.current.editing ) {
				handlers.current.onPick( event.lngLat.lat, event.lngLat.lng );
			}
		} );
		map.current = instance;
		return () => {
			instance.remove();
			map.current = null;
		};
		// La carte se crée une seule fois ; les données passent par les effets ci-dessous.
	}, [] );

	useEffect( () => {
		const source = map.current?.getSource( 'operations' );
		if ( source instanceof GeoJSONSource ) {
			source.setData( operationsGeoJSON( operations ) );
		}
	}, [ operations ] );

	useEffect( () => {
		const instance = map.current;
		if ( ! instance ) {
			return;
		}
		if ( ! position ) {
			marker.current?.remove();
			marker.current = null;
			return;
		}
		if ( ! marker.current ) {
			const created = new Marker( { color: '#f03e1b', draggable: true } );
			created.on( 'dragend', () => {
				const { lat, lng } = created.getLngLat();
				handlers.current.onPick( lat, lng );
			} );
			marker.current = created;
		}
		marker.current
			.setLngLat( [ position.lon, position.lat ] )
			.addTo( instance );
	}, [ position ] );

	return (
		<div
			className="rsatlas-map"
			role="region"
			aria-label={ __( 'Map of the operations', 'rescue-atlas-admin' ) }
		>
			<div ref={ container } className="rsatlas-map__canvas" />
			{ editing && ! position && (
				<p className="rsatlas-map__hint" role="status">
					{ __(
						'Click on the map to place the operation.',
						'rescue-atlas-admin'
					) }
				</p>
			) }
		</div>
	);
}
