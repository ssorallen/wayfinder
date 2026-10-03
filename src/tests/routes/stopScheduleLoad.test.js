import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_OBA_TIMEZONE: 'America/Los_Angeles' }
}));

import { load } from '../../routes/stops/[stopID]/schedule/+page.server';

describe('/stops/[stopID]/schedule load', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	test("loads today's schedule in the region's timezone", async () => {
		// 8pm on Oct 2 in Los Angeles, when it's already Oct 3 in UTC
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-10-03T03:00:00Z'));
		const scheduleForStop = {
			entry: { stopId: '1_75403', stopRouteSchedules: [] },
			references: { routes: [], stops: [] }
		};
		const fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: scheduleForStop })
		});

		const result = await load({ fetch, params: { stopID: '1_75403' } });

		expect(fetch.mock.calls[0][0]).toBe('/api/oba/schedule-for-stop/1_75403?date=2026-10-02');
		expect(result).toEqual({ scheduleForStop, serviceDay: '2026-10-02' });
	});

	test("fails with the API's status when the schedule can't be loaded", async () => {
		const fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 });

		await expect(load({ fetch, params: { stopID: '1_75403' } })).rejects.toMatchObject({
			status: 502
		});
	});
});
