import { useContext } from "react";
import { AlertDialogRootContext } from ".";

const useAlertDialogRootContext = () => {
  const context = useContext(AlertDialogRootContext);

  if (context === undefined) {
    throw Error("Alert Dialog Context 안에서 사용하세요");
  }

  return context;
};

export { useAlertDialogRootContext };
