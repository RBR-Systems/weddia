import Card from "@/shared/components/Card/Card";

import type { CommonActionsProps } from "../../models/eventHub.models";
import styles from "./CommonActions.module.css";

const CommonActions = ({ title, items }: CommonActionsProps) => (
  <Card title={title} className={styles.card}>
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.listItem}>
          {item.label}
        </li>
      ))}
    </ul>
  </Card>
);

export default CommonActions;
