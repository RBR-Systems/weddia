'use client';
import { Card, Row, Col, Upload, Button, Space, Alert, Typography, Divider, Progress } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './BulkDataPanel.module.css';

interface BulkDataPanelProps {
  expenseCount: number;
  selectedCount: number;
  uploadProps: UploadProps;
  importProgress: number | null;
  onExportAll: () => void;
  onExportSelected: () => void;
  onDownloadTemplate: () => void;
}

export const BulkDataPanel = ({
  expenseCount,
  selectedCount,
  uploadProps,
  importProgress,
  onExportAll,
  onExportSelected,
  onDownloadTemplate,
}: BulkDataPanelProps) => {
  const { t } = useTranslation();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title={t('bulkOperations.importData')}>
          <Space direction="vertical" className={styles.fullWidth}>
            <Alert
              message={t('bulkOperations.csvImport')}
              description={t('bulkOperations.csvDescription')}
              type="info"
              showIcon
            />
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} block>
                {t('bulkOperations.selectCsvFile')}
              </Button>
            </Upload>
            {importProgress !== null && (
              <Progress percent={importProgress} status="active" />
            )}
            <Divider />
            <Typography.Text type="secondary">
              {t('bulkOperations.downloadTemplateLabel')}
            </Typography.Text>
            <Button icon={<DownloadOutlined />} onClick={onDownloadTemplate}>
              {t('bulkOperations.downloadTemplate')}
            </Button>
          </Space>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title={t('bulkOperations.exportData')}>
          <Space direction="vertical" className={styles.fullWidth}>
            <Button icon={<DownloadOutlined />} onClick={onExportAll} block>
              {t('bulkOperations.exportAll', { count: expenseCount })}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={onExportSelected}
              disabled={selectedCount === 0}
              block
            >
              {t('bulkOperations.exportSelected', { count: selectedCount })}
            </Button>
            <Divider />
            <Typography.Text type="secondary">
              {t('bulkOperations.exportFormats')}
            </Typography.Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};
