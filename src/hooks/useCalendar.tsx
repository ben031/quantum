import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseCalendarParams = {
  month?: number;
  year?: number;
};

const now = dayjs();

export type TwoDemensionalArray<T> = T[][];

const useCalendar = (args: UseCalendarParams = {}) => {
  const [year, setYear] = useState<number>(args.year ?? now.year());
  const [month, setMonth] = useState<number>(args.month ?? now.month() + 1);
  const [calendar, setCalendar] = useState<TwoDemensionalArray<Dayjs>>([[]]);

  const startOfDay = useMemo(
    () =>
      dayjs(new Date(year, month - 1))
        .clone()
        .startOf("month")
        .startOf("week"),
    [year, month]
  );
  const endOfDay = useMemo(
    () =>
      dayjs(new Date(year, month - 1))
        .clone()
        .endOf("month")
        .endOf("week"),
    [year, month]
  );

  const goBackByYear = useCallback(
    (year?: number) => setYear((prev) => prev - (year ?? 1)),
    []
  );
  const goForwardByYear = useCallback(
    (year?: number) => setYear((prev) => prev + (year ?? 1)),
    []
  );
  const goBackByMonth = useCallback(
    (subMonth?: number) => {
      if (month === 1 || month - (subMonth ?? 1) < 1) {
        setMonth(12);
        goBackByYear();
        return;
      }
      setMonth((prev) => prev - (subMonth ?? 1));
    },
    [goBackByYear, month]
  );
  const goForwardByMonth = useCallback(
    (addMonth?: number) => {
      if (month === 12 || month + (addMonth ?? 1) > 12) {
        setMonth(1);
        goForwardByYear();
        return;
      }
      setMonth((prev) => prev + (addMonth ?? 1));
    },
    [goForwardByYear, month]
  );
  const resetToday = useCallback(() => {
    setYear(now.year());
    setMonth(now.month() + 1);
  }, []);
  const makeCalendarDays = useCallback(() => {
    const inMonthDays = [];

    for (let i = startOfDay; i.isBefore(endOfDay); i = i.add(1, "day")) {
      inMonthDays.push(i);
    }

    const splitBySevenDays = inMonthDays.reduce<TwoDemensionalArray<Dayjs>>(
      (acc, val, idx) => {
        if (idx % 7 === 0) {
          return [...acc, [val]];
        }
        const unFilled = acc.pop() ?? [];
        unFilled.push(val);
        return [...acc, unFilled];
      },
      []
    );

    return splitBySevenDays;
  }, [startOfDay, endOfDay]);

  useEffect(() => {
    setCalendar(makeCalendarDays());
  }, [year, month, makeCalendarDays]);

  return {
    state: { calendar, year, month },
    func: {
      goBackByMonth,
      goForwardByMonth,
      goBackByYear,
      goForwardByYear,
      resetToday,
      changeYear: setYear,
      changeMonth: setMonth,
    },
  };
};

export default useCalendar;
