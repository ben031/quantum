import React, {
  ComponentProps,
  ReactElement,
  ReactNode,
  useCallback,
  ButtonHTMLAttributes,
  HTMLAttributes,
  useState,
  createContext,
  forwardRef,
  useLayoutEffect,
  useRef,
  KeyboardEvent,
  useMemo,
  useEffect,
} from "react";
import * as ReactDOM from "react-dom";
import { nanoid } from "nanoid";
import QPortal from "../PortalQuantum";
import { SELECT_OPEN_KEY } from "./constant";
import { isUndefined } from "@/src/utils/is";
import {
  QPopperAnchor,
  QPopperArrow,
  PopperQuantumArrowProps,
  QPopperContent,
  PopperQuantumContentProps,
  QPopperRoot,
} from "../PopperQuantum";
import {
  useNativeOptionContext,
  useSelectContext,
  useSelectItemContext,
} from "./hooks";

interface SelectProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

type NativeOptionComponentProps = ReactElement<ComponentProps<"option">>;

type SelectContextValueType = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  valueNode?: HTMLSpanElement;
  onValueNodeChange?: (node: HTMLSpanElement) => void;
  disabled?: boolean;
  required?: boolean;
  trigger?: HTMLButtonElement;
  onTriggerChange: (HTMLButtonElement: HTMLButtonElement) => void;
  contentId: string;
  hasValueContent?: boolean;
  onHasValueContentChange?: (hasValueContent: boolean) => void;
};

type HtmlNatvieOptionContextValueType = {
  onOptionChange: (option: NativeOptionComponentProps) => void;
  onOptionReset: () => void;
};

/************************************************************************************************/

export const SelectRootContext = createContext<
  SelectContextValueType | undefined
>(undefined);

/************************************************************************************************/

export const HtmlNativeOptionContext = createContext<
  HtmlNatvieOptionContextValueType | undefined
>(undefined);

const { Provider: SelectRootProvider } = SelectRootContext;
const { Provider: HtmlNativeOptionProvider } = HtmlNativeOptionContext;

const QSelectRoot: React.FC<SelectProps> = ({
  children,
  open,
  value,
  disabled,
  required,
  name,
  onOpenChange,
  onValueChange,
}: SelectProps) => {
  const [trigger, setTrigger] = useState<HTMLButtonElement>();
  const [unControlledOpen, setUnControlledOpen] = useState<boolean>(false);
  const [unControlledValue, setUnControlledValue] = useState<
    string | undefined
  >(undefined);
  const contentId = useRef<string>("");
  const [htmlNativeOptionList, setHtmlNativeOptionList] = useState<
    NativeOptionComponentProps[]
  >([]);
  const [hasValueContent, setHasValueContent] = useState<boolean>(false);
  const [valueNode, setValueNode] = useState<HTMLSpanElement>();
  const isControlled = !isUndefined(open);
  const isControlledValue = !isUndefined(value);

  const isOpen = isControlled ? open : unControlledOpen;
  const selectValue = isControlledValue ? value : unControlledValue;
  const handleOpenChange = isControlled ? onOpenChange : setUnControlledOpen;
  const handleValueChange = isControlledValue
    ? onValueChange
    : setUnControlledValue;
  const isUnderForm = !!trigger ? !!trigger.closest("form") : false;

  const handleOptionAdd = useCallback((option: NativeOptionComponentProps) => {
    setHtmlNativeOptionList((prev) => [...prev, option]);
  }, []);

  const handleOptionReset = useCallback(() => {
    setHtmlNativeOptionList([]);
  }, []);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      contentId.current = nanoid();
    }
  }, []);

  return (
    <QPopperRoot>
      <SelectRootProvider
        value={{
          open: isOpen,
          value: selectValue,
          disabled,
          required,
          trigger,
          valueNode,
          onValueNodeChange: setValueNode,
          onOpenChange: handleOpenChange,
          onValueChange: handleValueChange,
          onTriggerChange: setTrigger,
          contentId: contentId.current,
          hasValueContent,
          onHasValueContentChange: setHasValueContent,
        }}
      >
        <HtmlNativeOptionProvider
          value={{
            onOptionChange: handleOptionAdd,
            onOptionReset: handleOptionReset,
          }}
        >
          {children}
        </HtmlNativeOptionProvider>
      </SelectRootProvider>

      {isUnderForm ? (
        <select
          required={required}
          disabled={disabled}
          tabIndex={-1}
          value={value}
          name={name}
          style={{
            position: "absolute",
            border: "none",
            width: "1px",
            height: "1px",
            padding: "0px",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
          }}
        >
          {Array.from(htmlNativeOptionList)}
        </select>
      ) : null}
    </QPopperRoot>
  );
};

