import { useEffect, useState } from 'react';

export function useCountdown(initialSeconds: number): {
  timeLeft: number;
  isFinished: boolean;
} {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft(previous => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  return { timeLeft, isFinished: timeLeft === 0 };
}
