import { ReactElement, cloneElement, forwardRef, useEffect } from "react";
import { useRef } from "react";
import { ReactNode } from "react";

interface FocusTrapProps {
  children?: ReactNode;
}

const focus = (node: HTMLElement) => {
  node.focus();
};

const QFocusTrap = forwardRef<any, FocusTrapProps>(
  ({ children }, forwardedRef) => {
    const ref = useRef<HTMLElement>();

    useEffect(() => {
      const tabbableNodes = getTabbable({ tree: ref.current });

      if (!tabbableNodes.length) return;

      const firstNode = tabbableNodes[0];
      const lastNode = tabbableNodes[tabbableNodes.length - 1];

      const firstNodelistener = (e: KeyboardEvent) => {
        if (e.shiftKey && e.key === "Tab") {
          focus(lastNode);
          e.preventDefault();
        }
      };
      const lastNodelistener = (e: KeyboardEvent) => {
        if (!e.shiftKey && e.key === "Tab") {
          focus(firstNode);
          e.preventDefault();
        }
        if (e.shiftKey && e.key === "Tab") {
          focus(tabbableNodes[tabbableNodes.length - 2]);
          e.preventDefault();
        }
      };

      firstNode.focus();

      firstNode.addEventListener("keydown", firstNodelistener);
      lastNode.addEventListener("keydown", lastNodelistener);

      return () => {
        firstNode.removeEventListener("keydown", firstNodelistener);
        lastNode.removeEventListener("keydown", lastNodelistener);
      };
    }, []);

    return children
      ? cloneElement(children as ReactElement, {
          ref: (node: ReactElement) => {
            ref.current = node as any;

            if (forwardedRef) {
              if (typeof forwardRef === "function") {
                (forwardedRef as any)(node);
              } else {
                (forwardedRef as any).current = node;
              }
            }

            if (!(children as any).ref) return;

            if (typeof (children as any).ref === "function") {
              (children as any).ref(node);
            } else {
              (children as any).ref.current = node;
            }
          },
        })
      : null;
  }
);

export default QFocusTrap;

type TreeWalkerParams = {
  tree?: HTMLElement;
  whatToShow?: number;
  filter?: NodeFilter;
};

const getTreeWalker: (parmas?: TreeWalkerParams) => TreeWalker = ({
  tree,
  whatToShow,
  filter,
}: TreeWalkerParams = {}) => {
  return document.createTreeWalker(
    tree ?? document.body,
    whatToShow ?? NodeFilter.SHOW_ELEMENT,
    filter ?? {
      acceptNode(node) {
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
};

const getTabbable = (params?: TreeWalkerParams) => {
  const nodes: HTMLElement[] = [];
  const filter: NodeFilter = {
    acceptNode: (node: HTMLElement) => {
      if (!!(node as any)?.disabled || node.hidden)
        return NodeFilter.FILTER_SKIP;

      return node.tabIndex >= 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  };

  const treeWalker = getTreeWalker({ ...params, filter });

  while (treeWalker.nextNode())
    nodes.push(treeWalker.currentNode as HTMLElement);

  return nodes;
};
