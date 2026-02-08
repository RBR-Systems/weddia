import React from "react";
import styles from "./nav-bar.module.css";
import { BellOutlined, DownOutlined, PlusOutlined } from "@ant-design/icons";
import { Badge, Space, Button, Dropdown, MenuProps } from "antd";
import { eventList } from "@/app/data/EventList";
import { EventStatus } from "@/app/components/events-list/models/enums/event-list-enums";
import { useEvent } from "@/app/contexts/EventContext";
import { EventActions } from "@/app/contexts/EventActions";
import { ThemeToggle } from "@/theme/ThemeToggle";

type NavBarProps = {
  state: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  currentView?: string;
};

export const NavBar: React.FC<NavBarProps> = ({
  setCollapsed,
  currentView,
}) => {
  const {
    state,
    state: {
      events: { selectedEvent },
    },
    dispatch,
  } = useEvent();

  const mapEventList = eventList
    .filter((item) => item.status === EventStatus.IN_PROGRESS)
    .map((item) => {
      const originalIndex = eventList.findIndex((event) => event === item);
      return {
        label: item.eventName,
        key: originalIndex.toString(),
      };
    });

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const eventIndex = parseInt(e.key as string);
    dispatch({
      type: EventActions.SET_SELECTED_EVENT,
      payload: eventIndex,
    });
  };

  const menuProps = {
    items: mapEventList,
    onClick: handleMenuClick,
  };

  const handleNewEvent = () => {
    dispatch({
      type: EventActions.SET_OPEN_CREATE_EVENT_MODAL,
      payload: true,
    });
  };

  const eventViews = new Set(["events-hub", "table-assignment", "budget"]);

  return (
    <div className={styles["navbar"]}>
      <div className={`${styles["navbar-item"]} ${styles["start"]}`}>
        <img
          src="/weddia-logo.svg"
          alt="Wedd.IA"
          className={styles["logo"]}
          onClick={() => {
            setCollapsed(!state);
          }}
        />
      </div>
      <div className={`${styles["navbar-item"]} ${styles["end"]}`}>
        {eventViews.has(currentView || "") ? (
          <Dropdown menu={menuProps}>
            <Button>
              <Space>
                {selectedEvent?.eventName || "Select Event"}
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        ) : null}
        <Button
          icon={<PlusOutlined />}
          className={styles["button-color"]}
          onClick={handleNewEvent}
        >
          New Event
        </Button>
        <Badge count={3} size="small" className={styles["badge-background"]}>
          <BellOutlined className={styles["icon"]} />
        </Badge>
        <ThemeToggle />
      </div>
    </div>
  );
};
