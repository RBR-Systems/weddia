import React from 'react';
import { Row, Col, Typography } from 'antd';

type Props = {
  title?: string;
  subtitle?: string;
};

const { Title, Text } = Typography;

const ScheduleHeader: React.FC<Props> = ({ title = 'Schedule', subtitle }) => {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
      <Col>
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </Col>
    </Row>
  );
};

export default ScheduleHeader;
