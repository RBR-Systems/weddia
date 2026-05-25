import styles from '../../event-list.module.css';
import type { EventCardProps } from '../../models/eventCardProps.models';

interface EventNameCellProps {
  record: EventCardProps;
}

const EventInitial = ({ name }: { name: string }) => {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  return <div className={styles.eventInitial}>{initial}</div>;
};

export const EventNameCell = ({ record }: EventNameCellProps) => (
  <div className={styles.eventCell}>
    <EventInitial name={record.eventName} />
    <div className={styles.eventCellText}>
      <div className={styles.eventName}>{record.eventName}</div>
      {record.description && (
        <div className={styles.description}>{record.description}</div>
      )}
    </div>
  </div>
);
