'use client';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button } from 'antd';
import { EditOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { FormInstance } from 'antd';
import { EventStatus } from '../../models/enums/eventList.models';
import type { EventEditFormValues } from '../../models/events-list.models';
import { formatInputNumber, parseInputNumber } from '@/shared/utils/formatters.utils';
import styles from '../../event-list.module.css';

const { Option } = Select;
const { TextArea } = Input;

interface EventEditModalProps {
  open: boolean;
  form: FormInstance<EventEditFormValues>;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: EventEditFormValues) => Promise<void>;
}

export const EventEditModal = ({
  open,
  form,
  saving,
  onCancel,
  onSave,
}: EventEditModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <div className={styles.modalHeader}>
          <EditOutlined className={styles.modalIcon} />
          <span>{t('eventList.editEvent')}</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      forceRender
      style={{ width: 560 }}
    >
      <Form form={form} layout="vertical" onFinish={onSave} className={styles.editForm}>
        <Form.Item
          name="eventName"
          label={t('eventList.form.eventName')}
          rules={[{ required: true, message: 'Event name is required' }]}
        >
          <Input placeholder="e.g. Sarah & John's Wedding" />
        </Form.Item>

        <div className={styles.formRow}>
          <Form.Item
            name="eventDate"
            label={t('eventList.form.date')}
            className={styles.formRowItem}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="MMM D, YYYY HH:mm"
              placeholder="Select date & time"
            />
          </Form.Item>
          <Form.Item
            name="status"
            label={t('eventList.form.status')}
            className={styles.formRowItem}
          >
            <Select>
              <Option value={EventStatus.NOT_STARTED}>
                {t('eventList.status.Not Started')}
              </Option>
              <Option value={EventStatus.IN_PROGRESS}>
                {t('eventList.status.In Progress')}
              </Option>
              <Option value={EventStatus.COMPLETED}>
                {t('eventList.status.Completed')}
              </Option>
              <Option value={EventStatus.CANCELED}>
                {t('eventList.status.Canceled')}
              </Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="location" label={t('eventList.form.location')}>
          <Input placeholder="Venue or address" prefix={<EnvironmentOutlined />} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea
            placeholder="Short description of the event"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={250}
            showCount
          />
        </Form.Item>

        <Form.Item name="budget" label={t('eventList.form.budget')}>
          <InputNumber
            style={{ width: '100%' }}
            prefix={<DollarOutlined />}
            formatter={(v) => formatInputNumber(v)}
            parser={(v) => parseInputNumber(v) as 0}
            min={0}
            placeholder="0"
          />
        </Form.Item>

        <Form.Item className={styles.formActionsItem}>
          <div className={styles.formActions}>
            <Button onClick={onCancel}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};
