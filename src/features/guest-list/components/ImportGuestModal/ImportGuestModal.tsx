"use client";
import { Alert, List, Modal, Spin, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { BulkGuestError, ImportWarning } from "../../models/guestList.models";

interface ImportSummary {
  createdCount: number;
  warnings: ImportWarning[];
  errors: BulkGuestError[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => boolean;
  importing?: boolean;
  summary?: ImportSummary | null;
}

const ImportGuestModal: React.FC<Props> = ({ open, onClose, onFile, importing, summary }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      title={t("guestList.importGuestsTitle", "Import Guests (CSV)")}
      onCancel={onClose}
      footer={null}
    >
      <Spin spinning={!!importing}>
        <Upload.Dragger accept=".csv" beforeUpload={onFile} multiple={false} showUploadList={false} disabled={importing}>
          <p className="ant-upload-drag-icon"><UploadOutlined /></p>
          <p className="ant-upload-text">{t("guestList.importDragText", "Click or drag CSV file to this area to upload")}</p>
          <p className="ant-upload-hint">
            {t(
              "guestList.importHint",
              "Accepted columns: first_name,last_name,email,phone,party_size,relation_id,rsvp_status. relation_id accepts the group's name or numeric ID.",
            )}
          </p>
        </Upload.Dragger>
      </Spin>

      {summary && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type={summary.errors.length ? "warning" : "success"}
            showIcon
            message={t("guestList.importSummaryTitle", "Import summary")}
            description={t(
              "guestList.importSummaryDescription",
              "{{created}} guest(s) saved, {{warnings}} row(s) with unrecognized group/RSVP, {{errors}} row(s) failed to save.",
              {
                created: summary.createdCount,
                warnings: summary.warnings.length,
                errors: summary.errors.length,
              },
            )}
          />
          {summary.warnings.length > 0 && (
            <List
              size="small"
              header={t("guestList.importWarningsHeader", "Mapping warnings")}
              dataSource={summary.warnings}
              style={{ marginTop: 8, maxHeight: 160, overflowY: "auto" }}
              renderItem={(w) => (
                <List.Item>
                  {t(
                    "guestList.importWarningRow",
                    "Row {{row}}: unrecognized {{field}} value \"{{value}}\"",
                    { row: w.row, field: w.field, value: w.rawValue },
                  )}
                </List.Item>
              )}
            />
          )}
          {summary.errors.length > 0 && (
            <List
              size="small"
              header={t("guestList.importErrorsHeader", "Save errors")}
              dataSource={summary.errors}
              style={{ marginTop: 8, maxHeight: 160, overflowY: "auto" }}
              renderItem={(e) => (
                <List.Item>
                  {t("guestList.importErrorRow", "Row {{index}}: {{reason}}", {
                    index: e.index + 1,
                    reason: e.reason,
                  })}
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default ImportGuestModal;
