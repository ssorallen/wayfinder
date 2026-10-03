import type { ScheduleForStopRetrieveResponse } from 'onebusaway-sdk/resources/schedule-for-stop';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { getTodayDateForInput } from '$lib/dateTimeInput';
import { handleOBAResponse } from '$lib/obaSdk';
import { getRouteSchedules } from '$lib/scheduleForStop';
import { getScheduleForStop } from '$lib/server/obaScheduleForStop';

export async function load({ params }) {
	// Always today in the region's timezone. Other dates are only picked in the
	// browser and never reach the URL, so a fresh load or refresh shows today.
	const serviceDay = getTodayDateForInput(env.PUBLIC_OBA_TIMEZONE);
	const response = await getScheduleForStop(params.stopID, serviceDay);
	// OBA answers for a stop that doesn't exist with an empty response (or code 404).
	if (!response || response.code === 404) {
		error(404, 'Stop not found.');
	}
	const { data: scheduleForStop }: ScheduleForStopRetrieveResponse = await handleOBAResponse(
		response,
		'stop-for-schedule'
	).json();
	const { stopId } = scheduleForStop.entry;

	// OBA includes the stop in the references; the page can't render without it.
	const stop = scheduleForStop.references.stops.find((stop) => stop.id === stopId);
	if (!stop) {
		error(500, 'Unable to fetch stop.');
	}

	return {
		schedules: getRouteSchedules(scheduleForStop, env.PUBLIC_OBA_TIMEZONE || undefined),
		serviceDay,
		stop,
		stopId
	};
}
