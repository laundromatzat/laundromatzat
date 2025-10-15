import React, { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { MemoryRouter, Route, Routes, useLocation, type Location } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '../pages/HomePage';

type RenderOptions = {
  initialEntries?: string[];
  onLocationChange?: (location: Location) => void;
};

const LocationObserver = ({ onChange }: { onChange: (location: Location) => void }): React.ReactNode => {
  const location = useLocation();

  useEffect(() => {
    onChange(location);
  }, [location, onChange]);

  return null;
};

const renderHomePage = ({ initialEntries, onLocationChange }: RenderOptions = {}) => {
  const handleLocationChange = onLocationChange ?? (() => {});

  return render(
    <MemoryRouter initialEntries={initialEntries ?? ['/']}>
      <Routes>
        <Route
          path="/"
          element={(
            <HelmetProvider>
              <LocationObserver onChange={handleLocationChange} />
              <HomePage />
            </HelmetProvider>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
};

describe('HomePage filters & URL state', () => {
  it('updates the query string when toggling filters', () => {
    vi.useFakeTimers();
    try {
      const observedLocations: Location[] = [];

      renderHomePage({
        onLocationChange: location => {
          observedLocations.push(location);
        },
      });

      const videoButtons = screen.getAllByRole('button', { name: /^video$/i });
      const videoButton = videoButtons[videoButtons.length - 1];

      fireEvent.click(videoButton);
      act(() => {
        vi.advanceTimersByTime(250);
      });

      const afterFirstToggle = observedLocations[observedLocations.length - 1];
      expect(afterFirstToggle?.search).toBe('?type=video');

      fireEvent.click(videoButton);
      act(() => {
        vi.advanceTimersByTime(250);
      });

      const afterSecondToggle = observedLocations[observedLocations.length - 1];
      expect(afterSecondToggle?.search).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores filter selections from the query string on load', () => {
    const observedLocations: Location[] = [];

    renderHomePage({
      initialEntries: ['/?type=video'],
      onLocationChange: location => {
        observedLocations.push(location);
      },
    });

    const videoButtons = screen.getAllByRole('button', { name: /^video$/i });
    const videoButton = videoButtons[videoButtons.length - 1];
    expect(videoButton.className).toContain('bg-brand-accent/10');

    const heading = screen.getByRole('heading', { name: /filtered results/i });
    expect(heading.textContent).toMatch(/filtered results/i);
    const latestLocation = observedLocations[observedLocations.length - 1];
    expect(latestLocation?.search).toBe('?type=video');
  });
});
