import axios from 'axios';
import axiosClient from '../src/api/axiosClient';
import {
  askShopAI,
  completedHistory,
  GeminiError,
  toFriendlyError,
} from '../src/services/geminiService';
jest.mock('../src/api/axiosClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
test('chat sends message once and complete history to Nest without a Google key', async () => {
  jest
    .mocked(axiosClient.post)
    .mockResolvedValue({ data: { reply: 'Tư vấn từ server' } });
  await expect(
    askShopAI('Câu mới', [
      { role: 'user', parts: [{ text: 'Câu cũ' }] },
      { role: 'model', parts: [{ text: 'Trả lời cũ' }] },
    ]),
  ).resolves.toBe('Tư vấn từ server');
  expect(axiosClient.post).toHaveBeenCalledWith(
    '/api/ai/chat',
    {
      message: 'Câu mới',
      history: [
        { role: 'user', text: 'Câu cũ' },
        { role: 'model', text: 'Trả lời cũ' },
      ],
    },
    expect.objectContaining({ timeout: 30000 }),
  );
});
test('history excludes incomplete turns and retains ten pairs', () => {
  const history = Array.from({ length: 24 }, (_, i) => ({
    role: i % 2 ? ('model' as const) : ('user' as const),
    parts: [{ text: String(i) }],
  }));
  expect(completedHistory(history)).toHaveLength(20);
  expect(
    completedHistory([{ role: 'user', parts: [{ text: 'unfinished' }] }]),
  ).toEqual([]);
});
test.each(['', 'x'.repeat(501)])(
  'invalid input does not send request',
  async text => {
    await expect(askShopAI(text)).rejects.toMatchObject({ code: 'input' });
    expect(axiosClient.post).not.toHaveBeenCalled();
  },
);
test('already cancelled request is never sent', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    askShopAI('test', [], { signal: controller.signal }),
  ).rejects.toMatchObject({ code: 'cancelled' });
  expect(axiosClient.post).not.toHaveBeenCalled();
});
test('malformed reply remains a retryable content error', async () => {
  jest.mocked(axiosClient.post).mockResolvedValue({ data: { reply: '' } });
  await expect(askShopAI('test')).rejects.toMatchObject({ code: 'content' });
});
test('rate limit/offline/timeout are sanitized', async () => {
  jest
    .mocked(axiosClient.post)
    .mockRejectedValue(
      new axios.AxiosError('secret', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 429,
      } as never),
    );
  await expect(askShopAI('test')).rejects.toMatchObject({
    status: 429,
    retryAfterMs: 30000,
  });
  expect(toFriendlyError(new GeminiError('network'))).toContain('kết nối');
  expect(toFriendlyError(new GeminiError('timeout'))).not.toContain('secret');
});
