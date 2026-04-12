import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../ui/input";

interface TimeInputProps {
  disabled?: boolean;
  id: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}

function extractDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function formatTimeDigits(digits: string) {
  const hours = digits.slice(0, 2);
  const minutes = digits.slice(2, 4);

  return [hours, minutes].filter(Boolean).join(":");
}

function normalizeTimeDigits(digits: string) {
  if (!digits) {
    return "";
  }

  let hoursPart = digits.slice(0, Math.min(2, digits.length));
  let minutesPart = digits.slice(2, Math.min(4, digits.length));

  if (hoursPart.length === 1 && Number(hoursPart) > 2) {
    hoursPart = "23";
  } else if (hoursPart.length === 2) {
    const hours = Number(hoursPart);

    if (hours > 23) {
      hoursPart = "23";
    }
  }

  if (minutesPart.length === 1 && Number(minutesPart) > 5) {
    minutesPart = "59";
  } else if (minutesPart.length === 2) {
    const minutes = Number(minutesPart);

    if (minutes > 59) {
      minutesPart = "59";
    }
  }

  return `${hoursPart}${minutesPart}`.slice(0, 4);
}

function isValidTimeDigits(digits: string) {
  if (!digits) {
    return true;
  }

  const hoursPart = digits.slice(0, Math.min(2, digits.length));
  const minutesPart = digits.slice(2, Math.min(4, digits.length));

  if (hoursPart.length === 1) {
    const firstHourDigit = Number(hoursPart);

    if (firstHourDigit < 0 || firstHourDigit > 2) {
      return false;
    }
  }

  if (hoursPart.length === 2) {
    const hours = Number(hoursPart);

    if (hours < 0 || hours > 23) {
      return false;
    }
  }

  if (minutesPart.length === 1) {
    const firstMinuteDigit = Number(minutesPart);

    if (firstMinuteDigit < 0 || firstMinuteDigit > 5) {
      return false;
    }
  }

  if (minutesPart.length === 2) {
    const minutes = Number(minutesPart);

    if (minutes < 0 || minutes > 59) {
      return false;
    }
  }

  return true;
}

function normalizeExternalTimeValue(value: string) {
  if (!value) {
    return "";
  }

  const normalizedDigits = normalizeTimeDigits(extractDigits(value));

  if (normalizedDigits.length !== 4 || !isValidTimeDigits(normalizedDigits)) {
    return "";
  }

  return formatTimeDigits(normalizedDigits);
}

function parseDisplayTime(value: string) {
  const normalizedDigits = normalizeTimeDigits(extractDigits(value));

  if (normalizedDigits.length !== 4 || !isValidTimeDigits(normalizedDigits)) {
    return "";
  }

  return formatTimeDigits(normalizedDigits);
}

function getDigitIndex(displayValue: string, caretPosition: number) {
  return extractDigits(displayValue.slice(0, caretPosition)).length;
}

function getCaretPosition(displayValue: string, digitIndex: number) {
  if (digitIndex <= 0) {
    return 0;
  }

  let digitsSeen = 0;

  for (let index = 0; index < displayValue.length; index += 1) {
    if (/\d/.test(displayValue[index])) {
      digitsSeen += 1;

      if (digitsSeen === digitIndex) {
        return index + 1;
      }
    }
  }

  return displayValue.length;
}

function getSegmentEndDigitIndex(digitIndex: number) {
  if (digitIndex < 2) {
    return 2;
  }

  return 4;
}

