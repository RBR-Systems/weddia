import React from "react";
import { Row, Col, Typography } from "antd";
import styles from "./ScheduleHeader.module.css";

type Props = { title?: string; subtitle?: string };

const { Title, Text } = Typography;

const ScheduleHeader: React.FC<Props> = ({ title = "Schedule", subtitle }) => {
  return (
    <Row justify="space-between" align="middle" className={styles.header}>
      <Col>
        <Title level={4} className={styles.title}>
          {title}
        </Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </Col>
    </Row>
  );
};

export default ScheduleHeader;
