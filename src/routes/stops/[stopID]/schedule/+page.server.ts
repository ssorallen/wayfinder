import { env } from '$env/dynamic/public';
import { getTodayDateForInput } from '$lib/dateTimeInput';
import { fetchScheduleForStop } from '$lib/scheduleForStop';

export async function load({ fetch, params }) {
	// Always today in the region's timezone. Other dates are only picked in the
	// browser and never reach the URL, so a fresh load or refresh shows today.
	const serviceDay = getTodayDateForInput(env.PUBLIC_OBA_TIMEZONE);

	return {
		scheduleForStop: await fetchScheduleForStop(fetch, params.stopID, serviceDay),
		serviceDay
	};
}
