import { ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PortalProps {
  children?: ReactNode;
  container?: Element | DocumentFragment;
}

const QPortal = (props: PortalProps) => {
  return createPortal(props.children, props.container ?? document.body);
};

export default QPortal;
