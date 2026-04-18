"use client";
import React from "react";
import { Input, Button, Avatar, Spin, Tag } from "antd";
import Card from "@/shared/components/Card/Card";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import styles from "./SeatingAIChat.module.css";
import {
  HFGuest,
  HFTable,
  SeatingResponse,
} from "../../api/huggingfaceApi";
import { useSeatingAI } from "./hooks/useSeatingAI";
import { formatTime } from "./utils/seatingAI.utils";
import { useTranslation } from "react-i18next";

interface MessageItem {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: SeatingResponse;
}

interface SeatingAIChatProps {
  guests: HFGuest[];
  tables: HFTable[];
  onApplySeating: (assignments: SeatingResponse["assignments"]) => void;
}

const SeatingAIChat: React.FC<SeatingAIChatProps> = ({
  guests,
  tables,
  onApplySeating,
}) => {
  const { messageApi } = useTableAssignmentContext();
  const { t } = useTranslation();

  const {
    messages,
    input,
    setInput,
    loading,
    handleSend,
    appliedMessageId,
    handleApply,
    messagesEndRef,
  } = useSeatingAI({ guests, tables, onApplySeating, messageApi });

  return (
    <Card className={styles.chatCard}>
      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.type === "user" ? styles.userMessage : styles.assistantMessage}
          >
            <div className={styles.messageAvatar}>
              <Avatar
                icon={msg.type === "user" ? <UserOutlined /> : <RobotOutlined />}
                className={msg.type === "user" ? styles.avatarUser : styles.avatarAssistant}
              />
            </div>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{msg.content}</div>
              {msg.data && (
                <div className={styles.messageActions}>
                  <Tag color="blue">
                    {t("tableAssignment.aiChat.assignments", { count: msg.data.assignments.length })}
                  </Tag>
                  {appliedMessageId !== msg.id && (
                    <Button type="primary" size="small" onClick={() => handleApply(msg.data!, msg.id)}>
                      {t("tableAssignment.aiChat.applyArrangement")}
                    </Button>
                  )}
                  {appliedMessageId === msg.id && (
                    <Tag color="success">{t("tableAssignment.aiChat.arrangementApplied")}</Tag>
                  )}
                </div>
              )}
              <div className={styles.messageTime}>{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className={styles.loadingMessage}>
            <Spin /> {t("tableAssignment.aiChat.aiThinking")}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("tableAssignment.aiChat.placeholder")}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSend()}
          loading={loading}
          disabled={!input.trim()}
        >
          {t("tableAssignment.aiChat.send")}
        </Button>
      </div>
    </Card>
  );
};

export default SeatingAIChat;
