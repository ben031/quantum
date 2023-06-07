import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  createContext,
  forwardRef,
  useState,
  useLayoutEffect,
  useRef,
  useEffect,
  ReactElement,
  useId,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import useCalendar, { TwoDemensionalArray } from "../../../hooks/useCalendar";
import { useCalendarContext } from "./hooks";
import ReactDomPortal from "../PortalQuantum";
import {
  QPopperAnchor,
  QPopperArrow,
  PopperQuantumArrowProps,
  QPopperContent,
  PopperQuantumContentProps,
  QPopperRoot,
} from "../PopperQuantum";

interface CalendRootProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: Dayjs;
  onValueChange?: (value?: Dayjs) => void;
  disabled?: boolean;
}

type CalendarRootContextValueType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: Dayjs;
  onValueChange: (value?: Dayjs) => void;
  goBackByMonth: (by?: number) => void;
  goBackByYear: (by?: number) => void;
  goForwardByMonth: (by?: number) => void;
  goForwardByYear: (by?: number) => void;
  resetToday: () => void;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  month: number;
  year: number;
  calendar: TwoDemensionalArray<Dayjs>;
  disabled?: boolean;
  onTriggerChange: (node?: HTMLButtonElement | null) => void;
  onContentNodeChange: (node?: HTMLDivElement | null) => void;
};

export const CalendarRootContext = createContext<
  CalendarRootContextValueType | undefined
>(undefined);

const { Provider: CalendarRootContextProvider } = CalendarRootContext;

const QCalendarRoot: React.FC<CalendRootProps> = (props) => {
  const [unControlledOpen, setUnControlledOpen] = useState<boolean>(false);
  const [unControlledValue, setUnControlledValue] = useState<Dayjs>();
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>();
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>();
  const { func: calendarFunc, state: calendarState } = useCalendar(
    props.value !== undefined
      ? {
          year: dayjs(props.value).year(),
          month: dayjs(props.value).month() + 1,
        }
      : undefined
  );

  const { month, year, calendar } = calendarState;
  const {
    goBackByMonth,
    goBackByYear,
    goForwardByMonth,
    goForwardByYear,
    resetToday,
    changeMonth,
    changeYear,
  } = calendarFunc;

  const open = props.open === undefined ? unControlledOpen : props.open;
  const setOpen = props.onOpenChange || setUnControlledOpen;
  const value = props.value || unControlledValue;
  const setValue = props.onValueChange || setUnControlledValue;

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (
        trigger?.contains(event.target as Node) ||
        contentNode?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [contentNode, setOpen, trigger]);

  return (
    <QPopperRoot>
      <CalendarRootContextProvider
        value={{
          open,
          onOpenChange: setOpen,
          value,
          onValueChange: setValue,
          goBackByMonth,
          goBackByYear,
          goForwardByMonth,
          goForwardByYear,
          resetToday,
          changeMonth,
          changeYear,
          month,
          year,
          calendar,
          disabled: props.disabled,
          onTriggerChange: setTrigger,
          onContentNodeChange: setContentNode,
        }}
      >
        {props.children}
      </CalendarRootContextProvider>
    </QPopperRoot>
  );
};

interface CalendarTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

const OPEN_KEY = ["Enter", " "];
const CLOSE_KEY = ["Escape"];

