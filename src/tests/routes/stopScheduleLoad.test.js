import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_OBA_TIMEZONE: 'America/Los_Angeles' }
}));

import { load } from '../../routes/stops/[stopID]/schedule/+page.server';

const stop = { id: '1_75403', name: 'Pine St & 3rd Ave' };

function scheduleResponse(stopRouteSchedules = []) {
	const data = {
		entry: { stopId: stop.id, stopRouteSchedules },
		references: { routes: [{ id: '1_100', shortName: '8' }], stops: [stop] }
	};
	return { ok: true, json: async () => ({ data }) };
}

describe('/stops/[stopID]/schedule load', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	test("loads today's schedule in the region's timezone", async () => {
		// 8pm on Oct 2 in Los Angeles, when it's already Oct 3 in UTC
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-10-03T03:00:00Z'));
		const fetch = vi.fn().mockResolvedValue(scheduleResponse());

		const result = await load({ fetch, params: { stopID: stop.id } });

		expect(fetch.mock.calls[0][0]).toBe('/api/oba/schedule-for-stop/1_75403?date=2026-10-02');
		expect(result).toEqual({ schedules: [], serviceDay: '2026-10-02', stop, stopId: stop.id });
	});

	test("sends the schedules grouped in the region's timezone, ready to render", async () => {
		const fetch = vi.fn().mockResolvedValue(
			scheduleResponse([
				{
					routeId: '1_100',
					stopRouteDirectionSchedules: [
						{
							// 8:05am in Los Angeles is 3:05pm UTC, the test runner's timezone.
							scheduleStopTimes: [
								{ arrivalTime: new Date('2026-10-02T15:05:00Z').getTime(), tripId: '1_trip' }
							],
							tripHeadsign: 'Capitol Hill'
						}
					]
				}
			])
		);

		const { schedules } = await load({ fetch, params: { stopID: stop.id } });

		expect(schedules).toEqual([
			{
				stopTimes: {
					8: [{ arrivalTime: '8:05 AM', destination: 'Capitol Hill', isShortLine: false }]
				},
				tripHeadsign: '8 - Capitol Hill'
			}
		]);
	});

	test("fails with the API's status when the schedule can't be loaded", async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 });

		await expect(load({ fetch, params: { stopID: '1_75403' } })).rejects.toMatchObject({
			status: 502
		});
	});
});
