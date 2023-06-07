import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  useComboboxContentContext,
  useComboboxItemContext,
  useComboboxRadioGroupContext,
  useComboboxRadioItemContext,
  useComboboxRootContext,
} from "./hooks";
import ReactDomPortal, { PortalProps } from "../PortalQuantum";
import { isUndefined } from "@/src/utils/is";
import useDebounce from "@/src/hooks/useDebounce";
import QFocusTrap from "../FocusTrapQuantum";
import {
  QPopperAnchor,
  QPopperArrow,
  PopperQuantumArrowProps,
  QPopperContent,
  PopperQuantumContentProps,
  QPopperRoot,
} from "../PopperQuantum";
import { createPortal } from "react-dom";
import { QRadioGroupItem, QRadioGroupRoot } from "../RadioGroupQuantum";
import {
  QCheckboxRoot,
  CheckboxRootProps,
  QCheckboxButton,
} from "../CheckboxQuantum";

type ComboboxRootContextValueType = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value: string[];
  valueText?: string[];
  onValueTextChange: React.Dispatch<React.SetStateAction<string[]>>;
  onValueChange?: (value: string[]) => void;
  valueNode?: HTMLSpanElement;
  onValueNodeChange: (node?: HTMLSpanElement) => void;
  hasValueChildren: boolean;
  onHasValueChildrenChange: (hasValueChildren: boolean) => void;
  searchInputNode?: HTMLInputElement;
  onSearchInputNodeChange: (searchInputNode?: HTMLInputElement) => void;
  searchValue?: string;
  onSearchValueChange: (searchValue: string) => void;
  trigger?: HTMLButtonElement;
  onTriggerChange: (trigger?: HTMLButtonElement) => void;
  disabled: boolean;
  contentId: string;
  type: "single" | "multiple";
};

interface ComboboxRootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  children?: ReactNode;
  disabled?: boolean;
  type?: "single" | "multiple";
}

export const ComboboxRootContext = createContext<
  ComboboxRootContextValueType | undefined
>(undefined);

const { Provider: ComboboxRootContextProvider } = ComboboxRootContext;

const QComboboxRoot = (props: ComboboxRootProps) => {
  const [unControlledOpen, setUnControlledOpen] = useState<boolean>(false);
  const [unContolledValue, setUnControlledValue] = useState<string[]>([]);
  const [valueNode, setValueNode] = useState<HTMLSpanElement>();
  const [valueText, setValueText] = useState<string[]>([]);
  const [hasValueChildren, setHasValueChildren] = useState<boolean>(false);
  const [trigger, setTrigger] = useState<HTMLButtonElement>();
  const [searchNode, setSearchNode] = useState<HTMLInputElement>();
  const [searchValue, setSearchValue] = useState<string>("");

  const open = isUndefined(props.open) ? unControlledOpen : props.open;
  const value = isUndefined(props.value) ? unContolledValue : props.value;
  const onOpenChange = isUndefined(props.onOpenChange)
    ? setUnControlledOpen
    : props.onOpenChange;
  const onValueChange = isUndefined(props.onValueChange)
    ? setUnControlledValue
    : props.onValueChange;

  return (
    <QPopperRoot>
      <ComboboxRootContextProvider
        value={{
          open,
          value,
          onOpenChange,
          onValueChange,
          valueNode,
          valueText,
          onValueTextChange: setValueText,
          onValueNodeChange: setValueNode,
          hasValueChildren,
          onHasValueChildrenChange: setHasValueChildren,
          searchInputNode: searchNode,
          onSearchInputNodeChange: setSearchNode,
          searchValue,
          onSearchValueChange: setSearchValue,
          trigger: trigger,
          onTriggerChange: setTrigger,
          disabled: !!props.disabled,
          contentId: useId(),
          type: props.type ?? "single",
        }}
      >
        {props.children}
      </ComboboxRootContextProvider>
    </QPopperRoot>
  );
};

interface ComboboxTriggerProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

const QComboboxTrigger = forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  (props, ref) => {
    const context = useComboboxRootContext();

    return (
      <QPopperAnchor>
        <button
          ref={(node) => {
            if (node) {
              context.onTriggerChange(node);
              if (ref) {
                if (typeof ref === "function") {
                  ref(node);
                } else {
                  ref.current = node;
                }
              }
            }
          }}
          type="button"
          aria-expanded={context.open}
          aria-haspopup="menu"
          data-state={context.open ? "open" : "closed"}
          aria-disabled={context.disabled}
          data-disabled={context.disabled}
          {...props}
          onPointerDown={(e) => {
            context.onOpenChange?.(!context.open);
            props.onPointerDown?.(e);
          }}
        />
      </QPopperAnchor>
    );
  }
);

