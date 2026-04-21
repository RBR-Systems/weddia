import { Empty } from "antd";
import Card from "@/shared/components/Card/Card";

import type { UpcomingTasksProps } from "../../models/eventHub.models";
import styles from "./UpcomingTasks.module.css";

const UpcomingTasks = ({ title, items, emptyText }: UpcomingTasksProps) => (
  <Card title={title} className={styles.card}>
    {items.length === 0 ? (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyText}
      />
    ) : (
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.listItem}>
            {item.label}
          </li>
        ))}
      </ul>
    )}
  </Card>
);

export default UpcomingTasks;