const QCalendarTrigger = forwardRef<HTMLButtonElement, CalendarTriggerProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const [isFocus, setIsFocus] = useState<boolean>(false);
    const toggle = () => {
      context.onOpenChange(!context.open);
    };
    const open = () => {
      context.onOpenChange(true);
    };
    const close = () => {
      context.onOpenChange(false);
    };

    return (
      <QPopperAnchor>
        <button
          ref={(node) => {
            if (!node) return;
            context.onTriggerChange(node);
            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          type="button"
          data-state={context.open ? "open" : "closed"}
          aria-expanded={context.open}
          aria-disabled={context.disabled}
          data-disabled={context.disabled}
          {...props}
          onFocus={(e) => {
            setIsFocus(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocus(false);
            props.onBlur?.(e);
          }}
          onPointerDown={(e) => {
            toggle();
            props.onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            if (isFocus) {
              if (OPEN_KEY.includes(e.key)) {
                open();
              }
              if (CLOSE_KEY.includes(e.key)) {
                close();
              }
              e.preventDefault();
            }
          }}
        />
      </QPopperAnchor>
    );
  }
);

interface CalendarPortalProps {
  children?: ReactNode;
  container?: Element | DocumentFragment;
}

const QCalendarPortal = (props: CalendarPortalProps) => {
  return <ReactDomPortal {...props} />;
};

interface CalendarContentProps
  extends Omit<PopperQuantumContentProps, "children">,
    HTMLAttributes<HTMLDivElement> {}

const QCalendarContent = forwardRef<HTMLDivElement, CalendarContentProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    const animationName = useRef<string>();
    const transitionDurationRef = useRef<string>();
    const prevOpenValue = useRef<boolean>(context.open);
    const height = useRef<number>(0);
    const [isInteractionEnd, setIsInteractionEnd] = useState<boolean>(true);
    const isClose = !context.open && isInteractionEnd;
    const {
      offset,
      position,
      hideWhenAnchorDisappear,
      detectPadding,
      ...restProps
    } = props;

    useLayoutEffect(() => {
      if (node && context.open) {
        setIsInteractionEnd(false);
        const { animation: originalAnimation, transitionDuration } =
          window.getComputedStyle(node);

        animationName.current = originalAnimation;
        transitionDurationRef.current = transitionDuration;
        node.style.animationName = "none";
        node.style.transitionDuration = "0s";

        const nodeHeight = node.getBoundingClientRect().height;
        height.current = nodeHeight;

        node.style.setProperty(
          "--popper-content-height",
          `${height.current}px`
        );

        node.style.animation = animationName.current;
        node.style.transitionDuration = transitionDurationRef.current;
      }
    }, [node, context.open]);

    useLayoutEffect(() => {
      if (
        node &&
        context.open === true &&
        context.open === prevOpenValue.current
      ) {
        node.style.animationName = "none";
        node.style.transitionDuration = "0s";
      }

      prevOpenValue.current = context.open;

      return () => {
        if (
          node &&
          context.open === true &&
          context.open === prevOpenValue.current
        ) {
          node.style.animation = animationName.current || "";
          node.style.transitionDuration = transitionDurationRef.current || "";
        }
      };
      // node set되면서 리렌더 이슈
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.open, context.month, context.year]);

    useEffect(() => {
      const close = () => setIsInteractionEnd(true);

      if (!context.open && node) {
        node.style.animation = "";
        node.style.transitionDuration = "";

        const { animationName: closeAnimationName } =
          window.getComputedStyle(node);
        if (closeAnimationName === "none") {
          close();
        }
        node.addEventListener("transitionend", close);
        node.addEventListener("animationend", close);
      }

      return () => {
        node?.removeEventListener("transitionend", close);
        node?.removeEventListener("animationend", close);
      };
    }, [context.open, node]);

    return isClose ? null : (
      <QPopperContent
        offset={offset}
        position={position}
        hideWhenAnchorDisappear={hideWhenAnchorDisappear}
        detectPadding={detectPadding}
      >
        <div
          role="application"
          data-state={context.open ? "open" : "closed"}
          aria-expanded={context.open}
          ref={(nd) => {
            setNode(nd);
            context.onContentNodeChange(nd);
            if (ref) {
              if (typeof ref === "function") {
                ref(nd);
              } else {
                ref.current = nd;
              }
            }
          }}
          {...restProps}
        />
      </QPopperContent>
    );
  }
);

interface CalendarValueProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "placeholder"> {
  placeholder?: ReactNode;
  format?: string;
}

const QCalendarValue = forwardRef<HTMLSpanElement, CalendarValueProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const { placeholder, format: formatProps, style, ...restProps } = props;
    const hasNoChildren = !props.children;

    const renderContent = () => {
      if (context.value === undefined) {
        if (placeholder) {
          return placeholder;
        }
        return props.children;
      }
      if (hasNoChildren) {
        return <>{dayjs(context.value).format(formatProps ?? "YY-MM-DD")}</>;
      }

      return props.children;
    };

    return (
      <span
        ref={ref}
        style={{ ...style, pointerEvents: "none" }}
        {...restProps}
      >
        {renderContent()}
      </span>
    );
  }
);

interface CalendarYearProps extends HTMLAttributes<HTMLSpanElement> {
  suffix?: string;
}

const QCalendarYear = forwardRef<HTMLSpanElement, CalendarYearProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const { suffix = "", ...restProps } = props;

    const year = context.year;

    return (
      <span {...restProps} ref={ref}>
        {year}
        {suffix}
      </span>
    );
  }
);

interface CalendarMonthProps extends HTMLAttributes<HTMLSpanElement> {
  suffix?: string;
}

const QCalendarMonth = forwardRef<HTMLSpanElement, CalendarMonthProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const { suffix = "", ...restProps } = props;

    const month = context.month;

    return (
      <span {...restProps} ref={ref}>
        {month}
        {suffix}
      </span>
    );
  }
);

interface CalendarProps {
  children?: (calendar: TwoDemensionalArray<dayjs.Dayjs>) => ReactElement;
}

const QCalendar: React.FC<CalendarProps> = (props: CalendarProps) => {
  const context = useCalendarContext();

  return props.children ? props.children(context.calendar) : null;
};

