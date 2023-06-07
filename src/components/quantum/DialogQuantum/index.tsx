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
import { isUndefined } from "../../../utils/is";
import ReactDomPortal, { PortalProps } from "../PortalQuantum/index";
import { useDialogRootContext } from "./hooks";
import QFocusTrap from "../FocusTrapQuantum";
import { Undo, hideOthers } from "aria-hidden";

type DialogRootContextValueType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentNode?: HTMLDivElement;
  onContentNodeChange: (node?: HTMLDivElement) => void;
  trigger?: HTMLButtonElement;
  onTriggerChange: (trigger?: HTMLButtonElement) => void;
};

export const DialogRootContext = createContext<
  DialogRootContextValueType | undefined
>(undefined);

const { Provider: DialogRootProvider } = DialogRootContext;

interface DialogRootProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QDialogRoot: React.FC<DialogRootProps> = (props) => {
  const [unControlledOpen, setUnControlledOpen] = useState<boolean>(false);
  const [contentNode, setContentNode] = useState<HTMLDivElement>();
  const [trigger, setTrigger] = useState<HTMLButtonElement>();
  const open = isUndefined(props.open) ? unControlledOpen : props.open;
  const setOpen = isUndefined(props.onOpenChange)
    ? setUnControlledOpen
    : props.onOpenChange;

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (
        contentNode?.contains(event.target as Node) ||
        trigger?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [contentNode, setOpen, trigger]);

  return (
    <DialogRootProvider
      value={{
        open,
        onOpenChange: setOpen,
        contentNode,
        onContentNodeChange: setContentNode,
        trigger,
        onTriggerChange: setTrigger,
      }}
    >
      {props.children}
    </DialogRootProvider>
  );
};

interface DialogTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const QDialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  (props, ref) => {
    const context = useDialogRootContext();

    const toggle = () => {
      context.onOpenChange(!context.open);
    };

    return (
      <button
        type="button"
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
        {...props}
        onPointerUp={(e) => {
          toggle();
          props.onPointerUp?.(e);
        }}
      />
    );
  }
);

interface DialogPortalProps extends PortalProps {}

const QDialogPortal = (props: DialogPortalProps) => {
  return <ReactDomPortal {...props} />;
};

interface DialogOverlayProps extends HTMLAttributes<HTMLDivElement> {}

const QDialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  (props, ref) => {
    const context = useDialogRootContext();

    if (!context.open) return null;

    return (
      <div
        aria-hidden
        data-state={context.open ? "open" : "closed"}
        ref={ref}
        {...props}
      />
    );
  }
);

interface DialogContentProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const QDialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  (props, ref) => {
    const nodeRef = useRef<HTMLDivElement>();
    const hideOthersRef = useRef<Undo>();
    const { open, onOpenChange, onContentNodeChange } = useDialogRootContext();

    useEffect(() => {
      if (nodeRef.current && open) {
        hideOthersRef.current = hideOthers(nodeRef.current);
      }

      return () => hideOthersRef.current?.();
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

      return () => document?.removeEventListener("keydown", listener);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
      <QFocusTrap>
        <div
          role="dialog"
          data-state={open ? "open" : "closed"}
          aria-modal={open}
          ref={(node) => {
            if (!node) return;

            onContentNodeChange(node);
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

interface DialogTitleProps
  extends DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  > {}

const QDialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  (props, ref) => {
    return (
      <h1 ref={ref} {...props}>
        {props.children}
      </h1>
    );
  }
);

interface DialogDescriptionProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

const QDialogDescription = forwardRef<HTMLDivElement, DialogDescriptionProps>(
  (props, ref) => {
    return <div ref={ref} {...props} />;
  }
);

interface DialogCloseButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {}

const QDialogCloseButton = forwardRef<
  HTMLButtonElement,
  DialogCloseButtonProps
>((props, ref) => {
  const context = useDialogRootContext();
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

const Root = QDialogRoot;
const Trigger = QDialogTrigger;
const Portal = QDialogPortal;
const Overlay = QDialogOverlay;
const Content = QDialogContent;
const Title = QDialogTitle;
const CloseButton = QDialogCloseButton;
const Description = QDialogDescription;

export {
  QDialogRoot,
  QDialogTrigger,
  QDialogPortal,
  QDialogOverlay,
  QDialogContent,
  QDialogTitle,
  QDialogCloseButton,
  QDialogDescription,
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
