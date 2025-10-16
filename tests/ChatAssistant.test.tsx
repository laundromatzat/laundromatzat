import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import ChatAssistant from '../components/ChatAssistant';
import { Project, ProjectType } from '../types';

const createChatSessionMock = vi.hoisted(() => vi.fn());
const analyticsMocks = vi.hoisted(() => ({
  trackChatOpen: vi.fn(),
  trackChatClose: vi.fn(),
  trackChatReset: vi.fn(),
  trackChatError: vi.fn(),
  trackFilterApplied: vi.fn(),
  trackReset: vi.fn(),
  trackChatQuery: vi.fn(),
  trackChatClear: vi.fn(),
}));

const searchProjectsMock = vi.hoisted(() => vi.fn());

vi.mock('../services/geminiClient', () => ({
  createChatSession: createChatSessionMock,
}));

vi.mock('../utils/projectSearch', () => ({
  searchProjects: searchProjectsMock,
}));

vi.mock('../lib/analytics', () => ({
  analytics: { track: vi.fn() },
  trackChatOpen: analyticsMocks.trackChatOpen,
  trackChatClose: analyticsMocks.trackChatClose,
  trackChatReset: analyticsMocks.trackChatReset,
  trackChatError: analyticsMocks.trackChatError,
  trackFilterApplied: analyticsMocks.trackFilterApplied,
  trackReset: analyticsMocks.trackReset,
  trackChatQuery: analyticsMocks.trackChatQuery,
  trackChatClear: analyticsMocks.trackChatClear,
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
  const clickOpenButton = () => {
    const buttons = screen.getAllByRole('button', { name: /open chat assistant/i });
    fireEvent.click(buttons[buttons.length - 1]);
  };

  const getActivePanel = () => {
    const panels = screen.getAllByTestId('chat-assistant-panel');
    return panels[panels.length - 1];
  };

  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  beforeEach(() => {
    createChatSessionMock.mockReset();
    searchProjectsMock.mockReset();
    Object.values(analyticsMocks).forEach(mock => mock.mockReset());
    window.localStorage.clear();
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

    clickOpenButton();

    await waitFor(() => {
      expect(createChatSessionMock).toHaveBeenCalledTimes(1);
    });

    const panel = getActivePanel();

    await within(panel).findByText(/how can i help you explore this creative portfolio/i);

    const input = within(panel).getByPlaceholderText(/ask about the projects/i);
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

  it('persists messages across close and reopen toggles', async () => {
    const sendMessageStream = vi.fn(async function* () {
      yield { text: 'Persisted response' };
    });

    createChatSessionMock.mockResolvedValue({
      sendMessageStream,
      sendMessage: vi.fn(),
    });

    render(<ChatAssistant onSearch={vi.fn()} />);

    clickOpenButton();

    await waitFor(() => {
      expect(createChatSessionMock).toHaveBeenCalledTimes(1);
    });

    const panel = getActivePanel();

    await within(panel).findByText(/how can i help you explore this creative portfolio/i);

    const input = within(panel).getByPlaceholderText(/ask about the projects/i);
    fireEvent.change(input, { target: { value: 'Hello?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(sendMessageStream).toHaveBeenCalledWith('Hello?');
    });

    await within(panel).findByText('Persisted response');

    fireEvent.click(within(panel).getByRole('button', { name: /close chat assistant/i }));

    clickOpenButton();

    const reopenedPanel = getActivePanel();

    await waitFor(() => {
      expect(createChatSessionMock).toHaveBeenCalledTimes(2);
    });

    await within(reopenedPanel).findByText('Persisted response');

    const stored = window.localStorage.getItem('chat-assistant/messages') ?? '';
    expect(stored).toContain('Persisted response');
  });

  it('clears chat history and analytics when the action is used', async () => {
    const sendMessageStream = vi.fn(async function* () {
      yield { text: 'Message to clear' };
    });

    createChatSessionMock.mockResolvedValue({
      sendMessageStream,
      sendMessage: vi.fn(),
    });

    render(<ChatAssistant onSearch={vi.fn()} />);

    clickOpenButton();

    const panel = getActivePanel();

    await within(panel).findByText(/how can i help you explore this creative portfolio/i);

    const input = within(panel).getByPlaceholderText(/ask about the projects/i);
    fireEvent.change(input, { target: { value: 'Clear me' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await within(panel).findByText('Message to clear');

    fireEvent.click(within(panel).getByRole('button', { name: /clear chat/i }));

    await waitFor(() => {
      expect(analyticsMocks.trackChatClear).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(createChatSessionMock).toHaveBeenCalledTimes(2);
    });

    const refreshedPanel = getActivePanel();

    await within(refreshedPanel).findByText(/how can i help you explore this creative portfolio/i);

    expect(within(refreshedPanel).queryByText('Message to clear')).toBeNull();

    const stored = window.localStorage.getItem('chat-assistant/messages') ?? '';
    expect(stored).toContain('initial');
    expect(stored).not.toContain('Message to clear');
  });
});
