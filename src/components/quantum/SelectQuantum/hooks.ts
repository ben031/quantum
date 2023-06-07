import { useContext } from "react";
import {
  HtmlNativeOptionContext,
  SelectItemContext,
  SelectRootContext,
} from ".";

const useSelectItemContext = () => {
  const context = useContext(SelectItemContext);

  if (context === undefined) {
    throw Error("Select Item 안에서만 사용해주세요.");
  }

  return context;
};

const useNativeOptionContext = () => {
  const context = useContext(HtmlNativeOptionContext);

  if (context === undefined) {
    throw Error("HtmlNativeOptionContext 안에서만 사용해주세요.");
  }

  return context;
};

const useSelectContext = () => {
  const context = useContext(SelectRootContext);

  if (context === undefined) {
    throw Error("Select Root 안에서만 사용해주세요.");
  }

  return context;
};

export { useSelectContext, useSelectItemContext, useNativeOptionContext };
