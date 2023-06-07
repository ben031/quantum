import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  HTMLAttributes,
  ReactNode,
  createContext,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { isUndefined } from "@/src/utils/is";
import { useAlertDialogRootContext } from "./hooks";
import ReactDomPortal, { PortalProps } from "../PortalQuantum";
import { Undo, hideOthers } from "aria-hidden";
import QFocusTrap from "../FocusTrapQuantum";

type AlertDialogRootContextValueType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AlertDialogRootContext = createContext<
  AlertDialogRootContextValueType | undefined
>(undefined);

const { Provider: AlertDialogRootProvider } = AlertDialogRootContext;

interface AlertDialogRootProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QAlertDialogRoot: React.FC<AlertDialogRootProps> = (props) => {
  const [unControlledOpen, setUnControlledOpen] = useState<boolean>(false);
  const open = isUndefined(props.open) ? unControlledOpen : props.open;
  const setOpen = isUndefined(props.onOpenChange)
    ? setUnControlledOpen
    : props.onOpenChange;

  return (
    <AlertDialogRootProvider value={{ open, onOpenChange: setOpen }}>
      {props.children}
    </AlertDialogRootProvider>
  );
};

interface AlertDialogTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

const QAlertDialogTrigger = forwardRef<
  HTMLButtonElement,
  AlertDialogTriggerProps
>((props, ref) => {
  const context = useAlertDialogRootContext();

  const toggle = () => {
    context.onOpenChange(!context.open);
  };

  return (
    <button
      type="button"
      ref={ref}
      {...props}
      onPointerUp={(e) => {
        toggle();
        props.onPointerUp?.(e);
      }}
    />
  );
});

interface AlertDialogPortalProps extends PortalProps {}

const QAlertDialogPortal = (props: AlertDialogPortalProps) => {
  return <ReactDomPortal {...props} />;
};

interface AlertDialogOverlayProps extends HTMLAttributes<HTMLDivElement> {
  destroyDialog?: boolean;
}

const QAlertDialogOverlay = forwardRef<HTMLDivElement, AlertDialogOverlayProps>(
  (props, ref) => {
    const context = useAlertDialogRootContext();
    const { destroyDialog = true, ...restProps } = props;

    if (!context.open) return null;

    return (
      <div
        aria-hidden
        data-state={context.open ? "open" : "closed"}
        onClick={() => {
          if (destroyDialog) {
            context.onOpenChange(false);
          }
        }}
        ref={ref}
        {...restProps}
      />
    );
  }
);

interface AlertDialogContentProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const QAlertDialogContent = forwardRef<HTMLDivElement, AlertDialogContentProps>(
  (props, ref) => {
    const nodeRef = useRef<HTMLDivElement>();
    const hideOthersRef = useRef<Undo>();
    const { open, onOpenChange } = useAlertDialogRootContext();

    useEffect(() => {
      if (nodeRef.current && open) {
        hideOthersRef.current = hideOthers(nodeRef.current);
      }
    }, [open]);

    useEffect(() => {
      if (!open) {
        hideOthersRef.current?.();
      }
    }, [open]);

    useEffect(() => {
      const listener = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onOpenChange(false);
        }
      };

      document?.addEventListener("keydown", listener);

      if (!open) {
        document?.removeEventListener("keydown", listener);
      }
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <QFocusTrap>
        <div
          role="alertdialog"
          data-state={open ? "open" : "closed"}
          aria-modal={open}
          ref={(node) => {
            if (!node) return;

            nodeRef.current = node;

            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          {...props}
        />
      </QFocusTrap>
    );
  }
);

interface AlertDialogTitleProps
  extends DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  > {}

const QAlertDialogTitle = forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  (props, ref) => {
    return (
      <h1 ref={ref} {...props}>
        {props.children}
      </h1>
    );
  }
);

interface AlertDialogDescriptionProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const QAlertDialogDescription = forwardRef<
  HTMLDivElement,
  AlertDialogDescriptionProps
>((props, ref) => {
  return <div ref={ref} {...props} />;
});

interface AlertDialogCloseButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

const QAlertDialogCloseButton = forwardRef<
  HTMLButtonElement,
  AlertDialogCloseButtonProps
>((props, ref) => {
  const context = useAlertDialogRootContext();
  return (
    <button
      type="button"
      ref={ref}
      {...props}
      onClick={(e) => {
        context.onOpenChange(false);
        props.onClick?.(e);
      }}
    />
  );
});

const Root = QAlertDialogRoot;
const Trigger = QAlertDialogTrigger;
const Portal = QAlertDialogPortal;
const Overlay = QAlertDialogOverlay;
const Content = QAlertDialogContent;
const Title = QAlertDialogTitle;
const CloseButton = QAlertDialogCloseButton;
const Description = QAlertDialogDescription;

export {
  QAlertDialogRoot,
  QAlertDialogTrigger,
  QAlertDialogPortal,
  QAlertDialogOverlay,
  QAlertDialogContent,
  QAlertDialogTitle,
  QAlertDialogCloseButton,
  QAlertDialogDescription,
  //
  //
  //
  Root,
  Trigger,
  Portal,
  Overlay,
  Content,
  Title,
  CloseButton,
  Description,
};
