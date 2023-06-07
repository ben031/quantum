import { useContext } from "react";
import { CheckboxRootContext } from ".";
import { isUndefined } from "@/src/utils/is";

export const useCheckboxRootContext = () => {
  const context = useContext(CheckboxRootContext);

  if (isUndefined(context)) {
    throw Error("Checkbox Root 안에서 사용하세요");
  }

  return context;
};
