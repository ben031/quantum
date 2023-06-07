import {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  cloneElement,
  createContext,
  forwardRef,
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import {
  Placement,
  arrow as floatingArrow,
  autoUpdate,
  flip,
  hide,
  limitShift,
  offset,
  shift,
  useFloating,
  Side,
} from "@floating-ui/react-dom";
import { usePopperContentContext } from "./hooks";

type PopperContextValue = {
  anchor?: ReactElement;
  onAnchorChange?: (anchor: ReactElement) => void;
};

const PopperContext = createContext<PopperContextValue | undefined>(undefined);

const { Provider: PopperContextProvider } = PopperContext;

const QPopperRoot = ({ children }: { children?: ReactNode }) => {
  const [anchor, setAnchor] = useState<ReactElement>();

  return (
    <PopperContextProvider
      value={{
        anchor,
        onAnchorChange: setAnchor,
      }}
    >
      {children}
    </PopperContextProvider>
  );
};

const usePopperContext = () => {
  const context = useContext(PopperContext);

  if (context === undefined) {
    throw Error("Popper Root 안에서 사용하세요");
  }

  return context;
};

const QPopperAnchor = ({ children }: { children: ReactElement }) => {
  const { onAnchorChange } = usePopperContext();

  return cloneElement(children, {
    ref: (node: ReactElement) => {
      onAnchorChange?.(node);

      if (!(children as any).ref) return;

      if (typeof (children as any).ref === "function") {
        (children as any).ref(node);
      } else {
        (children as any).ref.current = node;
      }
    },
  });
};

type PopperPositionType = Placement;

export interface PopperQuantumContentProps {
  children?: ReactElement;
  position?: PopperPositionType;
  offset?: number;
  detectPadding?: number;
  hideWhenAnchorDisappear?: boolean;
  hasArrow?: boolean;
}

const DEFAULT_OFFSET = 10;

type PopperContentContextValueType = {
  arrowX: number;
  arrowY: number;
  onArrowChange: (element: HTMLSpanElement) => void;
  placement: Side;
};

export const PopperContentContext = createContext<
  PopperContentContextValueType | undefined
>(undefined);

const { Provider: PopperContentProvider } = PopperContentContext;

const QPopperContent = forwardRef<any, PopperQuantumContentProps>(
  (
    {
      children,
      position = "bottom-start",
      hideWhenAnchorDisappear = false,
      detectPadding = DEFAULT_OFFSET,
      offset: popperOffset = DEFAULT_OFFSET,
      hasArrow = true,
    },
    forwardedRef
  ) => {
    const { anchor } = usePopperContext();
    const [arrow, setArrow] = useState<HTMLSpanElement>();

    const { strategy, y, x, refs, middlewareData, placement } = useFloating({
      placement: position,
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(popperOffset),
        flip({ crossAxis: false, padding: detectPadding }),
        shift({ padding: detectPadding, limiter: limitShift() }),
        hasArrow && arrow
          ? floatingArrow({
              element: arrow,
            })
          : undefined,
        hideWhenAnchorDisappear && hide(),
      ],
    });
    const { setReference } = refs;

    useLayoutEffect(() => {
      if (anchor) {
        setReference(anchor as unknown as Element);
      }
    }, [setReference, anchor]);

    return children ? (
      <PopperContentProvider
        value={{
          onArrowChange: setArrow,
          arrowX: middlewareData.arrow?.x ?? 0,
          arrowY: middlewareData.arrow?.y ?? 0,
          placement: placement.split("-")[0] as Side,
        }}
      >
        {cloneElement(children, {
          style: {
            ...children.props.style,
            position: x && y ? strategy : "fixed",
            left: x,
            top: y,
            minWidth: "max-content",
            opacity: middlewareData.hide?.referenceHidden ? 0 : undefined,
          },
          ref: (node: ReactElement) => {
            refs.setFloating(node as unknown as HTMLElement);

            if (forwardedRef) {
              if (typeof forwardRef === "function") {
                (forwardedRef as any)(node);
              } else {
                (forwardedRef as any).current = node;
              }
            }

            if (!(children as any).ref) return;

            if (typeof (children as any).ref === "function") {
              (children as any).ref(node);
            } else {
              (children as any).ref.current = node;
            }
          },
        })}
      </PopperContentProvider>
    ) : null;
  }
);

export interface PopperQuantumArrowProps
  extends HTMLAttributes<HTMLSpanElement> {
  xOffset?: number;
  yOffset?: number;
}

const QPopperArrow = forwardRef<HTMLSpanElement, PopperQuantumArrowProps>(
  (props, ref) => {
    const context = usePopperContentContext();
    const { style, xOffset = 0, yOffset = 0, ...restProps } = props;

    const getStyle = (side: Side) => {
      switch (side) {
        case "top":
          return {
            bottom: 0,
            left: context.arrowX + xOffset,
            transform: "rotate(180deg)",
            transformOrigin: "center 100%",
          };
        case "bottom":
          return {
            top: 0,
            left: context.arrowX + xOffset,
            transform: "translateY(-100%)",
          };
        case "left":
          return {
            top: context.arrowY + yOffset,
            right: 0,
            transform: "translateX(100%) rotate(90deg) translateY(50%)",
          };
        case "right":
          return {
            top: context.arrowY + yOffset,
            left: 0,
            transform: "translateX(-100%) rotate(-90deg) translateY(50%)",
          };
        default:
          return {};
      }
    };

    const arrowStyle: CSSProperties = {
      ...style,
      position: "absolute",
      ...getStyle(context.placement),
    };

    return (
      <span
        ref={(node) => {
          if (node) {
            context.onArrowChange(node);
          }

          if (node && ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        style={arrowStyle}
        {...restProps}
      />
    );
  }
);

const Root = QPopperRoot;
const Anchor = QPopperAnchor;
const Content = QPopperContent;
const Arrow = QPopperArrow;

export {
  Root,
  Anchor,
  Arrow,
  Content,
  //
  //
  //
  QPopperRoot,
  QPopperAnchor,
  QPopperArrow,
  QPopperContent,
};