interface ComboboxValueProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "placeholder"> {
  placeholder?: ReactNode;
  children?:
    | ReactNode
    | (({ value, text }: { value: string[]; text?: string[] }) => JSX.Element);
}

const QComboboxValue = forwardRef<HTMLSpanElement, ComboboxValueProps>(
  (props, ref) => {
    const context = useComboboxRootContext();
    const hasChildren = !isUndefined(props.children);
    const { placeholder, children, ...restProps } = props;

    const { onHasValueChildrenChange } = context;

    useLayoutEffect(() => {
      onHasValueChildrenChange(hasChildren);
    }, [hasChildren, onHasValueChildrenChange]);

    if (typeof children === "function") {
      if (
        (isUndefined(context.value) || !context.value.length) &&
        placeholder
      ) {
        return <>{placeholder}</>;
      }
      return children({ value: context.value, text: context.valueText });
    }

    const renderContent = () => {
      if (
        (isUndefined(context.value) || !context.value.length) &&
        placeholder
      ) {
        return <>{placeholder}</>;
      }
      return <>{children}</>;
    };

    return (
      <span
        ref={(node) => {
          if (node) {
            context.onValueNodeChange(node);
            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }
        }}
        style={{ pointerEvents: "none" }}
        {...restProps}
      >
        {renderContent()}
      </span>
    );
  }
);

interface ComboboxSearchInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {}

const QComboboxSearchInput = forwardRef<
  HTMLInputElement,
  ComboboxSearchInputProps
>((props, ref) => {
  const {
    onSearchValueChange,
    open,
    contentId,
    disabled,
    onSearchInputNodeChange,
  } = useComboboxRootContext();
  const [value, setValue] = useState<string>("");
  const debounce = useDebounce({ value });

  useEffect(() => {
    onSearchValueChange(debounce);
  }, [debounce, onSearchValueChange]);

  return (
    <input
      type="text"
      role="combobox"
      aria-expanded={open}
      aria-controls={contentId}
      aria-disabled={disabled}
      data-disabled={disabled}
      data-state={open ? "open" : "closed"}
      value={value}
      ref={(node) => {
        if (node) {
          onSearchInputNodeChange(node);

          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }
      }}
      {...props}
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange?.(e);
      }}
    />
  );
});

interface ComboboxPortalProps extends PortalProps {}

const QComboboxPortal = (props: ComboboxPortalProps) => {
  return <ReactDomPortal {...props} />;
};

interface ComboboxContentProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
    Omit<PopperQuantumContentProps, "children"> {
  destroyWhenValueChange?: boolean;
}

type ComboboxContentContextType = {
  destroyWhenValueChange: boolean;
};

export const ComboboxContentContext = createContext<
  ComboboxContentContextType | undefined
>(undefined);

const { Provider: ComboboxContentContextProvider } = ComboboxContentContext;

