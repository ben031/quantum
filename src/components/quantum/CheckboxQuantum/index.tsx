import { isUndefined } from "@/src/utils/is";
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  MutableRefObject,
  ReactNode,
  createContext,
  forwardRef,
  useState,
} from "react";
import { useCheckboxRootContext } from "./hooks";

type CheckboxRootContextValueType = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};
export const CheckboxRootContext = createContext<
  CheckboxRootContextValueType | undefined
>(undefined);

export interface CheckboxRootProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children?: ReactNode;
}

const QCheckboxRoot = (props: CheckboxRootProps) => {
  const [unControlledChecked, setUnControlledChecked] =
    useState<boolean>(false);
  const checked = isUndefined(props.checked)
    ? unControlledChecked
    : props.checked;
  const onCheckedChange = isUndefined(props.onCheckedChange)
    ? setUnControlledChecked
    : props.onCheckedChange;
  return (
    <CheckboxRootContext.Provider
      value={{
        checked,
        onCheckedChange,
      }}
    >
      {props.children}
    </CheckboxRootContext.Provider>
  );
};

export interface CheckboxButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  required?: boolean;
  inputRef?: MutableRefObject<HTMLInputElement>;
}

const QCheckboxButton = forwardRef<HTMLButtonElement, CheckboxButtonProps>(
  (props, ref) => {
    const context = useCheckboxRootContext();
    const [button, setButton] = useState<HTMLButtonElement>();
    const [input, setInput] = useState<HTMLInputElement>();

    const isUnderForm = button ? !!button.closest("form") : false;

    const toggle = () => context.onCheckedChange(!context.checked);
    const checked: boolean = context.checked;
    const required: boolean = !!props.required;

    const handleClick = (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      toggle();
      input?.click();
      props.onClick?.(e);
    };

    return (
      <>
        <button
          type="button"
          ref={(node) => {
            if (node) {
              setButton(node);
            }

            if (ref) {
              if (typeof ref === "function") {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }}
          role="checkbox"
          aria-checked={checked}
          data-state={checked ? "checked" : "unchecked"}
          aria-disabled={props.disabled}
          aria-required={required}
          {...props}
          onClick={handleClick}
        />
        {isUnderForm ? (
          <input
            ref={(node) => {
              if (node) {
                setInput(node);

                if (props.inputRef) {
                  props.inputRef.current = node;
                }
              }
            }}
            type="checkbox"
            id={props.id}
            value={props.value}
            name={props.name}
            checked={checked}
            required={required}
            disabled={props.disabled}
            aria-disabled={props.disabled}
            tabIndex={-1}
            onChange={() => {}}
            style={{
              pointerEvents: "none",
              opacity: 0,
              position: "absolute",
            }}
          />
        ) : null}
      </>
    );
  }
);

const Root = QCheckboxRoot;
const Button = QCheckboxButton;

export {
  QCheckboxRoot,
  QCheckboxButton,
  //
  //
  //
  Root,
  Button,
};
