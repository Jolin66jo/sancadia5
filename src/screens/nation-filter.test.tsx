import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';
import GamesScreen from '@/screens/GamesScreen';
import HomeScreen from '@/screens/HomeScreen';
import SettingsScreen from '@/screens/SettingsScreen';

describe('nation game filter', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the selected nation games from the Sancadia Shire links', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsProvider>
          <StatsProvider>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/games" element={<GamesScreen />} />
            </Routes>
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('combobox', { name: 'Nation' })).toBeNull();
    await user.click(screen.getByRole('link', { name: 'Browse Portugal games' }));
    expect(window.localStorage.getItem('classic-games-arcade:settings')).toContain(
      '"nation":"portugal"',
    );

    expect(screen.getByRole('heading', { name: 'Enjoy' })).toBeTruthy();
    expect(screen.queryByLabelText('Game group')).toBeNull();
    expect(screen.queryByText(/Traditional Chinese|games from all nations/i)).toBeNull();
    expect(screen.getByText('Connect 4')).toBeTruthy();
    expect(screen.getAllByRole('img', { name: 'Portugal flag' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Noughts and Crosses')).toBeNull();
    expect(screen.queryByText(/Games from/)).toBeNull();
  });

  it('resets the saved nation to all with Reset all data', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'classic-games-arcade:settings',
      JSON.stringify({ version: 7, nation: 'india' }),
    );
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsProvider>
          <StatsProvider>
            <Routes>
              <Route path="/settings" element={<SettingsScreen />} />
            </Routes>
          </StatsProvider>
        </SettingsProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByText('Performance & Data'));
    await user.click(screen.getByRole('button', { name: 'Reset all data' }));
    await user.click(screen.getByRole('button', { name: /^Reset$/ }));

    expect(
      screen.getByRole('link', { name: 'Browse games from all nations' }).getAttribute('aria-current'),
    ).toBe('page');
  });
});
