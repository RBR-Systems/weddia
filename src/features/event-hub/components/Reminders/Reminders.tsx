import { Empty } from "antd";
import Card from "@/shared/components/Card/Card";

import type { RemindersProps } from "../../models/eventHub.models";
import styles from "./Reminders.module.css";

const Reminders = ({ title, items, emptyText }: RemindersProps) => (
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

export default Reminders;
