import { isUndefined } from "@/src/utils/is";
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  HTMLAttributes,
  createContext,
  forwardRef,
  useState,
} from "react";
import { useRadioGroupRootContext } from "./hooks";

type RadioGroupRootContextType = {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
};
export const RadioGroupRootContext = createContext<
  RadioGroupRootContextType | undefined
>(undefined);

const { Provider: RadioGroupRootContextProvider } = RadioGroupRootContext;

export interface RadioGroupRootProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

const QRadioGroupRoot = forwardRef<HTMLDivElement, RadioGroupRootProps>(
  (props, ref) => {
    const { value, onValueChange, disabled, required, name, ...restProps } =
      props;
    const [unControlledValue, setUnContolledValue] = useState<string>();
    const radioValue = isUndefined(value) ? unControlledValue : value;
    const handleChange = isUndefined(onValueChange)
      ? setUnContolledValue
      : onValueChange;

    return (
      <RadioGroupRootContextProvider
        value={{
          value: radioValue,
          onValueChange: handleChange,
          name: name,
          disabled: disabled,
          required: required,
        }}
      >
        <div
          role="radiogroup"
          ref={ref}
          aria-disabled={disabled}
          data-disabled={disabled}
          aria-required={required}
          data-required={required}
          {...restProps}
        >
          {props.children}
        </div>
      </RadioGroupRootContextProvider>
    );
  }
);

interface RadioGroupItemProps
  extends Omit<
    DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    "name"
  > {
  value: string;
}

const QRadioGroupItem = forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  (props, ref) => {
    const [button, setButton] = useState<HTMLButtonElement>();
    const [input, setInput] = useState<HTMLInputElement>();
    const context = useRadioGroupRootContext();
    const isChecked = props.value === context.value;
    const isUnderForm = button ? !!button.closest("form") : false;

    return (
      <>
        <button
          role="radio"
          type="button"
          aria-checked={isChecked}
          aria-disabled={context.disabled || props.disabled}
          data-disabled={context.disabled || props.disabled}
          data-state={isChecked ? "checked" : "unchecked"}
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
          name={context.name}
          {...props}
          onClick={(e) => {
            input?.click();
            context.onValueChange?.(props.value);
            props.onClick?.(e);
          }}
        />

        {isUnderForm ? (
          <input
            ref={(node) => {
              if (node) {
                setInput(node);
              }
            }}
            type="radio"
            id={props.id}
            value={props.value}
            name={context.name}
            checked={isChecked}
            disabled={context.disabled || props.disabled}
            tabIndex={-1}
            required={context.required && !!props["aria-required"]}
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

const Root = QRadioGroupRoot;
const Radio = QRadioGroupItem;
export {
  Root,
  Radio,
  //
  //
  //
  QRadioGroupRoot,
  QRadioGroupItem,
};
