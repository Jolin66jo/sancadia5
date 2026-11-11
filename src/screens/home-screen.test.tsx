import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HomeScreen from '@/screens/HomeScreen';

vi.mock('@/hooks/usePublishedContent', () => ({
  usePublishedContent: () => ({
    content: [
      {
        id: 'challenge-1',
        content_type: 'daily_challenge',
        title: 'A very long challenge title that should wrap cleanly instead of overflowing the card',
        description: 'A very long challenge description that should also wrap instead of escaping the card boundary.',
      },
    ],
    loading: false,
  }),
}));

describe('HomeScreen', () => {
  it('keeps the main action near the top of the viewport and wraps long event text', () => {
    const { container } = render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('gap-5');
    expect(root.className).not.toContain('justify-between');

    expect(
      screen.getByRole('heading', {
        name: 'A very long challenge title that should wrap cleanly instead of overflowing the card',
      }),
    ).toBeTruthy();
    expect(screen.getByText(/A very long challenge description/).className).toContain('break-words');
  });
});
