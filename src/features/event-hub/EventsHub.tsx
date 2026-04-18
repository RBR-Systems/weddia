import Card from "@/shared/components/Card/Card";
import Header from "@/shared/components/Header/Header";
import React from "react";
import styles from "./events-hub.module.css";
import { useEvent } from "@/shared/contexts/EventContext";
import { useTranslation } from "react-i18next";

const EventsHub = () => {
  const { t } = useTranslation();
  const {
    state: {
      events: { selectedEvent },
    },
  } = useEvent();
  return (
    <div className={styles["events-hub-wrapper"]}>
      <Header
        name={selectedEvent?.eventName || ""}
        items={[
          t("eventsHub.yearToGo"),
          t("eventsHub.startedOn", { date: "August 6, 2025" }),
          t("eventsHub.weddingDay", { date: "August 6, 2026" }),
          t("eventsHub.statusInProgress"),
        ]}
      ></Header>
      <Card>
        <div>
          <p>{t("eventsHub.event", { number: 1 })}</p>
        </div>
      </Card>
      <Card>
        <div>
          <p>{t("eventsHub.event", { number: 2 })}</p>
        </div>
      </Card>
    </div>
  );
};

export default EventsHub;