const QComboboxContent = forwardRef<HTMLDivElement, ComboboxContentProps>(
  (props, ref) => {
    const { trigger, onOpenChange, open, searchValue } =
      useComboboxRootContext();
    const animationNameRef = useRef<string>();
    const transitionDurationRef = useRef<string>();
    const heightRef = useRef<number>(0);
    const prevOpenValue = useRef<boolean>(!!open);
    const [fragment, setFragment] = useState<DocumentFragment>();
    const [node, setNode] = useState<HTMLDivElement>();

    const {
      offset,
      position,
      hideWhenAnchorDisappear,
      detectPadding,
      destroyWhenValueChange,
      ...restProps
    } = props;

    const [animationState, setAnimationState] = useState<"action" | "end">(
      "end"
    );
    const isClose = animationState === "end" && !open;
    useEffect(() => {
      const listener = (event: MouseEvent) => {
        if (
          trigger?.contains(event.target as Node) ||
          node?.contains(event.target as Node)
        ) {
          return;
        }
        onOpenChange?.(false);
      };

      document.addEventListener("mousedown", listener);
      if (!open) {
        document.removeEventListener("mousedown", listener);
      }
      return () => {
        document.removeEventListener("mousedown", listener);
      };
    }, [node, onOpenChange, trigger, open]);

    useLayoutEffect(() => {
      const documentFragment = document.createDocumentFragment();
      setFragment(documentFragment);
    }, []);

    useLayoutEffect(() => {
      if (node && open) {
        const { animation, transitionDuration } = window.getComputedStyle(node);

        if (open && animation === "" && transitionDuration === "") {
          setAnimationState("end");
        } else {
          setAnimationState("action");
        }

        animationNameRef.current = animation;
        transitionDurationRef.current = transitionDuration;

        node.style.animationName = "none";
        node.style.transitionDuration = "0s";

        const height = node.getBoundingClientRect().height;
        heightRef.current = height;

        node.style.setProperty(
          "--combobox-content-height",
          `${heightRef.current}px`
        );

        node.style.animation = animationNameRef.current ?? "";
        node.style.transitionDuration = transitionDurationRef.current ?? "";
      }
    }, [open, node]);

    useLayoutEffect(() => {
      if (node && open === true && open === prevOpenValue.current) {
        node.style.animationName = "none";
        node.style.transitionDuration = "0s";

        const height = node.getBoundingClientRect().height;
        heightRef.current = height;
        node.style.setProperty(
          "--combobox-content-height",
          `${heightRef.current}px`
        );
      }

      prevOpenValue.current = !!open;

      return () => {
        if (node && open === true && open === prevOpenValue.current) {
          node.style.animation = animationNameRef.current ?? "";
          node.style.transitionDuration = transitionDurationRef.current ?? "";
        }
      };
      // node set되면서 리렌더 이슈
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, searchValue]);

    useEffect(() => {
      const close = () => setAnimationState("end");

      if (!open && node) {
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
    }, [open, node]);

    return (
      <ComboboxContentContextProvider
        value={{ destroyWhenValueChange: destroyWhenValueChange ?? true }}
      >
        {!isClose ? (
          <>
            <QFocusTrap>
              <QPopperContent
                offset={offset}
                position={position}
                hideWhenAnchorDisappear={hideWhenAnchorDisappear}
                detectPadding={detectPadding}
                ref={setNode}
              >
                <div
                  role="menu"
                  data-state={open ? "open" : "closed"}
                  ref={ref}
                  {...restProps}
                />
              </QPopperContent>
            </QFocusTrap>
          </>
        ) : fragment ? (
          createPortal(
            <QFocusTrap>
              <QPopperContent
                offset={offset}
                position={position}
                hideWhenAnchorDisappear={hideWhenAnchorDisappear}
                detectPadding={detectPadding}
              >
                <div
                  role="menu"
                  data-state={open ? "open" : "closed"}
                  ref={ref}
                  {...restProps}
                />
              </QPopperContent>
            </QFocusTrap>,
            fragment
          )
        ) : null}
      </ComboboxContentContextProvider>
    );
  }
);

type ComboboxItemContextType = {
  value?: string;
  onValueChange?: (value?: string[]) => void;
  isSelected: boolean;
  text?: string[];
  onTextChange: (text?: string[]) => void;
  disabled?: boolean;
};

export const ComboboxItemContext = createContext<
  ComboboxItemContextType | undefined
>(undefined);

const { Provider: ComboboxItemContextProvider } = ComboboxItemContext;

interface ComboboxItemProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  disabled?: boolean;
  value: string;
}

const QComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(
  (props, ref) => {
    const context = useComboboxRootContext();
    const contentContext = useComboboxContentContext();
    const { disabled = false, value, onClick, ...restProps } = props;
    const [itemText, setItemText] = useState<string[]>([]);
    const [fragment, setFragment] = useState<DocumentFragment>();
    const isSelected = value ? context.value.includes(value) : false;
    const hasSearchNode = !!context.searchInputNode;
    const isNotSearched =
      hasSearchNode &&
      context.searchValue &&
      !itemText
        ?.toString()
        .toLowerCase()
        .includes(context.searchValue.toLowerCase());

    const handleClick = () => {
      if (context.onValueChange) {
        if (context.type === "multiple") {
          if (context.value.includes(value)) {
            const reducedValueList = context.value.filter(
              (item) => item !== value
            );
            context.onValueChange(reducedValueList);
          } else {
            context.onValueChange([...context.value, value]);
          }
        } else {
          context.onValueChange([value]);
        }
      }

      if (contentContext.destroyWhenValueChange) {
        context.onOpenChange?.(false);
      }
    };

    const handleTextChange = useCallback((text?: string[]) => {
      if (!text) return;

      setItemText((prev) => {
        const set = new Set([...prev, ...text]);
        const removedDuplicate = Array.from(set);
        return removedDuplicate;
      });
    }, []);

    useLayoutEffect(() => {
      const documentFragment = document.createDocumentFragment();
      setFragment(documentFragment);
    }, []);

    return (
      <ComboboxItemContextProvider
        value={{
          value,
          isSelected,
          text: itemText,
          onTextChange: handleTextChange,
          disabled,
        }}
      >
        {!isNotSearched ? (
          <div
            role="menuitem"
            ref={ref}
            aria-disabled={disabled || context.disabled}
            data-disabled={disabled || context.disabled}
            data-selected={isSelected}
            onClick={(e) => {
              handleClick();
              onClick?.(e);
            }}
            {...restProps}
          />
        ) : fragment ? (
          createPortal(props.children, fragment)
        ) : null}
      </ComboboxItemContextProvider>
    );
  }
);

