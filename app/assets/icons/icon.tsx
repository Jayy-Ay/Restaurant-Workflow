import type { ReactNode } from "react";

// Icon creation factory
export const createIcon = ({
  path,
  displayName,
  height,
  width,
  viewBox,
  fill,
}: {
  path: ReactNode;
  displayName: string;
  height: string;
  width: string;
  viewBox: string;
  fill?: string;
}) => {
  const Comp = (props: React.SVGAttributes<SVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={height}
      width={width}
      viewBox={viewBox}
      fill={fill}
      className="shrink-0"
      {...props}
    >
      {path}
    </svg>
  );
  Comp.displayName = displayName;

  return Comp;
};
