import { useContext } from "react";
import { DialogRootContext } from ".";

const useDialogRootContext = () => {
  const context = useContext(DialogRootContext);

  if (context === undefined) {
    throw Error("Dialog Context 안에서 사용하세요");
  }

  return context;
};

export { useDialogRootContext };
