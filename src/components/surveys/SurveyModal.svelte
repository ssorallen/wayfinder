<script lang="ts">
	import { Button } from '$components/ui/button';
	import * as Dialog  from '$components/ui/dialog';
	import SurveyQuestion from './SurveyQuestion.svelte';
	import type { SurveyQuestion as TSurveyQuestion } from '$lib/types';
	import {
		submitHeroQuestion as submitHeroQuestionUtil,
		updateSurveyResponse as updateSurveyResponseUtil,
		skipSurvey,
		submitSurvey
	} from '$lib/Surveys/surveyUtils';
	import { showSurveyModal, surveyStore } from '$stores/surveyStore';
	import { getUserId } from '$lib/utils/user';
	import SurveySubmitted from './SurveySubmitted.svelte';

	let { stop = $bindable(null), skipHeroQuestion, surveyPublicId } = $props();

	let userAnswers = $state<string[]>([]);
	let heroQuestionAnswered = $state(false);
	let heroQuestion = $state<TSurveyQuestion | null>(null);
	let remainingQuestions = $state<TSurveyQuestion[]>([]);
	let surveyPublicIdentifier = $state(null);
	let surveySubmitted = $state(false);
	let errors = $state<boolean[]>([]);

	let currentSurvey = $state($surveyStore);

	if (currentSurvey && currentSurvey.questions) {
		heroQuestion = currentSurvey.questions[0];
		remainingQuestions = currentSurvey.questions.slice(1);
	}

	interface SurveyQuestionResponse {
		answer: string | null;
		question_id: number;
		question_label: string;
		question_type: string;
	}

	let surveyResponse = {
		survey_id: currentSurvey?.id,
		user_identifier: getUserId(),
		stop_identifier: stop?.id ?? null,
		stop_latitude: stop?.lat ?? null,
		stop_longitude: stop?.lon ?? null,
		responses: [] as SurveyQuestionResponse[]
	};

	function handleInputChange(event: InputEvent, question: TSurveyQuestion, index: number) {
		const type = question.content.type;

		if (type === 'text' || type === 'radio') {
			userAnswers[index] = event.target.value;
		} else if (type === 'checkbox') {
			const value = event.target.value;
			if (event.target.checked) {
				userAnswers[index] = [...(userAnswers[index] || []), value];
			} else {
				userAnswers[index] = (userAnswers[index] || []).filter((option) => option !== value);
				if (userAnswers[index].length === 0) {
					delete userAnswers[index];
				}
			}
		}

		surveyResponse.responses[index] = {
			question_id: question.id,
			question_label: question.content.label_text,
			question_type: question.content.type,
			answer: userAnswers[index] || null
		};
	}

	function validateAnswers() {
		let valid = true;
		errors = new Array(currentSurvey.questions.length).fill(false);

		if (!heroQuestionAnswered && !skipHeroQuestion) {
			if (heroQuestion.required && (!userAnswers[0] || userAnswers[0].length === 0)) {
				errors[0] = true;
				valid = false;
			}
		} else {
			remainingQuestions.forEach((question, index) => {
				const answer = userAnswers[index + 1];
				if (question.required && (!answer || (Array.isArray(answer) && answer.length === 0))) {
					errors[index + 1] = true;
					valid = false;
				}
			});
		}

		return valid;
	}

	async function submitHeroQuestion() {
		if (!validateAnswers()) return;

		try {
			surveyPublicIdentifier = await submitHeroQuestionUtil(surveyResponse);
			heroQuestionAnswered = true;
			submitSurvey(currentSurvey, false);

			if (remainingQuestions.length === 0) {
				surveySubmitted = true;
			}
		} catch (error) {
			console.error('Error submitting hero question:', error);
		}
	}

	async function updateSurveyResponse() {
		if (surveyPublicId) surveyPublicIdentifier = surveyPublicId;
		updateSurveyResponseUtil(surveyPublicIdentifier, surveyResponse);
	}

	function handleSubmit() {
		if (!validateAnswers()) return;

		updateSurveyResponse();
		surveySubmitted = true;
		submitSurvey(currentSurvey, true);
	}
</script>

<Dialog.Root bind:open={$showSurveyModal}>
	{#if currentSurvey}
		<Dialog.Content class="md:max-w-5xl rounded-2xl">
			<Dialog.Title>{currentSurvey.name}</Dialog.Title>
			{#if surveySubmitted}
				<SurveySubmitted />
			{:else}
				<div class="max-h-[60vh] overflow-y-auto p-2">
					{#if !heroQuestionAnswered && !skipHeroQuestion}
						<SurveyQuestion
							question={heroQuestion}
							index={0}
							value={userAnswers[0]}
							onInputChange={(e: InputEvent) => handleInputChange(e, heroQuestion, 0)}
							required={heroQuestion?.required}
							error={errors[0]}
						/>
					{:else}
						<div class="space-y-8">
							{#each remainingQuestions as question, index}
								<SurveyQuestion
									{question}
									index={index + 1}
									value={userAnswers[index + 1]}
									onInputChange={(e: InputEvent) => handleInputChange(e, question, index + 1)}
									required={question.required}
									error={errors[index + 1]}
								/>
							{/each}
						</div>
					{/if}
				</div>

				<Dialog.Footer>
					{#if !heroQuestionAnswered && !skipHeroQuestion}
						<Button
							onclick={() => skipSurvey(currentSurvey)}
							size="lg"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							onclick={submitHeroQuestion}
							size="lg"
						>
							{remainingQuestions.length === 0 ? 'Submit' : 'Next'}
						</Button>
					{:else if remainingQuestions.length > 0}
						<Button
							onclick={() => skipSurvey(currentSurvey)}
							size="lg"
						>
							Skip
						</Button>
						<Button
							onclick={handleSubmit}
							size="lg"
						>
							Submit
						</Button>
					{/if}
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	{/if}
</Dialog.Root>
