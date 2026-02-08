import React from "react";
import { Card as AntdCard } from "antd";
import type { CardProps as AntdCardProps } from "antd";

type Props = AntdCardProps & {
  children: React.ReactNode;
};

const Card = ({ children, title, className, ...rest }: Props) => {
  const renderedTitle = title !== undefined ? title : undefined;

  return (
    <AntdCard className={className} title={renderedTitle} {...(rest as AntdCardProps)}>
      <div>{children}</div>
    </AntdCard>
  );
};

export default Card;
