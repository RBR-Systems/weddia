import { Divider } from "antd";
import styles from "./header.module.css";

interface HeaderProps {
  name: string;
  subheader?: string;
  items?: string[];
  align?: "left" | "center";
}

export default function Header({
  name,
  subheader,
  items,
  align = "center",
}: HeaderProps) {
  const cls = align === "left" ? styles["header-left"] : styles["header"];

  return (
    <header className={cls}>
      <h2>{name}</h2>

      {subheader && (
        <div className={styles["sub-header-container"]}>
          <Divider plain>
            <h3>{subheader}</h3>
          </Divider>
        </div>
      )}

      {items && items.length > 0 && (
        <div className={styles["items-container"]}>
          {items.map((element, index) => (
            <div key={`${index}-${element}`} className={styles["item-wrapper"]}>
              <p className={styles["item-text"]}>{element}</p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
