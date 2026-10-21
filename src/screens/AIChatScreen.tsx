import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShopButton from '@components/ShopButton';
import { useTheme, type ThemeColors } from '@contexts/ThemeContext';
import {
  AI_GREETING,
  AI_SUGGESTIONS,
  MAX_HISTORY_TURNS,
} from '@constants/aiPrompt';
import {
  askShopAI,
  GeminiError,
  toFriendlyError,
  type ChatTurn,
} from '@services/geminiService';
import { useAuthStore } from '@store/useAuthStore';

type ChatRequest = { question: string; history: ChatTurn[] };
type Message = {
  id: string;
  text: string;
  isBot: boolean;
  createdAt: number;
  status: 'sent' | 'pending' | 'error';
  request?: ChatRequest;
};

export default function AIChatScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      text: AI_GREETING,
      isBot: true,
      createdAt: Date.now(),
      status: 'sent',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const list = useRef<FlatList<Message>>(null);
  const history = useRef<ChatTurn[]>([]);
  const busy = useRef(false);
  const sequence = useRef(0);
  const mounted = useRef(false);
  const cooldown = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollToEnd = useCallback(() => {
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }
    scrollTimer.current = setTimeout(() => {
      if (mounted.current) {
        list.current?.scrollToEnd({ animated: true });
      }
    }, 80);
  }, []);
  useEffect(() => {
    mounted.current = true;
    const keyboard = Keyboard.addListener('keyboardDidShow', scrollToEnd);
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      if (
        state.sessionId !== previous.sessionId ||
        !state.isUnlocked ||
        !state.token
      ) {
        controller.current?.abort();
        history.current = [];
      }
    });
    return () => {
      mounted.current = false;
      controller.current?.abort();
      history.current = [];
      keyboard.remove();
      unsubscribe();
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, [scrollToEnd]);
  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      return;
    }
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= cooldownUntil) {
        clearInterval(timer);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const send = useCallback(
    async (request: ChatRequest, responseId: string, isRetry: boolean) => {
      const auth = useAuthStore.getState();
      if (
        busy.current ||
        Date.now() < cooldown.current ||
        !auth.token ||
        !auth.isUnlocked
      ) {
        return;
      }
      busy.current = true;
      const abort = new AbortController();
      controller.current = abort;
      setIsTyping(true);
      if (!isRetry) {
        setInput('');
      }
      if (isRetry) {
        setMessages(previous =>
          previous.map(message =>
            message.id === responseId
              ? {
                  ...message,
                  status: 'pending',
                  text: '',
                  createdAt: Date.now(),
                }
              : message,
          ),
        );
      } else {
        setMessages(previous => [
          ...previous,
          {
            id: `user-${responseId}`,
            text: request.question,
            isBot: false,
            createdAt: Date.now(),
            status: 'sent',
          },
          {
            id: responseId,
            text: '',
            isBot: true,
            createdAt: Date.now(),
            status: 'pending',
            request,
          },
        ]);
      }
      scrollToEnd();
      const current = () =>
        mounted.current &&
        !abort.signal.aborted &&
        useAuthStore.getState().sessionId === auth.sessionId &&
        useAuthStore.getState().lockEpoch === auth.lockEpoch &&
        useAuthStore.getState().isUnlocked;
      let waitMs = 1000;
      try {
        const reply = await askShopAI(request.question, request.history, {
          signal: abort.signal,
        });
        if (!current()) {
          return;
        }
        history.current = [
          ...history.current,
          { role: 'user', parts: [{ text: request.question }] },
          { role: 'model', parts: [{ text: reply }] },
        ].slice(-MAX_HISTORY_TURNS * 2) as ChatTurn[];
        setMessages(previous =>
          previous.map(message =>
            message.id === responseId
              ? {
                  ...message,
                  text: reply,
                  status: 'sent',
                  createdAt: Date.now(),
                }
              : message,
          ),
        );
      } catch (error) {
        if (!current()) {
          return;
        }
        if (error instanceof GeminiError && error.status === 429) {
          waitMs = error.retryAfterMs;
        }
        setMessages(previous =>
          previous.map(message =>
            message.id === responseId
              ? {
                  ...message,
                  text: toFriendlyError(error),
                  status: 'error',
                  createdAt: Date.now(),
                }
              : message,
          ),
        );
      } finally {
        busy.current = false;
        if (current()) {
          cooldown.current = Date.now() + waitMs;
          setCooldownUntil(cooldown.current);
          setNow(Date.now());
          setIsTyping(false);
          scrollToEnd();
        }
      }
    },
    [scrollToEnd],
  );
  const handleSend = (override?: string) => {
    const question = (override ?? input).trim();
    if (!question || question.length > 500) {
      return;
    }
    const responseId = `reply-${++sequence.current}`;
    void send(
      {
        question,
        history: history.current.map(turn => ({
          role: turn.role,
          parts: turn.parts.map(part => ({ ...part })),
        })),
      },
      responseId,
      false,
    );
  };
  const coolingDown = now < cooldownUntil;
  const disabled = isTyping || coolingDown;
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Trợ lý ShopAI</Text>
          <Text style={styles.subtitle}>
            {isTyping
              ? 'Đang soạn tin...'
              : 'Tư vấn điện thoại, laptop và phụ kiện'}
          </Text>
        </View>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={message => message.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.isBot ? styles.botBubble : styles.userBubble,
                item.status === 'error' && styles.errorBubble,
              ]}
            >
              {item.status === 'pending' ? (
                <View style={styles.typing}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.botText}>Trợ lý đang soạn tin...</Text>
                </View>
              ) : (
                <Text
                  selectable
                  style={item.isBot ? styles.botText : styles.userText}
                >
                  {item.text}
                </Text>
              )}
              <Text style={[styles.time, !item.isBot && styles.userTime]}>
                {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {item.status === 'error' && item.request && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Thử lại câu hỏi"
                  disabled={disabled}
                  onPress={() => {
                    if (item.request) {
                      void send(item.request, item.id, true);
                    }
                  }}
                  style={styles.retry}
                >
                  <Text style={[styles.retryText, disabled && styles.muted]}>
                    Thử lại
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          ListFooterComponent={
            messages.length === 1 ? (
              <View style={styles.suggestions}>
                <Text style={styles.subtitle}>Gợi ý cho bạn</Text>
                {AI_SUGGESTIONS.map(question => (
                  <Pressable
                    key={question}
                    accessibilityLabel={question}
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={() => handleSend(question)}
                    style={styles.chip}
                  >
                    <Text style={styles.retryText}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            ) : undefined
          }
        />
        {coolingDown && (
          <Text style={styles.cooldown}>
            Bạn đợi {Math.ceil((cooldownUntil - now) / 1000)} giây trước khi gửi
            tiếp nhé.
          </Text>
        )}
        <View style={styles.inputArea}>
          <TextInput
            accessibilityLabel="Câu hỏi tư vấn"
            value={input}
            onChangeText={setInput}
            placeholder="Nhập câu hỏi tư vấn..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            editable={!disabled}
            style={styles.input}
            onSubmitEditing={() => handleSend()}
          />
          <ShopButton
            title="Gửi"
            onPress={() => handleSend()}
            disabled={disabled || !input.trim()}
            isLoading={isTyping}
            style={styles.send}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { padding: 14, backgroundColor: colors.surface },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textLight, marginTop: 4 },
    list: { padding: 16, flexGrow: 1 },
    bubble: {
      padding: 14,
      borderRadius: 18,
      marginBottom: 12,
      maxWidth: '88%',
    },
    botBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    errorBubble: { borderWidth: 1, borderColor: colors.error },
    botText: { color: colors.text, fontSize: 15, lineHeight: 23 },
    userText: { color: '#FFFFFF', fontSize: 15, lineHeight: 23 },
    time: { color: colors.textLight, fontSize: 11, marginTop: 6 },
    userTime: { color: '#FFFFFF' },
    typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    retry: { paddingVertical: 8, marginTop: 4 },
    retryText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    muted: { opacity: 0.4 },
    suggestions: { gap: 10, marginTop: 8 },
    chip: {
      borderWidth: 1,
      borderColor: colors.primary,
      padding: 12,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    inputArea: {
      flexDirection: 'row',
      padding: 12,
      gap: 10,
      backgroundColor: colors.surface,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      minHeight: 48,
      maxHeight: 120,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.background,
      color: colors.text,
      fontSize: 15,
    },
    send: { width: 76 },
    cooldown: {
      color: colors.textLight,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 12,
    },
  });
