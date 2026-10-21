import axios from 'axios';
import axiosClient from '@api/axiosClient';
import { MAX_HISTORY_TURNS } from '@constants/aiPrompt';
export type ChatTurn = { role: 'user' | 'model'; parts: { text: string }[] };
type ErrorCode =
  | 'config'
  | 'input'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'content'
  | 'http';
export class GeminiError extends Error {
  constructor(
    public code: ErrorCode,
    public status?: number,
    public retryAfterMs = 0,
  ) {
    super(code);
    this.name = 'GeminiError';
  }
}

export function completedHistory(history: ChatTurn[]): ChatTurn[] {
  const pairs: ChatTurn[][] = [];
  for (let index = 0; index < history.length - 1; index++) {
    const user = history[index];
    const model = history[index + 1];
    if (
      user.role === 'user' &&
      model.role === 'model' &&
      user.parts.some(part => part.text.trim()) &&
      model.parts.some(part => part.text.trim())
    ) {
      pairs.push([user, model]);
      index++;
    }
  }
  return pairs
    .slice(-MAX_HISTORY_TURNS)
    .flat()
    .map(turn => ({
      role: turn.role,
      parts: turn.parts
        .filter(part => part.text.trim())
        .map(part => ({ text: part.text.slice(0, 4000) })),
    }));
}

export async function askShopAI(
  question: string,
  history: ChatTurn[] = [],
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const message = question.trim();
  if (!message || message.length > 500) throw new GeminiError('input');
  if (options.signal?.aborted) throw new GeminiError('cancelled');
  try {
    const response = await axiosClient.post(
      '/api/ai/chat',
      {
        message,
        history: completedHistory(history).map(turn => ({
          role: turn.role,
          text: turn.parts.map(p => p.text).join(''),
        })),
      },
      { signal: options.signal, timeout: 30000 },
    );
    if (typeof response.data?.reply !== 'string' || !response.data.reply.trim())
      throw new GeminiError('content');
    return response.data.reply.trim();
  } catch (error) {
    if (error instanceof GeminiError) throw error;
    if (axios.isCancel(error)) throw new GeminiError('cancelled');
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
        throw new GeminiError('timeout');
      if (error.response)
        throw new GeminiError(
          'http',
          error.response.status,
          error.response.status === 429 ? 30000 : 0,
        );
    }
    throw new GeminiError('network');
  }
}

export function toFriendlyError(error: unknown): string {
  if (!(error instanceof GeminiError)) {
    return 'Trợ lý gặp sự cố tạm thời. Bạn thử lại nhé.';
  }
  if (error.code === 'input') {
    return 'Bạn nhập câu hỏi từ 1 đến 500 ký tự nhé.';
  }
  if (error.code === 'config' || error.status === 401 || error.status === 403) {
    return 'Dịch vụ tư vấn chưa sẵn sàng. Bạn thử lại sau nhé.';
  }
  if (error.code === 'timeout') {
    return 'AI phản hồi hơi lâu, bạn thử lại nhé.';
  }
  if (error.code === 'cancelled') {
    return 'Yêu cầu đã được hủy.';
  }
  if (error.code === 'network') {
    return 'Mất kết nối mạng. Bạn kiểm tra Wi-Fi/4G rồi thử lại nhé.';
  }
  if (error.code === 'content') {
    return 'Chưa có câu trả lời phù hợp. Bạn thử hỏi theo cách khác nhé.';
  }
  if (error.status === 429) {
    return 'Trợ lý đang bận. Bạn đợi một chút rồi thử lại nhé.';
  }
  if (error.status === 404) {
    return 'Dịch vụ tư vấn hiện không khả dụng. Bạn thử lại sau nhé.';
  }
  if (error.status === 400) {
    return 'Chưa xử lý được yêu cầu này. Bạn thử lại sau nhé.';
  }
  return 'Trợ lý gặp sự cố tạm thời. Bạn thử lại sau nhé.';
}
