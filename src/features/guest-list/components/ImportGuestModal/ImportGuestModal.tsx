"use client";
import { Modal, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => boolean;
}

const ImportGuestModal: React.FC<Props> = ({ open, onClose, onFile }) => {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      title={t("guestList.importGuestsTitle", "Import Guests (CSV)")}
      onCancel={onClose}
      footer={null}
    >
      <Upload.Dragger accept=".csv" beforeUpload={onFile} multiple={false} showUploadList={false}>
        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
        <p className="ant-upload-text">{t("guestList.importDragText", "Click or drag CSV file to this area to upload")}</p>
        <p className="ant-upload-hint">{t("guestList.importHint", "Accepted columns: first_name,last_name,email,phone,party_size,relation_id,rsvp_status")}</p>
      </Upload.Dragger>
    </Modal>
  );
};

export default ImportGuestModal;
