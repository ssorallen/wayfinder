import oba from '$lib/obaSdk';
import { getTripHeadsigns } from '$lib/server/tripHeadsigns.js';
import { getAgencyFilter, filterByRouteId } from '$lib/agencyFilter.js';

/**
 * A stop's schedule for one service day, limited to the configured agencies,
 * with each stop time's own trip headsign added. The schedule-for-stop API
 * route and the schedule page's server load both use this.
 *
 * @param {string} stopId - Full agency-prefixed OBA id
 * @param {string} date - YYYY-MM-DD service day. The caller resolves an undated
 *   request in the region's timezone; an undated stop response's entry.date is
 *   wall-clock time, not a service-day key.
 * @returns {Promise<import('onebusaway-sdk/resources/schedule-for-stop').ScheduleForStopRetrieveResponse>}
 */
export async function getScheduleForStop(stopId, date) {
	const response = await oba.scheduleForStop.retrieve(stopId, { date });

	if (response.data?.entry?.stopRouteSchedules) {
		const routeSchedules = filterByRouteId(
			response.data.entry.stopRouteSchedules,
			getAgencyFilter()
		);
		response.data.entry.stopRouteSchedules = routeSchedules;
		await addTripHeadsigns(routeSchedules, date);
	}

	return response;
}

async function addTripHeadsigns(routeSchedules, date) {
	await Promise.all(
		routeSchedules.map(async (routeSchedule) => {
			const directions = routeSchedule?.stopRouteDirectionSchedules;
			if (!routeSchedule?.routeId || !Array.isArray(directions)) return;
			const stopTimesByDirection = directions.map((direction) =>
				Array.isArray(direction?.scheduleStopTimes)
					? direction.scheduleStopTimes.filter((stopTime) => stopTime?.tripId)
					: []
			);
			if (
				!stopTimesByDirection.some((times) => new Set(times.map((time) => time.tripId)).size > 1)
			) {
				return;
			}

			try {
				const tripHeadsigns = await getTripHeadsigns(routeSchedule.routeId, date);
				for (const stopTime of stopTimesByDirection.flat()) {
					const tripHeadsign = tripHeadsigns.get(stopTime.tripId);
					if (tripHeadsign) stopTime.tripHeadsign = tripHeadsign;
				}
			} catch (error) {
				console.error(`Unable to load trip headsigns for route ${routeSchedule.routeId}:`, error);
			}
		})
	);
}
