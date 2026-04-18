"use client";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { Statistic as AntdStatistic } from "antd";
import CountUp from "react-countup";
import { extractNumber, detectDecimals } from "./utils/number.utils";

export type AnimatedStatisticProps = ComponentProps<typeof AntdStatistic> & {
  durationMs?: number;
  countUpProps?: Partial<ComponentProps<typeof CountUp>>;
  disableAnimation?: boolean;
};

export default function AnimatedStatistic({
  value,
  durationMs = 800,
  formatter,
  countUpProps = {},
  disableAnimation = false,
  ...rest
}: AnimatedStatisticProps) {
  const prevRef = useRef<number>(extractNumber(value) ?? 0);

  const numeric = useMemo(() => extractNumber(value), [value]);
  const duration = Math.max(0.1, durationMs / 1000);

  const decimals = useMemo(() => {
    if (countUpProps?.decimals != null) return countUpProps.decimals;
    return Math.max(detectDecimals(prevRef.current), detectDecimals(numeric));
  }, [countUpProps?.decimals, numeric]);

  const formattingFn = useMemo(() => {
    if (!formatter || typeof formatter !== "function") return undefined;
    return (n: number) => {
      const out = (formatter as (v: number) => ReactNode)(n);
      if (typeof out === "string" || typeof out === "number")
        return String(out);
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      }).format(n);
    };
  }, [formatter, decimals]);

  const renderValue = useCallback(
    (val: ComponentProps<typeof AntdStatistic>["value"]) => {
      const end = Number(String(val));
      if (disableAnimation) {
        return typeof formatter === "function" ? formatter(end) : end;
      }
      return (
        <CountUp
          start={prevRef.current}
          end={end}
          duration={duration}
          separator={countUpProps.separator ?? ","}
          decimals={countUpProps.decimals ?? decimals}
          formattingFn={formattingFn}
          {...countUpProps}
        />
      );
    },
    [
      disableAnimation,
      formatter,
      duration,
      countUpProps,
      formattingFn,
      decimals,
    ],
  );

  useEffect(() => {
    prevRef.current = numeric ?? prevRef.current;
  }, [numeric]);

  if (numeric === null) {
    return <AntdStatistic {...rest} value={value} formatter={formatter} />;
  }

  return <AntdStatistic {...rest} value={numeric} formatter={renderValue} />;
}

