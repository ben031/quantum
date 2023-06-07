import { useEffect, useState } from "react";

const useDebounce = <T>({ value, delay }: { value: T; delay?: number }) => {
  const [debounceValue, setDebounceValue] = useState<T>(value);

  useEffect(() => {
    const listener = setTimeout(() => {
      setDebounceValue(value);
    }, delay ?? 300);

    return () => {
      clearTimeout(listener);
    };
  }, [delay, value]);

  return debounceValue;
};

export default useDebounce;
