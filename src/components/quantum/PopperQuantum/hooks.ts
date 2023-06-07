import { useContext } from "react";
import { PopperContentContext } from ".";

const usePopperContentContext = () => {
  const context = useContext(PopperContentContext);

  if (context === undefined) {
    throw Error("Popper Content 안에서 사용하세요");
  }

  return context;
};

export { usePopperContentContext };
