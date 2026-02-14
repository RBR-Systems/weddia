import React from "react";
import { Divider } from "antd";
import styles from "./header.module.css";

const Header = ({
  name,
  subheader,
  items,
  align = "center",
}: {
  name: string;
  subheader?: string;
  items?: string[];
  align?: "left" | "center";
}) => {
  const cls = align === "left" ? styles["header-left"] : styles["header"];
  return (
    <div className={cls}>
      <h2>{name}</h2>
      {subheader && (
        <div className={styles["sub-header-container"]}>
          <Divider plain>
            <h3>{subheader}</h3>
          </Divider>
        </div>
      )}
      <div className={styles["items-container"]}>
        {items?.map((element, index) => {
          return (
            <div key={index} className={styles["item-wrapper"]}>
              <div>
                <Divider />
              </div>
              <p className={styles["item-text"]}>{element}</p>
              {index !== items.length - 1 && (
                <div>
                  <Divider className={styles["item-divider"]} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Header;
