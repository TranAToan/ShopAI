import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import AIChatScreen from '../src/screens/AIChatScreen';
import { useAuthStore } from '../src/store/useAuthStore';
import { askShopAI } from '../src/services/geminiService';
import { AI_SUGGESTIONS } from '../src/constants/aiPrompt';

jest.mock('../src/services/geminiService', () => {
  const actual = jest.requireActual('../src/services/geminiService');
  return { ...actual, askShopAI: jest.fn() };
});
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));

let renderer: TestRenderer.ReactTestRenderer;
let now = 1000;
beforeEach(async () => {
  jest.clearAllMocks();
  now = 1000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  useAuthStore.setState({
    token: 'test-session',
    isUnlocked: true,
    isLoading: false,
    sessionId: 10,
    lockEpoch: 0,
  });
  await act(async () => {
    renderer = TestRenderer.create(
      <ThemeProvider>
        <AIChatScreen />
      </ThemeProvider>,
    );
  });
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  jest.restoreAllMocks();
});
function sendButton() {
  return renderer.root.findAll(node => node.props.title === 'Gửi')[0];
}
async function sendQuestion(question: string) {
  await act(async () =>
    renderer.root.findByType(TextInput).props.onChangeText(question),
  );
  await act(async () => sendButton().props.onPress());
}

test('double tap within one tick starts one request and clears the input immediately', async () => {
  let finish!: (value: string) => void;
  jest.mocked(askShopAI).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await act(async () =>
    renderer.root.findByType(TextInput).props.onChangeText('Laptop?'),
  );
  const send = sendButton().props.onPress;
  await act(async () => {
    send();
    send();
  });
  expect(askShopAI).toHaveBeenCalledTimes(1);
  expect(renderer.root.findByType(TextInput).props.value).toBe('');
  expect(sendButton().props.isLoading).toBe(true);
  await act(async () => finish('RAM 16GB.'));
  expect(sendButton().props.isLoading).toBe(false);
});

test('retry uses the original question/history and does not duplicate the user message', async () => {
  jest
    .mocked(askShopAI)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('reply');
  await sendQuestion('Laptop?');
  now += 2000;
  const retry = renderer.root.findAll(
    node => node.props.accessibilityLabel === 'Thử lại câu hỏi',
  )[0];
  await act(async () => retry.props.onPress());
  expect(askShopAI).toHaveBeenCalledTimes(2);
  expect(jest.mocked(askShopAI).mock.calls[0].slice(0, 2)).toEqual([
    'Laptop?',
    [],
  ]);
  expect(jest.mocked(askShopAI).mock.calls[1].slice(0, 2)).toEqual([
    'Laptop?',
    [],
  ]);
  const list = renderer.root.findAll(
    node =>
      Array.isArray(node.props.data) && node.props.data[0]?.id === 'greeting',
  )[0];
  expect(
    list.props.data.filter((message: { isBot: boolean }) => !message.isBot),
  ).toHaveLength(1);
});

test('suggestion sends without greeting in history and the next question gets only the completed pair', async () => {
  jest.mocked(askShopAI).mockResolvedValue('reply');
  const chip = renderer.root.findAll(
    node => node.props.accessibilityLabel === AI_SUGGESTIONS[0],
  )[0];
  await act(async () => chip.props.onPress());
  expect(askShopAI).toHaveBeenCalledWith(
    AI_SUGGESTIONS[0],
    [],
    expect.any(Object),
  );
  now += 2000;
  await sendQuestion('Cái đầu tiên?');
  expect(jest.mocked(askShopAI).mock.calls[1][1]).toEqual([
    { role: 'user', parts: [{ text: AI_SUGGESTIONS[0] }] },
    { role: 'model', parts: [{ text: 'reply' }] },
  ]);
});

test('retrying an older error after a newer answer still sends its own original question', async () => {
  jest
    .mocked(askShopAI)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('second answer')
    .mockResolvedValueOnce('first answer');
  await sendQuestion('Câu thứ nhất?');
  now += 2000;
  await sendQuestion('Câu thứ hai?');
  now += 2000;
  const retry = renderer.root.findAll(
    node => node.props.accessibilityLabel === 'Thử lại câu hỏi',
  )[0];
  await act(async () => retry.props.onPress());
  expect(jest.mocked(askShopAI).mock.calls[2].slice(0, 2)).toEqual([
    'Câu thứ nhất?',
    [],
  ]);
  const list = renderer.root.findAll(
    node =>
      Array.isArray(node.props.data) && node.props.data[0]?.id === 'greeting',
  )[0];
  expect(
    list.props.data.filter((message: { isBot: boolean }) => !message.isBot),
  ).toHaveLength(2);
});

test('unmount aborts a pending request instead of retaining a late reply', async () => {
  let finish!: (value: string) => void;
  jest.mocked(askShopAI).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await sendQuestion('Laptop?');
  const signal = jest.mocked(askShopAI).mock.calls[0][2]?.signal;
  await act(async () => renderer.unmount());
  expect(signal?.aborted).toBe(true);
  await act(async () => finish('late reply'));
});
