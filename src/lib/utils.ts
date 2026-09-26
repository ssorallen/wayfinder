import type { ArrivalAndDepartureListResponse } from 'onebusaway-sdk/resources/arrival-and-departure';
import type { StopsForLocationListResponse } from 'onebusaway-sdk/resources/stops-for-location';

export { cn } from 'cn';

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function debounce<Args extends unknown[], This>(
	func: (this: This, ...args: Args) => unknown,
	wait: number
): (this: This, ...args: Args) => void {
	let timeout: ReturnType<typeof setTimeout>;

	return function (this: This, ...args: Args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

/**
 * Removes the agency prefix from an ID string, returning only the numeric part.
 * Handles IDs in the format "AGENCY_ID" or "AGENCY_NUMBER" where the separator is an underscore.
 *
 * @param {string} idString - The full ID string (e.g., "MTS_41242", "1_41242")
 * @returns {string} The ID without the agency prefix (e.g., "41242")
 *
 * @example
 * removeAgencyPrefix("MTS_41242") // returns "41242"
 * removeAgencyPrefix("1_41242")   // returns "41242"
 * removeAgencyPrefix("41242")     // returns "41242" (no prefix to remove)
 */
export function removeAgencyPrefix(idString: string): string {
	if (!idString || typeof idString !== 'string') {
		return idString;
	}

	const underscoreIndex = idString.indexOf('_');
	if (underscoreIndex === -1) {
		return idString;
	}

	// Return everything after the first underscore
	return idString.substring(underscoreIndex + 1);
}

/**
 * Extracts the sorted route short names served by a stop from an
 * arrivals-and-departures API response.
 *
 * @param arrivalsAndDeparturesResponse - Response from the arrivals-and-departures-for-stop API
 * @param stop - Stop object with a routeIds array
 * @returns Lexicographically sorted route short names (falling back to the
 *   route id without its agency prefix), or null when the response has no route references
 *   or the stop has no routeIds array
 */
export function routeShortNamesForStop(
	arrivalsAndDeparturesResponse: ArrivalAndDepartureListResponse | null | undefined,
	stop: Pick<StopsForLocationListResponse.Data.List, 'routeIds'> | null | undefined
): string[] | null {
	const routes = arrivalsAndDeparturesResponse?.data?.references?.routes;
	if (!routes || !Array.isArray(stop?.routeIds)) {
		return null;
	}

	const stopRouteIds = new Set(stop.routeIds);

	return (
		routes
			.filter((r) => stopRouteIds.has(r.id))
			// the route id will always be present, so if the shortName is missing, fall back to the id without its agency prefix
			.map((r) => r.shortName || removeAgencyPrefix(r.id))
			.sort()
	);
}
