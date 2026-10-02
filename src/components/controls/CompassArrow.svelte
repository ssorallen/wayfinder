<!--
    This Svelte component renders an arrow icon that rotates based on the provided `stopDirection` prop.
-->

<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	interface Props {
		/**
		 * The direction in which the arrow should point.
		 * Possible values are 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'.
		 * If the value is not one of these, the arrow will be hidden.
		 */
		stopDirection?: string;
	}

	let { stopDirection = '' }: Props = $props();

	// Rotation classes keyed by compass direction. `rotate-135` and `rotate-225`
	// are registered via `theme.extend.rotate` in tailwind.config.js.
	const ROTATION_CLASS_BY_DIRECTION: Record<string, string> = {
		N: '-rotate-90',
		NE: '-rotate-45',
		E: 'rotate-0',
		SE: 'rotate-45',
		S: 'rotate-90',
		SW: 'rotate-135',
		W: 'rotate-180',
		NW: 'rotate-225'
	};

	// Wrap the icon in a span we control so the rotation class updates
	// reactively when `stopDirection` changes.
	let rotationClass = $derived(ROTATION_CLASS_BY_DIRECTION[stopDirection] ?? 'hidden');
</script>

<span class="inline-block {rotationClass}" data-testid="compass-arrow">
	<ArrowRight class="h-4 w-4" />
</span>
