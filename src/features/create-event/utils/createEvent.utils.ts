import type { InputNumberProps } from "antd";
import {
  formatInputNumber,
  parseInputNumber,
} from "@/shared/utils/formatters.utils";
import type {
  CreateEventFormValues,
  CreateEventPayload,
} from "../models/createEvent.models";
import { CREATE_EVENT_DEFAULT_STATUS } from "../constants/createEvent.constants";

export const budgetFormatter: InputNumberProps<number>["formatter"] = (
  value,
) => {
  if (!value) return "";
  return `$ ${formatInputNumber(value)}`;
};

export const budgetParser: InputNumberProps<number>["parser"] = (value) =>
  parseInputNumber(value) as unknown as number;

export const formatPhoneNumber = (value: string): string => {
  const digits = value.replaceAll(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
};

export const formatEventDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const buildCreateEventPayload = (
  values: CreateEventFormValues,
  organizationId?: number | null,
): CreateEventPayload => {
  const isoDate = values.eventDate
    ? values.eventDate.toISOString()
    : new Date().toISOString();

  return {
    eventName: values.eventName,
    title: values.eventName,
    description: values.description ?? "",
    eventDate: isoDate,
    eventAddress: values.eventAddress ?? "",
    budget: values.budget ?? 0,
    status: CREATE_EVENT_DEFAULT_STATUS,
    organizationId: organizationId ?? null,
  };
};
