import { writable } from 'svelte/store';
import type { Survey } from '$lib/types';

export const showSurveyModal = writable(false);
export const surveyStore = writable<Survey | null>(null);

const initial = {};

export const answeredSurveys = writable(initial);

export function markSurveyAnswered(surveyId: Survey['id']) {
	answeredSurveys.update((map) => {
		localStorage.setItem(`survey_${surveyId}_answered`, 'true');
		return { ...map, [surveyId]: true };
	});
}