export function TimeInput({
  disabled,
  id,
  onChange,
  placeholder = "ЧЧ:ММ",
  required,
  value,
}: TimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExternalValueRef = useRef(value);
  const nextCaretDigitIndexRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState(() => normalizeExternalTimeValue(value));

  const normalizedValue = useMemo(() => normalizeExternalTimeValue(value), [value]);

  useEffect(() => {
    if (normalizedValue === lastExternalValueRef.current) {
      return;
    }

    lastExternalValueRef.current = normalizedValue;
    setDisplayValue(normalizedValue);
  }, [normalizedValue]);

  useEffect(() => {
    if (nextCaretDigitIndexRef.current === null || !inputRef.current) {
      return;
    }

    const nextCaretPosition = getCaretPosition(displayValue, nextCaretDigitIndexRef.current);
    inputRef.current.setSelectionRange(nextCaretPosition, nextCaretPosition);
    nextCaretDigitIndexRef.current = null;
  }, [displayValue]);

  function commitDisplayValue(nextDisplayValue: string, nextCaretDigitIndex?: number) {
    setDisplayValue(nextDisplayValue);
    onChange(parseDisplayTime(nextDisplayValue));

    if (typeof nextCaretDigitIndex === "number") {
      nextCaretDigitIndexRef.current = nextCaretDigitIndex;
    }
  }

  function handleKeyboardEditing(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const currentDigits = extractDigits(displayValue);
    const selectionStart = event.currentTarget.selectionStart ?? displayValue.length;
    const selectionEnd = event.currentTarget.selectionEnd ?? displayValue.length;
    const startDigitIndex = getDigitIndex(displayValue, selectionStart);
    const endDigitIndex = getDigitIndex(displayValue, selectionEnd);

    if (event.key === "Backspace") {
      event.preventDefault();

      if (startDigitIndex === endDigitIndex) {
        if (startDigitIndex === 0) {
          return;
        }

        const nextDigits =
          currentDigits.slice(0, startDigitIndex - 1) + currentDigits.slice(startDigitIndex);
        commitDisplayValue(formatTimeDigits(nextDigits), startDigitIndex - 1);
        return;
      }

      const nextDigits =
        currentDigits.slice(0, startDigitIndex) + currentDigits.slice(endDigitIndex);
      commitDisplayValue(formatTimeDigits(nextDigits), startDigitIndex);
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();

      if (startDigitIndex === endDigitIndex) {
        if (startDigitIndex >= currentDigits.length) {
          return;
        }

        const nextDigits =
          currentDigits.slice(0, startDigitIndex) + currentDigits.slice(startDigitIndex + 1);
        commitDisplayValue(formatTimeDigits(nextDigits), startDigitIndex);
        return;
      }

      const nextDigits =
        currentDigits.slice(0, startDigitIndex) + currentDigits.slice(endDigitIndex);
      commitDisplayValue(formatTimeDigits(nextDigits), startDigitIndex);
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();

      if (currentDigits.length >= 4 && startDigitIndex === endDigitIndex) {
        return;
      }

      const nextDigits = (
        currentDigits.slice(0, startDigitIndex) +
        event.key +
        currentDigits.slice(endDigitIndex)
      ).slice(0, 4);
      const normalizedDigits = normalizeTimeDigits(nextDigits);
      const nextCaretDigitIndex = normalizedDigits !== nextDigits
        ? Math.min(getSegmentEndDigitIndex(startDigitIndex), normalizedDigits.length)
        : Math.min(startDigitIndex + 1, normalizedDigits.length);

      if (!isValidTimeDigits(normalizedDigits)) {
        return;
      }

      commitDisplayValue(formatTimeDigits(normalizedDigits), nextCaretDigitIndex);
      return;
    }

    if (event.key === ":" || event.key === ".") {
      event.preventDefault();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    const pastedDigits = extractDigits(event.clipboardData.getData("text"));

    if (!pastedDigits) {
      return;
    }

    event.preventDefault();

    const currentDigits = extractDigits(displayValue);
    const selectionStart = event.currentTarget.selectionStart ?? displayValue.length;
    const selectionEnd = event.currentTarget.selectionEnd ?? displayValue.length;
    const startDigitIndex = getDigitIndex(displayValue, selectionStart);
    const endDigitIndex = getDigitIndex(displayValue, selectionEnd);
    const nextDigits = (
      currentDigits.slice(0, startDigitIndex) +
      pastedDigits +
      currentDigits.slice(endDigitIndex)
    ).slice(0, 4);
    const normalizedDigits = normalizeTimeDigits(nextDigits);

    commitDisplayValue(
      formatTimeDigits(normalizedDigits),
      Math.min(startDigitIndex + pastedDigits.length, normalizedDigits.length),
    );
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    const normalizedDigits = normalizeTimeDigits(extractDigits(event.target.value));

    if (!isValidTimeDigits(normalizedDigits)) {
      event.target.value = displayValue;
      return;
    }

    commitDisplayValue(formatTimeDigits(normalizedDigits));
  }

  return (
    <Input
      ref={inputRef}
      autoComplete="off"
      disabled={disabled}
      id={id}
      inputMode="numeric"
      maxLength={5}
      onChange={handleInputChange}
      onKeyDown={handleKeyboardEditing}
      onPaste={handlePaste}
      placeholder={placeholder}
      required={required}
      value={displayValue}
    />
  );
}