interface ComboboxItemTextProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  children?: string;
  hiddenText?: string[];
}

const QComboboxItemText = forwardRef<HTMLSpanElement, ComboboxItemTextProps>(
  (props, ref) => {
    const { onValueTextChange, valueNode, hasValueChildren } =
      useComboboxRootContext();
    const { onTextChange, isSelected, disabled } = useComboboxItemContext();

    useLayoutEffect(() => {
      if (props.children) {
        onTextChange([props.children]);
      }

      if (props.hiddenText) {
        onTextChange(props.hiddenText);
      }
    }, [onTextChange, props.children, props.hiddenText]);

    useLayoutEffect(() => {
      if (props.children) {
        if (isSelected) {
          onValueTextChange((prev) => {
            if (!prev.includes(props.children as string)) {
              return [...prev, props.children as string];
            }

            return prev;
          });
        } else {
          onValueTextChange((prev) =>
            prev.filter((text) => text !== props.children)
          );
        }
      }
    }, [isSelected, onValueTextChange, props.children]);

    return (
      <>
        <span
          ref={ref}
          aria-disabled={disabled}
          data-disabled={disabled}
          {...props}
        />

        {valueNode && isSelected && !hasValueChildren
          ? createPortal(
              <span style={{ pointerEvents: "none" }}>{props.children}</span>,
              valueNode
            )
          : null}
      </>
    );
  }
);

interface ComboboxCheckboxRootProps
  extends Omit<CheckboxRootProps, "onCheckedChange" | "checked">,
    HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  className?: string;
}

const QComboboxCheckboxRoot = (props: ComboboxCheckboxRootProps) => {
  const context = useComboboxRootContext();
  const contentContext = useComboboxContentContext();
  const { value, disabled, children, ...restProps } = props;
  const hasSearchNode = !!context.searchInputNode;
  const isSelected = context.value.includes(props.value);
  const [itemText, setItemText] = useState<string[]>([]);
  const [fragment, setFragment] = useState<DocumentFragment>();
  const isNotSearched =
    hasSearchNode &&
    context.searchValue &&
    !itemText
      ?.toString()
      .toLowerCase()
      .includes(context.searchValue.toLowerCase());

  const handleValueChange = () => {
    if (context.onValueChange) {
      if (context.value.includes(value)) {
        const reducedValueList = context.value.filter((item) => item !== value);
        context.onValueChange(reducedValueList);
      } else {
        context.onValueChange([...context.value, value]);
      }
    }

    if (contentContext.destroyWhenValueChange) {
      context.onOpenChange?.(false);
    }
  };

  const handleTextChange = useCallback((text?: string[]) => {
    if (!text) return;

    setItemText((prev) => {
      const set = new Set([...prev, ...text]);
      const removedDuplicate = Array.from(set);
      return removedDuplicate;
    });
  }, []);

  useLayoutEffect(() => {
    const documentFragment = document.createDocumentFragment();
    setFragment(documentFragment);
  }, []);

  return (
    <ComboboxItemContextProvider
      value={{
        value: value,
        onValueChange: handleValueChange,
        isSelected,
        text: itemText,
        onTextChange: handleTextChange,
        disabled,
      }}
    >
      {!isNotSearched ? (
        <div
          role="menuitem"
          className={props.className}
          {...restProps}
          aria-disabled={disabled}
          data-disabled={disabled}
        >
          <QCheckboxRoot
            checked={isSelected}
            onCheckedChange={handleValueChange}
          >
            {children}
          </QCheckboxRoot>
        </div>
      ) : fragment ? (
        createPortal(
          <div
            role="menuitem"
            className={props.className}
            {...restProps}
            aria-disabled={disabled}
            data-disabled={disabled}
          >
            <QCheckboxRoot
              checked={isSelected}
              onCheckedChange={handleValueChange}
            >
              {children}
            </QCheckboxRoot>
          </div>,
          fragment
        )
      ) : null}
    </ComboboxItemContextProvider>
  );
};