/************************************************************************************************/

interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "placeholder"> {
  placeholder?: ReactNode;
}

const QSelectTrigger: React.FC<SelectTriggerProps> = forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>((props, ref) => {
  const { disabled = false, placeholder, ...triggerProps } = props;
  const context = useSelectContext();
  const isDisabled = !!disabled || !!context?.disabled;
  const isNonSelected = isUndefined(context.value);

  const handleToggleOpen = () => {
    if (context && context.onOpenChange) {
      const nextOpenState = !context.open;
      context.onOpenChange(nextOpenState);
    }
  };

  const renderContent = () => {
    if (isNonSelected) {
      if (isUndefined(placeholder)) {
        return props.children;
      }
      return placeholder;
    }
    return props.children;
  };

  return (
    <QPopperAnchor>
      <button
        type="button"
        role="combobox"
        aria-controls={context.contentId}
        aria-expanded={context.open ? true : false}
        disabled={isDisabled}
        data-state={context.open ? "open" : "closed"}
        data-disabled={isDisabled}
        {...triggerProps}
        ref={(node) => {
          if (node && context.onTriggerChange) {
            context.onTriggerChange(node);
          }
          if (ref) {
            if (typeof ref === "function") {
              return ref(node);
            }
            ref.current = node;
          }
        }}
        onPointerDown={(e) => {
          handleToggleOpen();

          if (props.onPointerDown) {
            props.onPointerDown(e);
          }
        }}
        onKeyDown={(event: KeyboardEvent) => {
          const shouldOpen = SELECT_OPEN_KEY.includes(event.code);
          if (!shouldOpen) return;
          context?.onOpenChange?.(!context.open);
        }}
      >
        {renderContent()}
      </button>
    </QPopperAnchor>
  );
});

QSelectTrigger.displayName = "SelectTrigger";

/************************************************************************************************/

interface SelectValueProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "placeholder"> {
  placeholder?: ReactNode;
}

const QSelectValue: React.FC<SelectValueProps> = forwardRef<
  HTMLSpanElement,
  SelectValueProps
>((props, ref) => {
  const { placeholder, ...valueProps } = props;
  const context = useSelectContext();
  const isNonSelected = context.value === undefined;

  const renderContent = () => {
    if (isNonSelected) {
      if (placeholder !== undefined) {
        return placeholder;
      }
      return props.children;
    }
    return props.children;
  };

  return (
    <span
      ref={(node) => {
        if (ref) {
          if (typeof ref === "function") {
            ref(node);
          } else {
            ref.current = node;
          }
        }
        if (node) {
          context.onValueNodeChange?.(node);
        }
        context.onHasValueContentChange?.(!!props.children);
      }}
      {...valueProps}
    >
      {renderContent()}
    </span>
  );
});

QSelectValue.displayName = "SelectValue";

interface SelectContentProps
  extends Omit<PopperQuantumContentProps, "children">,
    HTMLAttributes<HTMLDivElement> {}

const QSelectContent: React.FC<SelectContentProps> = (props) => {
  const context = useSelectContext();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const animationName = useRef<string>();
  const transitionDurationRef = useRef<string>();
  const height = useRef<number>(0);
  const [isAnimationEnd, setIsAnimationEnd] = useState<boolean>(!context.open);
  const isCloseState = isAnimationEnd && !context.open;
  const [documentFragment, setDocumentFragment] = useState<DocumentFragment>();

  const { onOpenChange = () => {}, trigger } = context;

  useLayoutEffect(() => {
    const fragment = document.createDocumentFragment();
    setDocumentFragment(fragment);
  }, []);

  // 오픈 시
  useLayoutEffect(() => {
    if (node && context.open) {
      setIsAnimationEnd(false);
      const { animationName: originalAnimation, transitionDuration } =
        window.getComputedStyle(node);

      animationName.current = originalAnimation;
      transitionDurationRef.current = transitionDuration;
      node.style.animationName = "none";
      node.style.transitionDuration = "0s";

      const nodeHeight = node.getBoundingClientRect().height;
      height.current = nodeHeight;

      node.style.setProperty("--select-content-height", `${height.current}px`);
      node.style.animationName = animationName.current;
      node.style.transitionDuration = transitionDurationRef.current;
    }
  }, [node, context.open]);

  // 닫을 시
  useEffect(() => {
    const close = () => setIsAnimationEnd(true);

    if (!context.open && node) {
      node.style.animationName = "";
      node.style.transitionDuration = "";
      const { animationName: closeAnimationName } =
        window.getComputedStyle(node);

      if (closeAnimationName === "none") {
        close();
      }
      node.addEventListener("animationend", close);
      node.addEventListener("transitionend", close);
    }

    return () => {
      node?.removeEventListener("animationend", close);
      node?.removeEventListener("transitionend", close);
    };
  }, [context.open, node]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (
        trigger?.contains(event.target as Node) ||
        node?.contains(event.target as Node)
      ) {
        return;
      }
      onOpenChange(false);
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [node, trigger, onOpenChange]);

  return (
    <QPortal>
      {!isCloseState ? (
        <QPopperContent>
          <div
            ref={(node) => {
              setNode(node);
            }}
            data-state={context.open ? "open" : "closed"}
            {...props}
          />
        </QPopperContent>
      ) : documentFragment ? (
        ReactDOM.createPortal(
          <QPopperContent>
            <div
              ref={(node) => {
                setNode(node);
              }}
              data-state={context.open ? "open" : "closed"}
              {...props}
            />
          </QPopperContent>,
          documentFragment
        )
      ) : null}
    </QPortal>
  );
};

