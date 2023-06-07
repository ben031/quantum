import { useContext } from "react";
import { RadioGroupRootContext } from ".";
import { isUndefined } from "@/src/utils/is";

export const useRadioGroupRootContext = () => {
  const context = useContext(RadioGroupRootContext);

  if (isUndefined(context)) {
    throw Error("Radio Group Root 안에서만 사용하세요");
  }

  return context;
};
