"use client";

import { Empty } from "antd";
import Header from "@/shared/components/Header/Header";
import { useTranslation } from "react-i18next";

import CommonActions from "./components/CommonActions/CommonActions";
import Reminders from "./components/Reminders/Reminders";
import Statistics from "./components/Statistics/Statistics";
import UpcomingTasks from "./components/UpcomingTasks/UpcomingTasks";
import { useEventHubViewModel } from "./hooks/useEventHubViewModel";
import styles from "./events-hub.module.css";

const EventHubPage = () => {
  const { t } = useTranslation();
  const { viewModel } = useEventHubViewModel();

  if (!viewModel) {
    return <Empty description={t("eventsHub.emptyState")} />;
  }

  return (
    <div className={styles.eventsHubWrapper}>
      <Header name={viewModel.eventName} items={viewModel.headerItems} />
      <div className={styles.sectionsGrid}>
        <Statistics
          title={t("eventsHub.sections.statistics")}
          items={viewModel.statistics}
        />
        <UpcomingTasks
          title={t("eventsHub.sections.upcomingTasks")}
          items={viewModel.upcomingTasks}
          emptyText={t("eventsHub.upcomingTasks.empty")}
        />
        <Reminders
          title={t("eventsHub.sections.reminders")}
          items={viewModel.reminders}
          emptyText={t("eventsHub.reminders.empty")}
        />
        <CommonActions
          title={t("eventsHub.sections.commonActions")}
          items={viewModel.commonActions}
        />
      </div>
    </div>
  );
};

export default EventHubPage;
