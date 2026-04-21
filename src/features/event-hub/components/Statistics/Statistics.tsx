import Card from "@/shared/components/Card/Card";

import type { StatisticsProps } from "../../models/eventHub.models";
import styles from "./Statistics.module.css";

const Statistics = ({ title, items }: StatisticsProps) => (
  <Card title={title} className={styles.card}>
    <dl className={styles.grid}>
      {items.map((item) => (
        <div key={item.id} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  </Card>
);

export default Statistics;
