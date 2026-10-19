// @ts-check

/**
 * Dev-only fixtures for iterating on the service alerts UI without a feed that
 * returns situations. StopPane swaps these in when the dev server is running
 * and the URL has `?mockServiceAlerts`; production builds never reach this.
 *
 * @typedef {import('$lib/types').ServiceAlert} ServiceAlert
 */

export const MOCK_SERVICE_ALERTS_PARAM = 'mockServiceAlerts';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * True when the dev server is running and the current URL opts in.
 *
 * @returns {boolean}
 */
export function shouldMockServiceAlerts() {
	if (!import.meta.env.DEV || typeof window === 'undefined') return false;
	return new URLSearchParams(window.location.search).has(MOCK_SERVICE_ALERTS_PARAM);
}

/**
 * Build alerts relative to now so active windows always contain the present.
 * The first three target the given stop / its first route so the "affects this
 * stop" group appears; the rest are agency-wide or name other stops/routes.
 *
 * @param {{ id: string, routeIds?: string[] | null }} stop
 * @returns {ServiceAlert[]}
 */
export function mockServiceAlerts(stop) {
	const now = Date.now();
	const routeId = stop.routeIds?.[0] ?? null;

	return [
		{
			activeWindows: [{ from: now - 2 * HOUR, to: now + 6 * HOUR }],
			advice: {
				lang: 'en',
				value: 'Board at the temporary stop 50 ft north, in front of the pharmacy.'
			},
			allAffects: [{ stopId: stop.id }],
			consequences: [{ condition: 'STOP_MOVED' }],
			description: {
				lang: 'en',
				value:
					'Sidewalk construction has closed this stop. A temporary stop is in place for the duration of the work.'
			},
			id: 'mock_stop_closed',
			reason: 'CONSTRUCTION',
			severity: 'severe',
			summary: { lang: 'en', value: 'Stop temporarily relocated' }
		},
		{
			// Open-ended window renders "From {date}"; seconds exercise normalizeTimestamp.
			activeWindows: [{ from: Math.floor((now - 3 * DAY) / 1000) }],
			allAffects: [{ routeId }],
			consequences: [{ condition: 'DETOUR' }],
			description: {
				lang: 'en',
				value:
					'Buses are detoured around the bridge closure via 5th Ave and Pine St. Expect delays of up to 15 minutes.'
			},
			id: 'mock_route_detour',
			reason: 'environmentReason',
			severity: 'normal',
			summary: { lang: 'en', value: 'Detour due to bridge closure' }
		},
		{
			// No summary: list falls back to description, modal shows the no-summary note.
			activeWindows: [{ to: now + 2 * DAY }],
			allAffects: [{ routeId, stopId: stop.id }],
			consequences: [{ condition: 'REDUCED_SERVICE' }],
			description: {
				lang: 'en',
				value: 'Trips run every 30 minutes instead of every 15 minutes due to an operator shortage.'
			},
			id: 'mock_reduced_service',
			reason: 'personnelReason',
			severity: 'slight'
		},
		{
			activeWindows: [{ from: now - HOUR, to: now + 4 * HOUR }],
			advice: { lang: 'en', value: 'Allow extra travel time and check arrivals before leaving.' },
			allAffects: [{ agencyId: 'mock_agency' }],
			consequences: [{ condition: 'SIGNIFICANT_DELAYS' }],
			description: {
				lang: 'en',
				value: 'Heavy snowfall is causing systemwide delays. Some routes may be on snow detours.'
			},
			id: 'mock_snow',
			reason: 'WEATHER',
			severity: 'verySevere',
			summary: { lang: 'en', value: 'Systemwide winter weather delays' }
		},
		{
			// Two windows: the past one is skipped in favor of the one containing now.
			// Unrecognized cause/effect are humanized rather than translated.
			activeWindows: [
				{ from: now - 7 * DAY, to: now - 6 * DAY },
				{ from: now - 30 * 60 * 1000, to: now + 5 * HOUR }
			],
			allAffects: [{ routeId: 'mock_other_route' }],
			consequences: [{ condition: 'additionalTrips' }],
			description: {
				lang: 'en',
				value: 'Extra trips run after the stadium event lets out.'
			},
			id: 'mock_event_service',
			reason: 'SPECIAL_EVENT',
			severity: 'warning',
			summary: { lang: 'en', value: 'Extra service for stadium event' }
		},
		{
			// Bare minimum: no summary, description, advice, cause, effect, or severity.
			activeWindows: [{ from: now - DAY }],
			allAffects: [{ stopId: 'mock_other_stop' }],
			id: 'mock_bare'
		},
		{
			activeWindows: [{ from: now - 5 * DAY, to: now + 25 * DAY }],
			allAffects: [{ agencyId: 'mock_agency' }],
			consequences: [{ condition: 'NO_EFFECT' }],
			id: 'mock_fare_info',
			severity: 'info',
			summary: { lang: 'en', value: 'New fare cards available at customer service centers' }
		}
	];
}
