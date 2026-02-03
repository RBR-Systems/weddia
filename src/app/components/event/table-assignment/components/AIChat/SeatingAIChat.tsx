"use client";
import React from "react";
import { Card, Input, Button, List, Avatar, Spin, Tag } from "antd";
import { useTableAssignmentContext } from "../../context/TableAssignmentContext";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import styles from "./SeatingAIChat.module.css";
import {
  HFGuest,
  HFTable,
  SeatingResponse,
} from "../../services/huggingface.service";
import { useSeatingAI } from "./hooks/useSeatingAI";
import { formatTime } from "./utils/format";

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
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <div
              className={
                msg.type === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }
            >
              <div className={styles.messageAvatar}>
                <Avatar
                  icon={
                    msg.type === "user" ? <UserOutlined /> : <RobotOutlined />
                  }
                  className={
                    msg.type === "user"
                      ? styles.avatarUser
                      : styles.avatarAssistant
                  }
                />
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{msg.content}</div>
                {msg.data && (
                  <div className={styles.messageActions}>
                    <Tag color="blue">
                      {msg.data.assignments.length} assignments
                    </Tag>
                    {appliedMessageId !== msg.id && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleApply(msg.data!, msg.id)}
                      >
                        Apply This Arrangement
                      </Button>
                    )}
                    {appliedMessageId === msg.id && (
                      <Tag color="success">Arrangement applied!</Tag>
                    )}
                  </div>
                )}
                <div className={styles.messageTime}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          )}
        />
        {loading && (
          <div className={styles.loadingMessage}>
            <Spin /> AI is thinking...
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
          placeholder="Ask me to arrange the seating... (e.g., 'Put all bride\'s family at tables 1-3')"
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
          Send
        </Button>
      </div>
    </Card>
  );
};

export default SeatingAIChat;