interface CalendarWeekProps extends HTMLAttributes<HTMLSpanElement> {
  disabled?: boolean;
}

const QCalendarWeek = forwardRef<HTMLDivElement, CalendarWeekProps>(
  (props, ref) => {
    const { disabled, ...restProps } = props;

    return (
      <div
        ref={ref}
        data-disabled={disabled}
        aria-disabled={disabled}
        aria-hidden={disabled}
        key={useId()}
        {...restProps}
      />
    );
  }
);

interface CalendarDayProps extends HTMLAttributes<HTMLSpanElement> {
  day: dayjs.Dayjs;
  disabled?: boolean;
}

const QCalendarDay = forwardRef<HTMLSpanElement, CalendarDayProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const { disabled, day, onPointerDown, onPointerUp, ...restProps } = props;
    const dayjsFormat = dayjs(day);
    const dayOfTheWeek = dayjsFormat.day();
    const isSelected = dayjsFormat.isSame(dayjs(context.value));
    const isToday = dayjsFormat.isSame(dayjs(), "day");
    const isThisMonth = dayjsFormat.month() + 1 === context.month;
    const hasChildren = props.children !== undefined;
    const handleChange = () => {
      context.onValueChange(day);
    };

    const toggle = () => {
      context.onOpenChange(!context.open);
    };

    const renderDay = () => {
      return <>{dayjsFormat.date()}</>;
    };

    return (
      <span
        ref={ref}
        data-selected={isSelected}
        data-today={isToday}
        data-thismonth={isThisMonth}
        data-state={
          dayOfTheWeek === 0
            ? "sunday"
            : dayOfTheWeek === 6
            ? "saturday"
            : "weekday"
        }
        data-disabled={disabled}
        aria-disabled={disabled}
        aria-hidden={disabled}
        key={useId()}
        {...restProps}
        onPointerDown={(e) => {
          handleChange();
          onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          toggle();

          if (
            context.month !== dayjsFormat.month() + 1 ||
            context.year !== dayjsFormat.year()
          ) {
            context.changeMonth(dayjsFormat.month() + 1);
            context.changeYear(dayjsFormat.year());
          }
          onPointerUp?.(e);
        }}
      >
        {hasChildren ? props.children : renderDay()}
      </span>
    );
  }
);

type ResetToday = "resetToday";
type MovingActionType =
  | "goBackAMonth"
  | "goForwardAMonth"
  | "goBackAYear"
  | "goForwardAYear";

interface CalendarButtonMovingAction {
  actionType: MovingActionType;
  by?: number;
}

interface CalendarButtonResetAction {
  actionType: ResetToday;
  by?: never;
}

type CalendarButtonProps = (
  | CalendarButtonMovingAction
  | CalendarButtonResetAction
) &
  ButtonHTMLAttributes<HTMLButtonElement>;

const QCalendarButton = forwardRef<HTMLButtonElement, CalendarButtonProps>(
  (props, ref) => {
    const context = useCalendarContext();
    const { onPointerUp, actionType, by, ...restProps } = props;

    const handlePointerUp = () => {
      switch (actionType) {
        case "goBackAMonth":
          return context.goBackByMonth(by);
        case "goBackAYear":
          return context.goBackByYear(by);
        case "goForwardAMonth":
          return context.goForwardByMonth(by);
        case "goForwardAYear":
          return context.goForwardByYear(by);
        case "resetToday":
          context.resetToday();
          context.onValueChange(dayjs());
          return;
        default:
          throw Error("CalendarButton의 actionType가 정의되지 않았습니다.");
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        {...restProps}
        onPointerUp={(e) => {
          handlePointerUp();
          onPointerUp?.(e);
        }}
      />
    );
  }
);

interface CaledarArrowProps extends PopperQuantumArrowProps {}

const QCalendarArrow = forwardRef<HTMLSpanElement, CaledarArrowProps>(
  (props, ref) => {
    return <QPopperArrow ref={ref} {...props} />;
  }
);

const Root = QCalendarRoot;
const Trigger = QCalendarTrigger;
const Portal = QCalendarPortal;
const Content = QCalendarContent;
const Value = QCalendarValue;
const Year = QCalendarYear;
const Month = QCalendarMonth;
const Week = QCalendarWeek;
const Day = QCalendarDay;
const Button = QCalendarButton;
const Arrow = QCalendarArrow;

export {
  QCalendarRoot,
  QCalendarTrigger,
  QCalendarPortal,
  QCalendarContent,
  QCalendarValue,
  QCalendarYear,
  QCalendarMonth,
  QCalendar,
  QCalendarWeek,
  QCalendarDay,
  QCalendarButton,
  QCalendarArrow,
  //
  //
  //
  Root,
  Trigger,
  Portal,
  Content,
  Value,
  Year,
  Month,
  Week,
  Day,
  Button,
  Arrow,
};
