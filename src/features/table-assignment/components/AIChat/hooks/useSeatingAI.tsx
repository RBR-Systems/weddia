"use client";
import { useEffect, useRef, useState } from "react";
import {
  getSeatingRecommendation,
  HFGuest,
  HFTable,
  SeatingResponse,
  testHuggingFaceConnection,
} from "../../../api/huggingfaceApi";
import { MessageItem } from "../models/seatingAI.models";
import { useTranslation } from "react-i18next";

interface UseSeatingAIParams {
  guests: HFGuest[];
  tables: HFTable[];
  onApplySeating: (assignments: SeatingResponse["assignments"]) => void;
  messageApi?: any;
}

export const useSeatingAI = ({
  guests,
  tables,
  onApplySeating,
  messageApi,
}: UseSeatingAIParams) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "0",
      type: "assistant",
      content: t("tableAssignment.aiChat.greeting"),
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedMessageId, setAppliedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    testHuggingFaceConnection().then((ok) => {
      if (!ok) {
        console.info("Hugging Face warmup may have failed or is slow");
      }
    });
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim()) return;

    const userMessage: MessageItem = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await getSeatingRecommendation({
        guests,
        tables,
        userMessage: messageText,
      });

      const assistantMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.explanation ?? t("tableAssignment.aiChat.aiSuggestion"),
        timestamp: new Date(),
        data: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.conflicts && response.conflicts.length > 0) {
        messageApi?.warning(
          t("tableAssignment.aiChat.potentialIssues", { issues: response.conflicts.join(", ") }),
          5,
        );
      }
    } catch (error) {
      messageApi?.error(
        error instanceof Error ? error.message : t("tableAssignment.aiChat.failedResponse"),
      );

      const errorMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: t("tableAssignment.aiChat.errorMessage"),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (data: SeatingResponse, msgId: string) => {
    onApplySeating(data.assignments);
    setAppliedMessageId(msgId);
    messageApi?.success({
      content: t("tableAssignment.aiChat.arrangementAppliedSuccess"),
      duration: 3,
    });
  };

  return {
    messages,
    input,
    setInput,
    loading,
    handleSend,
    appliedMessageId,
    handleApply,
    messagesEndRef,
  } as const;
};

export type { MessageItem };
