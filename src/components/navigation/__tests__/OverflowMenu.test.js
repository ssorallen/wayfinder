import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, describe } from 'vitest';
import OverflowMenu from '../OverflowMenu.svelte';

describe('OverflowMenu', () => {
	const mockLinks = [
		{ key: 'About', value: '/about' },
		{ key: 'Contact', value: '/contact' },
		{ key: 'GitHub', value: 'https://github.com/OneBusAway' }
	];

	test('renders trigger button in collapsed state initially', () => {
		render(OverflowMenu, { links: mockLinks });

		const button = screen.getByRole('button', { name: 'More navigation options' });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(button).toHaveAttribute('aria-haspopup', 'menu');

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	test('opens popover and displays all links when trigger button is clicked', async () => {
		const user = userEvent.setup();
		render(OverflowMenu, { links: mockLinks });

		const button = screen.getByRole('button', { name: 'More navigation options' });
		await user.click(button);

		for (const { key, value } of mockLinks) {
			const link = await screen.findByRole('link', { name: key });
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute('href', value);
		}
		expect(button).toHaveAttribute('aria-expanded', 'true');
	});

	test('renders empty menu when no links are provided', async () => {
		const user = userEvent.setup();
		render(OverflowMenu, { links: [] });

		const button = screen.getByRole('button', { name: 'More navigation options' });
		await user.click(button);

		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	test('closes popover when a link is clicked', async () => {
		const user = userEvent.setup();
		render(OverflowMenu, { links: mockLinks });

		const button = screen.getByRole('button', { name: 'More navigation options' });
		await user.click(button);

		const firstLink = await screen.findByRole('link', { name: 'About' });
		firstLink.addEventListener('click', (e) => e.preventDefault(), { once: true });
		await user.click(firstLink);

		await waitFor(() => {
			expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
		});
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	test('closes popover when clicking outside', async () => {
		const user = userEvent.setup();
		render(OverflowMenu, { links: mockLinks });

		const button = screen.getByRole('button', { name: 'More navigation options' });
		await user.click(button);

		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(await screen.findByRole('link', { name: 'About' })).toBeInTheDocument();

		await user.click(document.body);

		await waitFor(() => {
			expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
		});
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	test('updates rendered links when links prop changes', async () => {
		const user = userEvent.setup();
		const { rerender } = render(OverflowMenu, { links: mockLinks });

		const button = screen.getByRole('button', { name: 'More navigation options' });
		await user.click(button);

		expect(await screen.findByRole('link', { name: 'About' })).toBeInTheDocument();

		await rerender({ links: [{ key: 'Home', value: '/' }] });

		expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
	});
});
