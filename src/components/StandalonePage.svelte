<!-- eslint-disable-next-line svelte/block-lang -->
<script>
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();
</script>

<div class="mx-auto h-full max-w-5xl overflow-y-auto p-4">
	{@render children?.()}
</div>
