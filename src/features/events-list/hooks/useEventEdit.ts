import { useState } from 'react';
import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useEvent } from '@/shared/contexts/EventContext';
import { EventActions } from '@/shared/contexts/eventActions';
import { updateEvent } from '../api/eventsListApi';
import { STATUS_TO_API_STATUS } from '../constants/events-list.constants';
import type { EventCardProps } from '../models/eventCardProps.models';
import type { EventEditFormValues } from '../models/events-list.models';

interface UseEventEditResult {
  form: FormInstance<EventEditFormValues>;
  isModalOpen: boolean;
  saving: boolean;
  openEditModal: (record: EventCardProps) => void;
  handleCancel: () => void;
  handleSave: (values: EventEditFormValues) => Promise<void>;
}

export const useEventEdit = (): UseEventEditResult => {
  const { t } = useTranslation();
  const { dispatch } = useEvent();
  const [form] = Form.useForm<EventEditFormValues>();
  const [editingEvent, setEditingEvent] = useState<EventCardProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openEditModal = (record: EventCardProps) => {
    setEditingEvent(record);
    form.setFieldsValue({
      eventName: record.eventName,
      eventDate: record.rawDate ? dayjs(record.rawDate) : null,
      location: record.location,
      description: record.description,
      budget: record.budget,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const handleSave = async (values: EventEditFormValues) => {
    if (!editingEvent?.id) return;
    setSaving(true);
    try {
      const isoDate =
        values.eventDate?.toISOString() ??
        editingEvent.rawDate ??
        new Date().toISOString();

      await updateEvent(editingEvent.id, {
        eventName: values.eventName,
        title: values.eventName,
        description: values.description ?? '',
        eventDate: isoDate,
        eventAddress: values.location ?? '',
        budget: values.budget ?? 0,
        status: STATUS_TO_API_STATUS[values.status],
      });

      const formattedDate = new Date(isoDate).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      dispatch({
        type: EventActions.UPDATE_EVENT,
        payload: {
          ...editingEvent,
          eventName: values.eventName,
          date: formattedDate,
          rawDate: isoDate,
          description: values.description ?? '',
          location: values.location ?? '',
          budget: values.budget,
          status: values.status,
        },
      });

      message.success(t('common.save') + ' ✓');
      handleCancel();
    } catch {
      message.error('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return { form, isModalOpen, saving, openEditModal, handleCancel, handleSave };
};
