import {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactElement,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
} from "react";
import { DetailedHTMLProps, FormHTMLAttributes } from "react";
import { useFormFieldContext } from "./hooks";

export type ValidityString =
  | "badInput"
  | "customError"
  | "patternMismatch"
  | "rangeOverflow"
  | "rangeUnderflow"
  | "stepMismatch"
  | "tooLong"
  | "tooShort"
  | "typeMismatch"
  | "valid"
  | "valueMissing";

interface FormRootProps
  extends DetailedHTMLProps<
    FormHTMLAttributes<HTMLFormElement>,
    HTMLFormElement
  > {}

type FormContextValueType = {
  isSubmitted: number;
  onIsSubmittedChange: (isSubmit: number) => void;
};

const FormRootContext = createContext<FormContextValueType | undefined>(
  undefined
);

const QFormRoot = forwardRef<HTMLFormElement, FormRootProps>((props, ref) => {
  const [node, setNode] = useState<HTMLFormElement>();
  const [isSubmitted, setIsSubmitted] = useState<number>(0);

  const focusFirstElement = () => {
    const divNode = node?.getElementsByTagName("div");
    if (divNode && divNode.length > 0) {
      setTimeout(() => {
        // 가장 나중에 포커싱을 하기 위해 setTimeout 사용
        const collectionToArray: HTMLInputElement[] =
          Array.prototype.slice.call(divNode);

        const invalidField = collectionToArray.filter(
          (inputNode) => inputNode.getAttribute("data-invalid") === "true"
        );

        if (invalidField.length > 0) {
          invalidField[0].getElementsByTagName("input")[0].focus();
          invalidField[0].scrollIntoView({ block: "nearest" });
        }
      });
    }
  };

  return (
    <FormRootContext.Provider
      value={{
        isSubmitted,
        onIsSubmittedChange: setIsSubmitted,
      }}
    >
      <form
        ref={(node) => {
          if (node) {
            setNode(node);
          }
          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        {...props}
        onSubmit={(e) => {
          props.onSubmit?.(e);
          e.preventDefault();
        }}
        onInvalid={(e) => {
          focusFirstElement();
          props.onInvalid?.(e);
          e.preventDefault();
        }}
      />
    </FormRootContext.Provider>
  );
});

interface FormFieldProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  name: string;
}

type FormFieldContextValueType = {
  name: string;
  fieldId: string;
  validationSet?: { [key: string]: boolean };
  onValidationSetChange: (set: { [key: string]: boolean }) => void;
  inputNode?: HTMLInputElement;
  onInputNodeChange: (node?: HTMLInputElement) => void;
};

export const FormFieldContext = createContext<
  FormFieldContextValueType | undefined
>(undefined);

const { Provider: FormFieldContextProvider } = FormFieldContext;

const QFormField = forwardRef<HTMLDivElement, FormFieldProps>((props, ref) => {
  const { name, ...restProps } = props;
  const [inputNode, setInputNode] = useState<HTMLInputElement>();
  const [validationSet, setValidationSet] = useState<{
    [key: string]: boolean;
  }>({});

  return (
    <FormFieldContextProvider
      value={{
        name,
        fieldId: useId(),
        validationSet,
        onValidationSetChange: setValidationSet,
        inputNode,
        onInputNodeChange: setInputNode,
      }}
    >
      <div
        {...restProps}
        aria-invalid={!!Object.keys(validationSet).length}
        data-invalid={!!Object.keys(validationSet).length}
        ref={(node) => {
          if (node) {
          }
          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
      />
    </FormFieldContextProvider>
  );
});

interface FormLabelProps
  extends DetailedHTMLProps<
    LabelHTMLAttributes<HTMLLabelElement>,
    HTMLLabelElement
  > {}

const QFormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  (props, ref) => {
    const fieldContext = useFormFieldContext();

    return <label ref={ref} htmlFor={fieldContext.fieldId} {...props} />;
  }
);

interface FormInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  asChild?: boolean;
  removeValidationWhenFocus?: boolean;
}

const QFormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (props, ref) => {
    const {
      children = null,
      asChild,
      removeValidationWhenFocus,
      ...rest
    } = props;
    const {
      fieldId,
      name,
      onValidationSetChange,
      validationSet,
      onInputNodeChange,
    } = useFormFieldContext();
    const [node, setNode] = useState<HTMLInputElement>();
    const [asChildContainer, setAsChildContainer] =
      useState<HTMLDivElement | null>();

    useEffect(() => {
      if (props.asChild && asChildContainer) {
        const inputNodes = asChildContainer.getElementsByTagName("input");

        if (inputNodes.length !== 1) {
          throw new Error(
            "FormInput 컴포넌트 내부 input 태그는 하나만 사용 가능합니다."
          );
        }

        setNode(inputNodes[0]);
        inputNodes[0]?.setAttribute("name", name);
        Object.entries(rest).forEach(([key, value]) => {
          if (!key.startsWith("on")) {
            inputNodes[0]?.setAttribute(key, value);
          }
        });
      }
    }, [
      props.asChild,
      asChildContainer,
      fieldId,
      rest,
      name,
      props.required,
      validationSet,
    ]);

    useEffect(() => {
      const listener = () => {
        if (node) {
          let validityObject: any = {};
          for (const key in node.validity) {
            validityObject[key] = node.validity[key as ValidityString];
          }

          const invalidItem = Object.entries(validityObject).find(
            ([key, value]) => value === true && key !== "valid"
          );

          if (invalidItem) {
            const key = invalidItem[0] as ValidityString;
            const value = invalidItem[1] as boolean;

            onValidationSetChange({ [key as ValidityString]: value });
          }
        }
      };
      if (node) {
        node.addEventListener("invalid", listener);
      }

      return () => node?.removeEventListener("invalid", listener);
    }, [node, onValidationSetChange]);

    useEffect(() => {
      const listener = () => {
        onValidationSetChange({});
      };

      if (node) {
        node.addEventListener("input", listener);
        node.addEventListener("change", listener);
        if (removeValidationWhenFocus) {
          node.addEventListener("input", listener);
          node.addEventListener("focus", listener);
        }
        return () => {
          node.removeEventListener("input", listener);
          node.removeEventListener("change", listener);
          node.removeEventListener("input", listener);
          node.removeEventListener("focus", listener);
        };
      }
    }, [node, onValidationSetChange, removeValidationWhenFocus]);

    useEffect(() => {
      onInputNodeChange(node);
    }, [onInputNodeChange, node]);

    if (props.asChild) {
      return <div ref={setAsChildContainer}>{props.children}</div>;
    }

    return (
      <input
        ref={(node) => {
          if (node) {
            setNode(node);
          }
          if (ref) {
            if (typeof ref === "function") {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        id={fieldId}
        name={name}
        {...props}
        onChange={(e) => {
          onValidationSetChange({});
          props.onChange?.(e);
        }}
      />
    );
  }
);

interface FormMessageProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  match: ValidityString | (() => boolean);
}

const QFormMessage = forwardRef<HTMLSpanElement, FormMessageProps>(
  (props, ref) => {
    const { match, ...restProps } = props;
    const rootContext = useContext(FormRootContext);
    const { validationSet, onValidationSetChange, inputNode } =
      useFormFieldContext();

    useLayoutEffect(() => {
      if (typeof match === "function" && rootContext?.isSubmitted) {
        if (match()) {
          onValidationSetChange({ customError: true });
          inputNode?.setCustomValidity("custom-error");
        } else {
          onValidationSetChange({});
          inputNode?.setCustomValidity("");
        }
      }
      // 렌더링 할때마다 match 함수 실행 막기
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rootContext?.isSubmitted]);

    if (typeof match !== "function") {
      return validationSet?.[match] ? <span ref={ref} {...restProps} /> : null;
    }

    return rootContext?.isSubmitted &&
      match() &&
      !!validationSet?.["customError"] ? (
      <span ref={ref} {...restProps} />
    ) : null;
  }
);

interface FormSubmitButtonProps
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  asChild?: boolean;
}

const QFormSubmitButton = forwardRef<HTMLButtonElement, FormSubmitButtonProps>(
  (props) => {
    const rootContext = useContext(FormRootContext);

    if (props.asChild && isValidElement(props.children)) {
      return cloneElement(props.children as ReactElement, {
        type: "submit",
        onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
          props.onClick?.(e);
          rootContext?.onIsSubmittedChange(rootContext.isSubmitted + 1);
        },
        onSubmit: (e: React.FormEvent<HTMLButtonElement>) => {
          props.onSubmit?.(e);
          e.preventDefault();
        },
      });
    }

    return (
      <button
        type="submit"
        {...props}
        onClick={(e) => {
          props.onClick?.(e);
          rootContext?.onIsSubmittedChange(rootContext.isSubmitted + 1);
        }}
        onSubmit={(e) => {
          props.onSubmit?.(e);
          e.preventDefault();
        }}
      />
    );
  }
);

const Root = QFormRoot;
const Field = QFormField;
const Label = QFormLabel;
const Input = QFormInput;
const Message = QFormMessage;
const SubmitButton = QFormSubmitButton;

export {
  QFormRoot,
  QFormField,
  QFormLabel,
  QFormInput,
  QFormMessage,
  QFormSubmitButton,
  //
  //
  //
  Root,
  Field,
  Label,
  Input,
  Message,
  SubmitButton,
};
