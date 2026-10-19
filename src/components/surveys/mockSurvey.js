// @ts-check

/**
 * Dev-only fixture for iterating on the survey modal without a surveys feed.
 * loadSurveys opens the modal with this survey when the dev server is running
 * and the URL has `?mockSurvey`; submissions short-circuit instead of hitting
 * the API, so the full hero → remaining questions → submitted flow works.
 */

export const MOCK_SURVEY_PARAM = 'mockSurvey';

/**
 * True when the dev server is running and the current URL opts in.
 *
 * @returns {boolean}
 */
export function shouldMockSurvey() {
	if (!import.meta.env.DEV || typeof window === 'undefined') return false;
	return new URLSearchParams(window.location.search).has(MOCK_SURVEY_PARAM);
}

export const MOCK_SURVEY_RESPONSE_ID = 'mock_survey_response';

/** @type {import('$lib/types').Survey} */
export const mockSurvey = {
	allows_multiple_responses: true,
	always_visible: true,
	created_at: '2026-01-01T00:00:00Z',
	end_date: null,
	id: -1,
	name: 'Help us improve your ride',
	questions: [
		{
			// Hero question: shown alone first, then submitted before the rest.
			content: {
				label_text: 'How satisfied are you with your trip today?',
				options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
				type: 'radio'
			},
			id: 1,
			position: 0,
			required: true
		},
		{
			content: { label_text: 'A few more questions', type: 'label' },
			id: 2,
			position: 1,
			required: false
		},
		{
			content: {
				label_text: 'Which of these would most improve your experience?',
				options: [
					'More frequent service',
					'More reliable arrival times',
					'Cleaner vehicles',
					'Better shelters at stops',
					'Clearer service alerts'
				],
				type: 'checkbox'
			},
			id: 3,
			position: 2,
			required: true
		},
		{
			content: {
				label_text: 'How often do you ride?',
				options: ['Daily', 'Weekly', 'Rarely'],
				type: 'radio'
			},
			id: 4,
			position: 3,
			required: false
		},
		{
			content: { label_text: 'Anything else you would like to tell us?', type: 'text' },
			id: 5,
			position: 4,
			required: false
		},
		{
			content: {
				embedded_data_fields: [],
				label_text: 'Take our longer rider survey',
				survey_provider: 'Example Forms',
				type: 'external_survey',
				url: 'https://example.com/survey'
			},
			id: 6,
			position: 5,
			required: false
		}
	],
	show_on_map: true,
	show_on_stops: true,
	start_date: null,
	study: { description: 'Mock study for local development.', id: -1, name: 'Mock study' },
	updated_at: '2026-01-01T00:00:00Z',
	visible_route_list: null,
	visible_stop_list: null
};
