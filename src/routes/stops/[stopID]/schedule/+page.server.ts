import { env } from '$env/dynamic/public';
import { getTodayDateForInput } from '$lib/dateTimeInput';
import { fetchScheduleForStop, getRouteSchedules } from '$lib/scheduleForStop';

export async function load({ fetch, params }) {
	// Always today in the region's timezone. Other dates are only picked in the
	// browser and never reach the URL, so a fresh load or refresh shows today.
	const serviceDay = getTodayDateForInput(env.PUBLIC_OBA_TIMEZONE);
	const scheduleForStop = await fetchScheduleForStop(fetch, params.stopID, serviceDay);
	const { stopId } = scheduleForStop.entry;

	// Only what the page renders is sent, not the raw schedule.
	return {
		schedules: getRouteSchedules(scheduleForStop, env.PUBLIC_OBA_TIMEZONE || undefined),
		serviceDay,
		stop: scheduleForStop.references.stops.find((stop) => stop.id === stopId),
		stopId
	};
}