/************************************************************************************************/

interface SelectItemContextValueType {
  value: string;
  isSelected: boolean;
  textContent?: string;
  onTextContentChange?: (textContext: string) => void;
}

export const SelectItemContext = createContext<
  SelectItemContextValueType | undefined
>(undefined);

const { Provider: SelectItemContextProvider } = SelectItemContext;

/************************************************************************************************/

interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const QSelectItem: React.FC<SelectItemProps> = ({
  value,
  disabled,
  ...props
}) => {
  const [textContent, setTextContent] = useState<string>("");
  const context = useSelectContext();
  const nativeOptionContext = useNativeOptionContext();
  const { onOptionChange, onOptionReset } = nativeOptionContext;

  const nativeOption = useMemo(
    () => (
      <option value={value} key={value}>
        {textContent}
      </option>
    ),
    [value, textContent]
  );

  const isSelected = context.value === value;

  const handleValueChange = (value: string) => {
    const nextOpenState = !context.open;

    context.onValueChange?.(value);
    context.onOpenChange?.(nextOpenState);
  };

  useLayoutEffect(() => {
    onOptionChange(nativeOption);

    return () => onOptionReset();
    // 처음 렌더 한번만 해야하는 것
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SelectItemContextProvider
      value={{
        value,
        isSelected,
        textContent,
        onTextContentChange: setTextContent,
      }}
    >
      <div
        data-state={isSelected}
        aria-selected={isSelected}
        data-disabled={disabled}
        aria-disabled={disabled}
        onClick={(event) => {
          if (!isUndefined(props.onClick)) {
            props.onClick(event);
          }
          handleValueChange(value);
        }}
        {...props}
      />
    </SelectItemContextProvider>
  );
};

/************************************************************************************************/

interface SelectItemTextProps extends HTMLAttributes<HTMLSpanElement> {}

const QSelectItemText: React.FC<SelectItemTextProps> = forwardRef<
  HTMLSpanElement,
  SelectItemTextProps
>((props, ref) => {
  const { style, className, ...itemTextProps } = props;
  const context = useSelectContext();
  const itemContext = useSelectItemContext();

  return (
    <>
      <span
        ref={(node) => {
          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
          itemContext.onTextContentChange?.(node?.textContent ?? "");
        }}
        {...itemTextProps}
      />

      {context.valueNode && itemContext.isSelected && !context.hasValueContent
        ? ReactDOM.createPortal(
            <span style={{ pointerEvents: "none" }}>{props.children}</span>,
            context.valueNode
          )
        : null}
    </>
  );
});

QSelectItemText.displayName = "SelectItemText";

/************************************************************************************************/

interface SelectArrowProps extends PopperQuantumArrowProps {}

const QSelectArrow = forwardRef<HTMLSpanElement, SelectArrowProps>(
  (props, ref) => {
    return <QPopperArrow ref={ref} {...props} />;
  }
);

const Root = QSelectRoot;
const Trigger = QSelectTrigger;
const Content = QSelectContent;
const Item = QSelectItem;
const Value = QSelectValue;
const ItemText = QSelectItemText;
const Arrow = QSelectArrow;

export {
  QSelectRoot,
  QSelectTrigger,
  QSelectContent,
  QSelectItem,
  QSelectValue,
  QSelectItemText,
  QSelectArrow,
  //
  //
  //
  Root,
  Trigger,
  Content,
  Item,
  ItemText,
  Value,
  Arrow,
};