interface ComboboxCheckboxButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

const QComboboxCheckboxButton = forwardRef<
  HTMLButtonElement,
  ComboboxCheckboxButtonProps
>((props, ref) => {
  const { value, disabled: propsDisabled, ...restProps } = props;
  const { disabled } = useComboboxItemContext();

  return (
    <QCheckboxButton
      aria-disabled={disabled || propsDisabled}
      data-disabled={disabled || propsDisabled}
      ref={ref}
      {...restProps}
      role="menuitemcheckbox"
    />
  );
});

interface CheckboxItemTextProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  children?: string;
  hiddenText?: string[];
}

const QComboboxCheckboxText = forwardRef<
  HTMLSpanElement,
  CheckboxItemTextProps
>((props, ref) => {
  const { onValueTextChange, valueNode, hasValueChildren } =
    useComboboxRootContext();
  const { onTextChange, isSelected, disabled } = useComboboxItemContext();

  useLayoutEffect(() => {
    if (props.children) {
      onTextChange([props.children]);
    }
    if (props.hiddenText) {
      onTextChange(props.hiddenText);
    }
  }, [props.children, onTextChange, props.hiddenText]);

  useLayoutEffect(() => {
    if (props.children) {
      if (isSelected) {
        onValueTextChange((prev) => {
          if (!prev.includes(props.children as string)) {
            return [...prev, props.children as string];
          }

          return prev;
        });
      } else {
        onValueTextChange((prev) =>
          prev.filter((item) => item !== props.children)
        );
      }
    }
  }, [isSelected, onValueTextChange, props.children]);

  return (
    <>
      <span
        ref={ref}
        aria-disabled={disabled}
        data-disabled={disabled}
        {...props}
      />

      {valueNode && isSelected && !hasValueChildren
        ? createPortal(
            <span style={{ pointerEvents: "none" }}>{props.children}</span>,
            valueNode
          )
        : null}
    </>
  );
});

interface ComboboxRadioGroupProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  name?: string;
  disabled?: boolean;
  required?: boolean;
}

type ComboboxRadioGroupContextValueType = {
  disabled: boolean;
  required: boolean;
  name?: string;
};

export const ComboboxRadioGroupContext = createContext<
  ComboboxRadioGroupContextValueType | undefined
>(undefined);

const { Provider: ComboboxRadioGroupContextProvider } =
  ComboboxRadioGroupContext;

const QComboboxRadioGroup = forwardRef<HTMLDivElement, ComboboxRadioGroupProps>(
  (props, forwardedRef) => {
    const { ref, ...restProps } = props;
    const context = useComboboxRootContext();
    const contentContext = useComboboxContentContext();

    const handleChange = (value: string) => {
      if (value) {
        context.onValueChange?.([value]);
      }

      if (contentContext.destroyWhenValueChange) {
        context.onOpenChange?.(!context.open);
      }
    };

    return (
      <ComboboxRadioGroupContextProvider
        value={{
          disabled: !!props.disabled,
          required: !!props.required,
          name: props.name,
        }}
      >
        <QRadioGroupRoot
          value={context.value[0]}
          onValueChange={(value) => (value ? handleChange(value) : () => {})}
          ref={forwardedRef}
          {...restProps}
        />
      </ComboboxRadioGroupContextProvider>
    );
  }
);

interface ComboboxRadioGroupItemProps {
  value: string;
  disabled?: boolean;
  required?: boolean;
  children?: ReactNode;
}

type ComboboxRadioItemContextValueType = {
  value: string;
  disabled: boolean;
  required: boolean;
  isSelected: boolean;
  text?: string[];
  onTextChange?: (text?: string[]) => void;
};

export const ComboboxRadioItemContext = createContext<
  ComboboxRadioItemContextValueType | undefined
>(undefined);

