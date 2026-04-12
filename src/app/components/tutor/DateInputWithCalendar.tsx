import { format, isValid, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Input } from "../ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "../ui/popover";

interface DateInputWithCalendarProps {
  disabled?: boolean;
  id: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const MIN_DATE = new Date(MIN_YEAR, 0, 1);
const MAX_DATE = new Date(MAX_YEAR, 11, 31);

function getCurrentAllowedYear() {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, new Date().getFullYear()));
}

function extractDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatDateDigits(digits: string) {
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join(".");
}

function isLeapYear(year: number) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function getDaysInMonth(month: number, year: number) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }

  return 31;
}

function isDateWithinAllowedRange(date: Date) {
  const timestamp = date.getTime();
  return timestamp >= MIN_DATE.getTime() && timestamp <= MAX_DATE.getTime();
}

function hasMatchingYearPrefix(prefix: string, requireLeapYear = false) {
  if (!prefix) {
    return true;
  }

  for (let year = MIN_YEAR; year <= MAX_YEAR; year += 1) {
    if (!String(year).startsWith(prefix)) {
      continue;
    }

    if (!requireLeapYear || isLeapYear(year)) {
      return true;
    }
  }

  return false;
}

function getMaxAvailableDay(monthPart: string, yearPart: string) {
  if (monthPart.length < 2) {
    return 31;
  }

  const month = Number(monthPart);

  if (month === 2) {
    if (yearPart.length === 4) {
      return getDaysInMonth(month, Number(yearPart));
    }

    return hasMatchingYearPrefix(yearPart, true) ? 29 : 28;
  }

  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }

  return 31;
}

function normalizeDateDigits(digits: string) {
  if (!digits) {
    return "";
  }

  let dayPart = digits.slice(0, Math.min(2, digits.length));
  let monthPart = digits.slice(2, Math.min(4, digits.length));
  let yearPart = digits.slice(4, Math.min(8, digits.length));

  if (monthPart.length === 1 && Number(monthPart) > 1) {
    monthPart = "12";
  } else if (monthPart.length === 2) {
    const month = Number(monthPart);

    if (month < 1 || month > 12) {
      monthPart = "12";
    }
  }

  if (yearPart && !hasMatchingYearPrefix(yearPart)) {
    yearPart = String(getCurrentAllowedYear());
  }

  const maxAvailableDay = getMaxAvailableDay(monthPart, yearPart);

  if (dayPart.length === 1 && Number(dayPart) > 3) {
    dayPart = String(maxAvailableDay).padStart(2, "0");
  } else if (dayPart.length === 2) {
    const day = Number(dayPart);

    if (day < 1 || day > maxAvailableDay) {
      dayPart = String(maxAvailableDay).padStart(2, "0");
    }
  }

  return `${dayPart}${monthPart}${yearPart}`.slice(0, 8);
}

function isValidDateDigits(digits: string) {
  if (!digits) {
    return true;
  }

  const dayPart = digits.slice(0, Math.min(2, digits.length));
  const monthPart = digits.slice(2, Math.min(4, digits.length));
  const yearPart = digits.slice(4, Math.min(8, digits.length));

  if (dayPart.length === 1) {
    const dayFirstDigit = Number(dayPart);

    if (dayFirstDigit < 0 || dayFirstDigit > 3) {
      return false;
    }
  }

  if (dayPart.length === 2) {
    const day = Number(dayPart);

    if (day < 1 || day > 31) {
      return false;
    }
  }

  if (monthPart.length === 1) {
    const monthFirstDigit = Number(monthPart);

    if (monthFirstDigit < 0 || monthFirstDigit > 1) {
      return false;
    }
  }

  if (monthPart.length === 2) {
    const month = Number(monthPart);

    if (month < 1 || month > 12) {
      return false;
    }
  }

  if (yearPart && !hasMatchingYearPrefix(yearPart)) {
    return false;
  }

  if (dayPart.length < 2 || monthPart.length < 2) {
    return true;
  }

  const day = Number(dayPart);
  const month = Number(monthPart);

  if ([4, 6, 9, 11].includes(month) && day > 30) {
    return false;
  }

  if (month === 2) {
    if (day > 29) {
      return false;
    }

    if (day === 29 && yearPart && !hasMatchingYearPrefix(yearPart, true)) {
      return false;
    }
  }

  if (yearPart.length === 4) {
    const year = Number(yearPart);

    if (day > getDaysInMonth(month, year)) {
      return false;
    }
  }

  return true;
}

function formatIsoDate(value: string) {
  if (!value) {
    return "";
  }

  const parsedDate = parse(value, "yyyy-MM-dd", new Date());

  if (!isValid(parsedDate) || !isDateWithinAllowedRange(parsedDate)) {
    return "";
  }

  return format(parsedDate, "dd.MM.yyyy");
}

