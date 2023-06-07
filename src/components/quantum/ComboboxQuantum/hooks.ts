import { useContext } from "react";
import {
  ComboboxContentContext,
  ComboboxItemContext,
  ComboboxRadioGroupContext,
  ComboboxRadioItemContext,
  ComboboxRootContext,
} from ".";
import { isUndefined } from "../../../utils/is";

export const useComboboxRootContext = () => {
  const context = useContext(ComboboxRootContext);

  if (isUndefined(context)) {
    throw Error("Combobox Root 안에서만 사용하세요");
  }

  return context;
};

export const useComboboxItemContext = () => {
  const context = useContext(ComboboxItemContext);

  if (isUndefined(context)) {
    throw Error("Combobox Item 안에서만 사용하세요");
  }

  return context;
};

export const useComboboxContentContext = () => {
  const context = useContext(ComboboxContentContext);

  if (isUndefined(context)) {
    throw Error("Combobox Content 안에서만 사용하세요");
  }

  return context;
};

export const useComboboxRadioGroupContext = () => {
  const context = useContext(ComboboxRadioGroupContext);

  if (isUndefined(context)) {
    throw Error("Combobox Radio Group 안에서만 사용하세요");
  }

  return context;
};

export const useComboboxRadioItemContext = () => {
  const context = useContext(ComboboxRadioItemContext);

  if (isUndefined(context)) {
    throw Error("Combobox Radio Item 안에서만 사용하세요");
  }

  return context;
};