const QComboboxRadioItem = (props: ComboboxRadioGroupItemProps) => {
  const context = useComboboxRootContext();
  const groupContext = useComboboxRadioGroupContext();
  const [fragment, setFragment] = useState<DocumentFragment>();
  const [text, setText] = useState<string[]>([]);
  const hasSearchNode = !!context.searchInputNode;
  const isNotSearched =
    hasSearchNode &&
    context.searchValue &&
    !text?.toString().toLowerCase().includes(context.searchValue.toLowerCase());

  useLayoutEffect(() => {
    const documentFragment = document.createDocumentFragment();
    setFragment(documentFragment);
  }, []);

  const handleTextChange = useCallback((text?: string[]) => {
    if (!text) return;
    setText((prev) => {
      const set = new Set([...prev, ...text]);
      const removedDuplicate = Array.from(set);
      return removedDuplicate;
    });
  }, []);

  return (
    <ComboboxRadioItemContext.Provider
      value={{
        value: props.value,
        disabled: !!props.disabled || groupContext.disabled,
        required: !!props.required || groupContext.required,
        isSelected: props.value === context.value[0],
        text,
        onTextChange: handleTextChange,
      }}
    >
      {!isNotSearched ? (
        <>{props.children}</>
      ) : fragment ? (
        createPortal(<>{props.children}</>, fragment)
      ) : null}
    </ComboboxRadioItemContext.Provider>
  );
};

interface ComboboxRadioItemButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

const QComboboxRadioItemButton = forwardRef<
  HTMLButtonElement,
  ComboboxRadioItemButtonProps
>((props, forwaredRef) => {
  const { value: itemValue, disabled } = useComboboxRadioItemContext();
  const { ref, value, ...restProps } = props;

  return (
    <QRadioGroupItem
      ref={forwaredRef}
      value={itemValue}
      disabled={disabled || props.disabled}
      {...restProps}
    />
  );
});

interface ComboboxRadioItemTextProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  children?: string;
  hiddenText?: string[];
}

const QComboboxRadioItemText = forwardRef<
  HTMLSpanElement,
  ComboboxRadioItemTextProps
>((props, ref) => {
  const { onValueTextChange, valueNode, hasValueChildren } =
    useComboboxRootContext();
  const { isSelected, onTextChange, disabled } = useComboboxRadioItemContext();

  useLayoutEffect(() => {
    if (props.children) {
      onTextChange?.([props.children]);
    }

    if (props.hiddenText) {
      onTextChange?.(props.hiddenText);
    }
  }, [onTextChange, props.children, props.hiddenText]);

  useLayoutEffect(() => {
    if (isSelected && props.children) {
      onValueTextChange([props.children]);
    }
  }, [isSelected, onValueTextChange, props.children]);

  return (
    <>
      <span
        ref={ref}
        aria-disabled={disabled}
        data-disabled={disabled}
        {...props}
      />

      {valueNode && isSelected && !hasValueChildren
        ? createPortal(
            <span style={{ pointerEvents: "none" }}>{props.children}</span>,
            valueNode
          )
        : null}
    </>
  );
});

const QComboboxArrow = forwardRef<HTMLSpanElement, PopperQuantumArrowProps>(
  (props, ref) => {
    return <QPopperArrow ref={ref} {...props} />;
  }
);

const Root = QComboboxRoot;
const Trigger = QComboboxTrigger;
const Value = QComboboxValue;
const SearchInput = QComboboxSearchInput;
const Portal = QComboboxPortal;
const Content = QComboboxContent;
const Item = QComboboxItem;
const ItemText = QComboboxItemText;
const CheckboxRoot = QComboboxCheckboxRoot;
const Checkbox = QComboboxCheckboxButton;
const CheckboxText = QComboboxCheckboxText;
const RadioGroup = QComboboxRadioGroup;
const RadioItem = QComboboxRadioItem;
const RadioItemButton = QComboboxRadioItemButton;
const RadioItemText = QComboboxRadioItemText;
const Arrow = QComboboxArrow;

export {
  QComboboxRoot,
  QComboboxTrigger,
  QComboboxValue,
  QComboboxSearchInput,
  QComboboxPortal,
  QComboboxContent,
  QComboboxItem,
  QComboboxItemText,
  QComboboxCheckboxRoot,
  QComboboxCheckboxButton,
  QComboboxCheckboxText,
  QComboboxRadioGroup,
  QComboboxRadioItem,
  QComboboxRadioItemButton,
  QComboboxRadioItemText,
  QComboboxArrow,
  //
  //
  //
  Root,
  Trigger,
  Value,
  SearchInput,
  Portal,
  Content,
  Item,
  ItemText,
  CheckboxRoot,
  Checkbox,
  CheckboxText,
  RadioGroup,
  RadioItem,
  RadioItemButton,
  RadioItemText,
  Arrow,
};
