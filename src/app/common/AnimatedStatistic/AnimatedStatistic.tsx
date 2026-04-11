"use client";
import React, { useEffect, useRef } from "react";
import { Statistic as AntdStatistic } from "antd";
import CountUp from "react-countup";

type Props = React.ComponentProps<typeof AntdStatistic> & {
  durationMs?: number;
};

function extractNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const s = String(value);
  const m = s.match(/-?[0-9,]*\.?[0-9]+/);
  if (!m) return null;
  return Number(m[0].replace(/,/g, ""));
}

export default function AnimatedStatistic({ value, durationMs = 800, formatter, ...rest }: Props) {
  const prevRef = useRef<number>(0);

  useEffect(() => {
    const n = extractNumber(value);
    if (n !== null) prevRef.current = n;
  }, []); // intentionally run once to initialize

  const numeric = extractNumber(value);

  if (numeric === null) {
    return <AntdStatistic {...rest} value={value as any} formatter={formatter} />;
  }

  const duration = Math.max(0.1, durationMs / 1000);

  // If caller provided a formatter function, use it as formattingFn for CountUp.
  const formattingFn =
    formatter && typeof formatter === "function"
      ? (n: number) => String((formatter as (v: number) => React.ReactNode)(n))
      : undefined;

  const renderValue = (val: any) => (
    <CountUp
      start={prevRef.current}
      end={Number(val)}
      duration={duration}
      separator="," 
      decimals={2}
      formattingFn={formattingFn}
    />
  );

  // update prevRef for next animation
  useEffect(() => {
    prevRef.current = numeric;
  }, [numeric]);

  return <AntdStatistic {...rest} value={numeric as any} formatter={renderValue} />;
}
