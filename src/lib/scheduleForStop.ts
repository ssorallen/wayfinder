import type { ScheduleForStopRetrieveResponse } from 'onebusaway-sdk/resources/schedule-for-stop';
import { error } from '@sveltejs/kit';
import { localTimeFormat, msToPlainTime, plainTimeToDate } from '$lib/dateTimeFormat.js';

type ScheduleStopTime =
	ScheduleForStopRetrieveResponse.Data.Entry.StopRouteSchedule.StopRouteDirectionSchedule.ScheduleStopTime & {
		/**
		 * The trip's own headsign, added by the schedule-for-stop API route
		 */
		tripHeadsign?: string;
	};

interface ScheduleTableStopTime {
	arrivalTime: string;
	destination: string;
	isShortLine: boolean;
}

/**
 * Fetches a stop's schedule for one service day through the app's API route.
 * The schedule page's server load uses this for today and the page uses it in
 * the browser for other dates, so both get the same agency filtering and trip
 * headsigns.
 *
 * @param {typeof globalThis.fetch} fetch
 * @param {string} stopId Full agency-prefixed OBA id
 * @param {string} serviceDay YYYY-MM-DD
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function fetchScheduleForStop(
	fetch: typeof globalThis.fetch,
	stopId: string,
	serviceDay: string,
	{ signal }: { signal?: AbortSignal } = {}
): Promise<ScheduleForStopRetrieveResponse.Data> {
	const response = await fetch(
		`/api/oba/schedule-for-stop/${encodeURIComponent(stopId)}?date=${serviceDay}`,
		{ signal }
	);
	if (!response.ok) {
		error(response.status, 'Unable to fetch schedule for stop.');
	}
	const { data }: ScheduleForStopRetrieveResponse = await response.json();
	return data;
}

/**
 * The date picker works in local midnight `Date`s; the API takes YYYY-MM-DD.
 * Converting through local date parts (not `toISOString()`, which is UTC)
 * keeps the calendar day the user picked.
 *
 * @param {string} serviceDay YYYY-MM-DD
 * @returns {Date}
 */
export function serviceDayToDate(serviceDay: string): Date {
	const { day, month, year } = Temporal.PlainDate.from(serviceDay);
	return new Date(year, month - 1, day);
}

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function dateToServiceDay(date: Date): string {
	return new Temporal.PlainDate(date.getFullYear(), date.getMonth() + 1, date.getDate()).toString();
}

/**
 * Arrange a direction's stop times for the schedule table and flag trips that
 * end before the direction's normal destination.
 *
 * Pass the region's timezone so times are grouped and shown as the agency
 * schedules them, not shifted to the viewer's (or the server's) timezone.
 *
 * `stopHeadsign` is not populated by OBA's schedule-for-stop endpoint. The
 * route handler adds the per-trip `tripHeadsign` from schedule-for-route.
 */
export function groupStopTimesByHour(
	stopTimes: ScheduleStopTime[],
	directionHeadsign: string,
	timeZone?: string
): Record<number, ScheduleTableStopTime[]> {
	const grouped: Record<number, ScheduleTableStopTime[]> = {};
	for (const stopTime of stopTimes) {
		const time = msToPlainTime(stopTime.arrivalTime, timeZone);
		if (!grouped[time.hour]) grouped[time.hour] = [];

		const destination = stopTime.tripHeadsign?.trim() || directionHeadsign;
		grouped[time.hour].push({
			arrivalTime: localTimeFormat.format(plainTimeToDate(time)),
			destination,
			isShortLine: destination !== directionHeadsign
		});
	}

	return grouped;
}
