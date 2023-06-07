import { useContext } from "react";
import { FormFieldContext } from ".";
import { isUndefined } from "@/src/utils/is";

export const useFormFieldContext = () => {
  const context = useContext(FormFieldContext);

  if (isUndefined(context)) {
    throw Error("Form Field 안에서 사용하세요");
  }

  return context;
};
