import type { CSSProperties, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { hrefFor } from "../utils/links";

interface LinkProps {
  to: string;
  className?: string;
  title?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function Link({ to, className, title, style, children }: LinkProps) {
  return (
    <a href={hrefFor(to)} className={className} title={title} style={style}>
      {children}
    </a>
  );
}

interface NavLinkProps {
  to: string;
  end?: boolean;
  className?: (state: { isActive: boolean }) => string;
  children: ReactNode;
}

export function NavLink({ to, end, className, children }: NavLinkProps) {
  const { pathname } = useLocation();
  const target = to === "/" ? "/" : to.replace(/\/+$/, "");
  const current = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const isActive = end
    ? current === target
    : target === "/"
      ? current === "/"
      : current === target || current.startsWith(`${target}/`);

  return (
    <a href={hrefFor(to)} className={className?.({ isActive })}>
      {children}
    </a>
  );
}
