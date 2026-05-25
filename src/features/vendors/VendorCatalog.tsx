"use client";
import { useState } from "react";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { Vendor } from "@/shared/models/vendor.models";
import { useVendors } from "./hooks/useVendors";
import { VendorStatsRow } from "./components/VendorStatsRow/VendorStatsRow";
import { VendorTable } from "./components/VendorTable/VendorTable";
import { VendorFormModal } from "./components/VendorFormModal/VendorFormModal";
import type { VendorFormValues } from "./models/vendor.models";

const { Title } = Typography;

export default function VendorCatalog() {
  const { t } = useTranslation();
  const { vendors, categories, isLoading, createVendorItem, updateVendorItem, deleteVendorItem } = useVendors();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const openAdd = () => {
    setEditingVendor(null);
    setModalOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setModalOpen(true);
  };

  const handleSave = async (values: VendorFormValues): Promise<boolean> => {
    const ok = editingVendor
      ? await updateVendorItem(editingVendor.vendor_id, values)
      : await createVendorItem(values);
    if (ok) {
      setModalOpen(false);
      setEditingVendor(null);
    }
    return ok;
  };

  const handleCancel = () => {
    setModalOpen(false);
    setEditingVendor(null);
  };

  return (
    <>
      <Title level={3}>{t("vendorCatalog.title")}</Title>
      <VendorStatsRow vendors={vendors} />
      <VendorTable
        vendors={vendors}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={deleteVendorItem}
      />
      <VendorFormModal
        open={modalOpen}
        editingVendor={editingVendor}
        categories={categories}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </>
  );
}

