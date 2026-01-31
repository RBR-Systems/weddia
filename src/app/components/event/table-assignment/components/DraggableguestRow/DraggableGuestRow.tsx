import React, { memo, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Space, Tag, Typography } from "antd";
import type { CSSProperties } from "react";
import styles from "./DraggableGuestRow.module.css";
import type { Guest } from "../../models/types";
import { fullName } from "../../utils/Table-Utils";

export default memo(function DraggableGuestRow({
  guest,
  relationName,
  isAssigned,
}: {
  guest: Guest;
  relationName?: string;
  isAssigned: boolean;
}) {
  const dragId = `guest:${guest.guest_id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId,
      data: { guestId: guest.guest_id },
    });

  const style: CSSProperties = useMemo(
    () =>
      transform
        ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
        : {},
    [transform],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        styles.draggableGuest,
        isDragging ? styles.dragging : "",
      ].join(" ")}
      {...listeners}
      {...attributes}
    >
      <Space direction="vertical" size={6} className={styles.fullWidth}>
        <Space size={8} wrap>
          <Typography.Text strong>{fullName(guest)}</Typography.Text>
          {isAssigned ? (
            <Tag color="green">Assigned</Tag>
          ) : (
            <Tag>Unassigned</Tag>
          )}
          {guest.plus_one ? <Tag color="purple">+1</Tag> : null}
        </Space>
        <Space size={6} wrap>
          {relationName ? (
            <Tag color="gold">{relationName}</Tag>
          ) : (
            <Tag>Unknown relation</Tag>
          )}
          {guest.dietary_restrictions ? (
            <Tag color="green">{guest.dietary_restrictions}</Tag>
          ) : null}
          {guest.accessibility_needs ? (
            <Tag color="red">{guest.accessibility_needs}</Tag>
          ) : null}
        </Space>
      </Space>
    </div>
  );
});