function parseDisplayDate(value: string) {
  if (value.length !== 10) {
    return "";
  }

  const parsedDate = parse(value, "dd.MM.yyyy", new Date());

  if (
    !isValid(parsedDate) ||
    format(parsedDate, "dd.MM.yyyy") !== value ||
    !isDateWithinAllowedRange(parsedDate)
  ) {
    return "";
  }

  return format(parsedDate, "yyyy-MM-dd");
}

function getDateFromIso(value: string) {
  if (!value) {
    return undefined;
  }

  const parsedDate = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsedDate) && isDateWithinAllowedRange(parsedDate) ? parsedDate : undefined;
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

  if (digitIndex < 4) {
    return 4;
  }

  return 8;
}

export function DateInputWithCalendar({
  disabled,
  id,
  onChange,
  placeholder = "ДД.ММ.ГГГГ",
  required,
  value,
}: DateInputWithCalendarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExternalValueRef = useRef(value);
  const nextCaretDigitIndexRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(() => formatIsoDate(value));

  const selectedDate = useMemo(() => getDateFromIso(value), [value]);

  useEffect(() => {
    if (value === lastExternalValueRef.current) {
      return;
    }

    lastExternalValueRef.current = value;
    setDisplayValue(formatIsoDate(value));
  }, [value]);

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
    onChange(parseDisplayDate(nextDisplayValue));

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
        commitDisplayValue(formatDateDigits(nextDigits), startDigitIndex - 1);
        return;
      }

      const nextDigits =
        currentDigits.slice(0, startDigitIndex) + currentDigits.slice(endDigitIndex);
      commitDisplayValue(formatDateDigits(nextDigits), startDigitIndex);
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
        commitDisplayValue(formatDateDigits(nextDigits), startDigitIndex);
        return;
      }

      const nextDigits =
        currentDigits.slice(0, startDigitIndex) + currentDigits.slice(endDigitIndex);
      commitDisplayValue(formatDateDigits(nextDigits), startDigitIndex);
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();

      if (currentDigits.length >= 8 && startDigitIndex === endDigitIndex) {
        return;
      }

      const nextDigits = (
        currentDigits.slice(0, startDigitIndex) +
        event.key +
        currentDigits.slice(endDigitIndex)
      ).slice(0, 8);
      const normalizedDigits = normalizeDateDigits(nextDigits);
      const nextCaretDigitIndex = normalizedDigits !== nextDigits
        ? Math.min(getSegmentEndDigitIndex(startDigitIndex), normalizedDigits.length)
        : Math.min(startDigitIndex + 1, normalizedDigits.length);

      if (!isValidDateDigits(normalizedDigits)) {
        return;
      }

      commitDisplayValue(formatDateDigits(normalizedDigits), nextCaretDigitIndex);
      return;
    }

    if (event.key === "." || event.key === "/") {
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
    ).slice(0, 8);
    const normalizedDigits = normalizeDateDigits(nextDigits);

    commitDisplayValue(
      formatDateDigits(normalizedDigits),
      Math.min(startDigitIndex + pastedDigits.length, normalizedDigits.length),
    );
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    const normalizedDigits = normalizeDateDigits(extractDigits(event.target.value));

    if (!isValidDateDigits(normalizedDigits)) {
      event.target.value = displayValue;
      return;
    }

    commitDisplayValue(formatDateDigits(normalizedDigits));
  }

  function handleCalendarSelect(date?: Date) {
    if (!date || !isDateWithinAllowedRange(date)) {
      return;
    }

    const nextIsoValue = format(date, "yyyy-MM-dd");
    const nextDisplayValue = format(date, "dd.MM.yyyy");

    setDisplayValue(nextDisplayValue);
    onChange(nextIsoValue);
    setOpen(false);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            autoComplete="off"
            className="pr-11"
            disabled={disabled}
            id={id}
            inputMode="numeric"
            maxLength={10}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyboardEditing}
            onPaste={handlePaste}
            placeholder={placeholder}
            required={required}
            value={displayValue}
          />

          <Button
            aria-label="Открыть календарь"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            disabled={disabled}
            onClick={() => setOpen((currentOpen) => !currentOpen)}
            type="button"
            variant="ghost"
          >
            <CalendarDays className="size-4" />
          </Button>
        </div>
      </PopoverAnchor>

      <PopoverContent align="start" className="w-auto p-0" side="bottom">
        <Calendar
          disabled={(date) => !isDateWithinAllowedRange(date)}
          locale={ru}
          mode="single"
          onSelect={handleCalendarSelect}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}
