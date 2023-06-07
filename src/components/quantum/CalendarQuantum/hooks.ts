import { useContext } from "react";
import { CalendarRootContext } from ".";

const useCalendarContext = () => {
  const context = useContext(CalendarRootContext);

  if (context === undefined) {
    throw Error("CalendarRootContext");
  }

  return context;
};

export { useCalendarContext };
