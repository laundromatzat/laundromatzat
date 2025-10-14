import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import ChatAssistant from '../components/ChatAssistant';
import { Project, ProjectType } from '../types';

const createChatSessionMock = vi.hoisted(() => vi.fn());

vi.mock('../services/geminiClient', () => ({
  createChatSession: createChatSessionMock,
}));

vi.mock('../utils/projectSearch', () => ({
  searchProjects: vi.fn(),
}));

const mockProjects: Project[] = [
  {
    id: 'mock-project',
    type: ProjectType.Video,
    title: 'Mock Project',
    description: 'A mocked video project.',
    imageUrl: '/mock.png',
    date: '01/2024',
    year: 2024,
  },
];

describe('ChatAssistant', () => {
  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  beforeEach(() => {
    createChatSessionMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('pipes assistant project responses through to the UI and onSearch callback', async () => {
    const responsePayload = [
      '```json',
      JSON.stringify({ projects: mockProjects }),
      '```',
    ].join('\n');
    const sendMessageStream = vi.fn(async function* (message: string) {
      expect(message).toBe('Show me projects');
      yield { text: responsePayload };
    });

    createChatSessionMock.mockResolvedValue({
      sendMessageStream,
      sendMessage: vi.fn(() => Promise.resolve(responsePayload)),
    });

    const onSearch = vi.fn();
    render(<ChatAssistant onSearch={onSearch} />);

    fireEvent.click(screen.getByRole('button', { name: /open chat assistant/i }));

    await waitFor(() => {
      expect(createChatSessionMock).toHaveBeenCalledTimes(1);
    });

    await screen.findByText(/how can i help you explore this creative portfolio/i);

    const input = screen.getByPlaceholderText(/ask about the projects/i);
    fireEvent.change(input, { target: { value: 'Show me projects' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(sendMessageStream).toHaveBeenCalledWith('Show me projects');
    });

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith(mockProjects);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/i've updated the grid with your search results\./i)
      ).toBeTruthy();
    });
  });
});
