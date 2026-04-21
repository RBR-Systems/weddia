"use client";
import { useState, useEffect, useCallback } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";
import { getVendors, createVendor, updateVendor, deleteVendor } from "@/features/budget/api/vendorsApi";
import type { Vendor } from "@/features/budget/models/budget.models";
import type { VendorFormValues } from "../models/vendor.models";

interface UseVendorsResult {
  vendors: Vendor[];
  isLoading: boolean;
  createVendorItem: (values: VendorFormValues) => Promise<boolean>;
  updateVendorItem: (vendorId: string, values: VendorFormValues) => Promise<boolean>;
  deleteVendorItem: (vendor: Vendor) => Promise<void>;
}

export const useVendors = (): UseVendorsResult => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getVendors();
      setVendors(data);
    } catch {
      message.error(t("vendorCatalog.loadFailed", "Failed to load vendors"));
    } finally {
      setIsLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createVendorItem = useCallback(async (values: VendorFormValues): Promise<boolean> => {
    try {
      await createVendor({
        vendorName:    values.name,
        category:      values.category ?? "",
        contactPerson: values.contact_name,
        email:         values.email,
        mobilePhone:   values.phone,
        address:       values.address,
        notes:         values.notes,
      });
      message.success(t("vendorList.form.vendorCreated"));
      await refetch();
      return true;
    } catch {
      message.error(t("vendorList.form.vendorCreateFailed"));
      return false;
    }
  }, [message, t, refetch]);

  const updateVendorItem = useCallback(async (vendorId: string, values: VendorFormValues): Promise<boolean> => {
    try {
      await updateVendor(vendorId, {
        vendorName:    values.name,
        category:      values.category ?? "",
        contactPerson: values.contact_name,
        email:         values.email,
        mobilePhone:   values.phone,
        address:       values.address,
        notes:         values.notes,
        isActive:      values.is_active !== false,
      });
      message.success(t("vendorCatalog.updateSuccess"));
      await refetch();
      return true;
    } catch {
      message.error(t("vendorCatalog.updateFailed"));
      return false;
    }
  }, [message, t, refetch]);

  const deleteVendorItem = useCallback(async (vendor: Vendor): Promise<void> => {
    try {
      await deleteVendor(vendor.vendor_id);
      message.success(t("vendorCatalog.deleteSuccess"));
      await refetch();
    } catch {
      message.error(t("vendorCatalog.deleteFailed"));
    }
  }, [message, t, refetch]);

  return { vendors, isLoading, createVendorItem, updateVendorItem, deleteVendorItem };
};
