"use client";
import { useEffect, useRef, useState } from "react";
import {
  getSeatingRecommendation,
  HFGuest,
  HFTable,
  SeatingResponse,
  testHuggingFaceConnection,
} from "../../../services/huggingface.service";
import { MessageItem } from "../models/types";

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
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "0",
      type: "assistant",
      content:
        "Hello! I'm your AI seating assistant. I can help you arrange guests at tables based on their relationships and your preferences. Try asking me to:\n\n• Group families together\n• Separate certain guests\n• Fill tables evenly\n• Arrange by age groups\n\nWhat would you like me to do?",
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
        content: response.explanation ?? "AI seating suggestion",
        timestamp: new Date(),
        data: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.conflicts && response.conflicts.length > 0) {
        messageApi?.warning(
          `Potential issues: ${response.conflicts.join(", ")}`,
          5,
        );
      }
    } catch (error) {
      messageApi?.error(
        error instanceof Error ? error.message : "Failed to get AI response",
      );

      const errorMessage: MessageItem = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "I'm sorry, I encountered an error. Please try again or rephrase your request.",
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
      content:
        "Seating arrangement approved and applied! Your event layout has been updated.",
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
