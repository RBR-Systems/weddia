"use client";

import React from "react";
import Schedule from "../../Schedule";
import styles from "./DayOfEvent.module.css";

const DayOfEvent: React.FC = () => (
  <div className={styles.container}>
    <Schedule />
  </div>
);

export default DayOfEvent;
