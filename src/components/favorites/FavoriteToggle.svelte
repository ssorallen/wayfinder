<!--
	@component
	Star button that toggles a stop or route in the favorites store.
	Membership is derived from `$favorites` — no local isFavorite state.
-->
<script lang="ts">
	import { Star } from '@lucide/svelte';
	import { t } from 'svelte-i18n';
	import { favorites } from '$stores/favoritesStore';
	import { notifyFavoriteSaved, notifyFavoriteRemoved } from '$lib/favoriteNotifications';

	interface Props {
		/**
		 * Extra classes on the button (include h-/w- to override default size)
		 */
		class?: string;
		code?: string | null;
		description?: string | null;
		disabled?: boolean;
		direction?: string | null;
		/**
		 * Full agency-prefixed OBA id
		 */
		id: string;
		/**
		 * Required for type=stop
		 */
		lat?: number | null;
		/**
		 * Required for type=stop
		 */
		lon?: number | null;
		/**
		 * Stop name (required for type=stop)
		 */
		name?: string | null;
		routeType?: number | null;
		/**
		 * Required for type=route
		 */
		shortName?: string | null;
		type: 'stop' | 'route';
	}

	let {
		class: className = '',
		code = null,
		description = null,
		direction = null,
		disabled = false,
		id,
		lat = null,
		lon = null,
		name = null,
		routeType = null,
		shortName = null,
		type
	}: Props = $props();

	// Read membership from the writable array (not a Set derived store) so the
	// auto-subscription always invalidates when favorites.toggle() writes.
	let isFav = $derived($favorites.some((f) => f.type === type && f.id === id));

	let label = $derived(isFav ? $t('favorites.remove') : $t('favorites.add'));
	// Omit default size when the caller passes size classes — Tailwind cannot
	// override conflicting utilities by HTML class order.
	let sizeClass = $derived(className ? '' : 'h-10 w-12');

	function handleClick() {
		const result = favorites.toggle({
			type,
			id,
			name,
			code,
			direction,
			lat,
			lon,
			shortName,
			description,
			routeType
		});

		if (result === 'added') {
			notifyFavoriteSaved();
		} else if (result === 'removed') {
			notifyFavoriteRemoved();
		}
	}
</script>

<button
	type="button"
	onclick={handleClick}
	aria-pressed={isFav}
	aria-label={label}
	title={label}
	{disabled}
	class="group flex {sizeClass} flex-none items-center justify-center rounded-xl border border-gray-300 text-black enabled:hover:bg-gray-100 disabled:border-gray-200 disabled:text-gray-300 dark:border-gray-600 dark:text-white dark:enabled:hover:bg-gray-700 dark:disabled:border-gray-700 dark:disabled:text-gray-600 {className}"
>
	<Star
		class="h-4 w-4 {isFav
			? 'text-black group-disabled:text-gray-400 dark:text-white dark:group-disabled:text-gray-500'
			: ''}"
		fill={isFav ? 'currentColor' : 'none'}
	/>
</button>
