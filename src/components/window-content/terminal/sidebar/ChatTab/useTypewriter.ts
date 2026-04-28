import { useEffect, useRef, useState } from "react";

/** Character-by-character reveal for short strings (conversation names in
 *  the status bar). Resets + restarts animation whenever `text` flips to a
 *  new non-null value; no-ops for identical successive values. */
export function useTypewriter(text: string | null | undefined, speed = 50) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const prevTextRef = useRef<string | null>(null);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setIsTyping(false);
      prevTextRef.current = null;
      return;
    }

    if (text === prevTextRef.current) return;
    prevTextRef.current = text;

    setDisplayed("");
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { displayed, isTyping };
}
