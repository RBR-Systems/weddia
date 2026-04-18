import React from "react";

export type KeyboardActivationProps = {
  role?: "button";
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
};

export default function getKeyboardActivationProps(
  onActivate?: () => void,
): KeyboardActivationProps {
  if (!onActivate) return {};

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (e) => {
    const key = e.key;
    if (key === "Enter" || key === " " || key === "Spacebar") {
      e.preventDefault();
      e.stopPropagation();
      onActivate();
    }
  };

  return {
    role: "button",
    tabIndex: 0,
    onKeyDown: handleKeyDown,
  };
}
