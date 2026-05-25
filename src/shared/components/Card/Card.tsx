import { Card as AntdCard } from "antd";
import type { ComponentProps, ReactNode } from "react";

type Props = Omit<ComponentProps<typeof AntdCard>, "children"> & {
  children: ReactNode;
};

export default function Card({ children, ...rest }: Props) {
  return <AntdCard {...rest}>{children}</AntdCard>;
}
