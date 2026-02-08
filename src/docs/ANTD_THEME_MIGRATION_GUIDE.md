# Ant Design Theme Migration Guide — Wedding App

> **Goal:** Make every Ant Design component respect your `globals.css` CSS variables so that light/dark mode works seamlessly everywhere.

---

## Table of Contents

1. [How Ant Design Theming Works (Quick Primer)](#1-how-ant-design-theming-works)
2. [Current State of the Project](#2-current-state-of-the-project)
3. [Step 1 — Create the Theme Config File](#3-step-1--create-the-theme-config-file)
4. [Step 2 — Create a ThemeProvider Wrapper](#4-step-2--create-a-themeprovider-wrapper)
5. [Step 3 — Wire It Into the Root Layout](#5-step-3--wire-it-into-the-root-layout)
6. [Step 4 — Global Token → CSS Variable Mapping (Reference)](#6-step-4--global-token--css-variable-mapping)
7. [Step 5 — Component-by-Component Theming Checklist](#7-step-5--component-by-component-theming-checklist)
8. [Step 6 — Dark Mode Toggle](#8-step-6--dark-mode-toggle)
9. [Step 7 — ConfigProvider `className` / `style` Overrides](#9-step-7--configprovider-classname--style-overrides)
10. [Step 8 — Testing Checklist](#10-step-8--testing-checklist)
11. [FAQ & Tips](#11-faq--tips)

---

## 1. How Ant Design Theming Works

Ant Design v5/v6 uses **CSS-in-JS** with a three-layer **Design Token** system:

```
Seed Tokens  →  Map Tokens  →  Alias Tokens  →  Component Tokens
```

| Layer               | What it does                                          | Example                                                   |
| ------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| **Seed Token**      | The origin — changing one value cascades everywhere   | `colorPrimary`, `borderRadius`, `fontFamily`              |
| **Map Token**       | Derived from Seed via algorithms (light/dark/compact) | `colorPrimaryBg`, `colorPrimaryHover`, `colorBgContainer` |
| **Alias Token**     | Semantic aliases consumed by components               | `colorTextHeading`, `colorBgElevated`, `boxShadow`        |
| **Component Token** | Per-component overrides                               | `Button.colorPrimary`, `Input.colorBorder`                |

### How to apply tokens

```tsx
<ConfigProvider
  theme={{
    // 1) Algorithm: light, dark, compact, or combinations
    algorithm: theme.defaultAlgorithm,

    // 2) Global tokens (Seed + Map + Alias overrides)
    token: {
      colorPrimary: "#C9A38C",
      borderRadius: 8,
    },

    // 3) Per-component tokens
    components: {
      Button: {
        colorPrimary: "#C9A38C",
        algorithm: true, // derive from seed
      },
      Input: {
        colorBorder: "#E8DDD4",
      },
    },
  }}
>
  <App />
</ConfigProvider>
```

### ConfigProvider className/style (v5.7+)

Beyond tokens, `ConfigProvider` lets you inject **className** and **style** into every instance of a component:

```tsx
<ConfigProvider
  button={{ className: "my-button", style: { fontWeight: 500 } }}
  input={{ className: "my-input" }}
  card={{ className: "my-card" }}
/>
```

This is powerful for things tokens can't handle (gradients, pseudo-elements, complex selectors).

---

## 2. Current State of the Project

| Item                         | Status                                              |
| ---------------------------- | --------------------------------------------------- |
| Ant Design version           | **v6.2.3**                                          |
| `ConfigProvider` usage       | ❌ None                                             |
| Theme config file            | ❌ None                                             |
| Dark mode support in CSS     | ✅ `globals.css` has `[data-theme="dark"]`          |
| Locale hook                  | ✅ `useLocale` exists (not wired to ConfigProvider) |
| Total antd components in use | **45 unique components**                            |
| Files using antd             | **~40 files**                                       |

### All 45 Ant Design Components Used

```
Alert, Avatar, Badge, Button, Calendar, Card, Checkbox, Col, Collapse,
ColorPicker, DatePicker, Descriptions, Divider, Drawer, Dropdown, Empty,
Flex, Form, Grid, Input, InputNumber, Layout, List, Menu, message, Modal,
notification, Pagination, Popconfirm, Popover, Progress, Radio, Result,
Row, Segmented, Select, Slider, Space, Spin, Statistic, Steps, Switch,
Table, Tabs, Tag, Timeline, Tooltip, Typography, Upload
```

---

## 3. Step 1 — Create the Theme Config File

Create `src/theme/themeConfig.ts`:

```ts
import type { ThemeConfig } from "antd";

// ============================================
//  LIGHT THEME
// ============================================
export const lightTheme: ThemeConfig = {
  token: {
    // ---- Seed Tokens ----
    colorPrimary: "#C9A38C", // --primary
    colorSuccess: "#4A9872", // --status-completed
    colorWarning: "#E8A838", // warm gold
    colorError: "#B85C5C", // --status-canceled
    colorInfo: "#5B6BC1", // --status-in-progress
    colorLink: "#B8927A", // --link-color
    colorTextBase: "#2A2421", // --text-color
    colorBgBase: "#FFFBF8", // --background
    borderRadius: 8, // --radius-md

    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // ---- Map / Alias Overrides ----
    colorBgContainer: "#FFFFFF", // --primary-background
    colorBgElevated: "#FFFFFF", // --card-background
    colorBgLayout: "#FFFBF8", // --background
    colorBorder: "#E8DDD4", // --card-border
    colorBorderSecondary: "#F5EDE7", // --divider-light
    colorSplit: "#E8DDD4", // --divider
    colorText: "#2A2421", // --text-color
    colorTextSecondary: "#6B6460", // --text-color-secondary
    colorTextTertiary: "#9B8F88", // --text-color-tertiary
    colorTextQuaternary: "#BCB3AD", // --text-color-muted

    // Shadows
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)", // --shadow-md
    boxShadowSecondary: "0 2px 4px rgba(0,0,0,0.06)", // --shadow-sm
  },

  components: {
    // Each component section maps to your CSS variables.
    // See Step 5 for the full per-component breakdown.
    Button: {
      colorPrimary: "#C9A38C",
      colorPrimaryHover: "#B8927A",
      colorPrimaryActive: "#A67F68",
      defaultBg: "#FFFFFF",
      defaultBorderColor: "#E8DDD4",
      fontWeight: 500,
      algorithm: true,
    },
    Input: {
      colorBgContainer: "#FFFFFF",
      colorBorder: "#E8DDD4",
      activeBorderColor: "#C9A38C",
      hoverBorderColor: "#C9A38C",
      algorithm: true,
    },
    Select: {
      colorBgContainer: "#FFFFFF",
      colorBorder: "#E8DDD4",
      algorithm: true,
    },
    Card: {
      colorBgContainer: "#FFFFFF",
      colorBorderSecondary: "#E8DDD4",
      algorithm: true,
    },
    Modal: {
      contentBg: "#FFFFFF",
      headerBg: "#FFFFFF",
      algorithm: true,
    },
    Table: {
      colorBgContainer: "#FFFFFF",
      headerBg: "#FAF6F2",
      borderColor: "#E8DDD4",
      algorithm: true,
    },
    Menu: {
      colorBgContainer: "#FFFFFF",
      itemSelectedBg: "#F5EDE7",
      itemSelectedColor: "#C9A38C",
      algorithm: true,
    },
    Tag: {
      algorithm: true,
    },
    Progress: {
      defaultColor: "#C9A38C",
      algorithm: true,
    },
    Tabs: {
      inkBarColor: "#C9A38C",
      itemActiveColor: "#C9A38C",
      itemSelectedColor: "#C9A38C",
      itemHoverColor: "#B8927A",
      algorithm: true,
    },
    Badge: {
      colorError: "#D4756B", // --badge-color
    },
    Divider: {
      colorSplit: "#E8DDD4", // --divider
    },
    Typography: {
      algorithm: true,
    },
    Statistic: {
      algorithm: true,
    },
    Form: {
      algorithm: true,
    },
    DatePicker: {
      colorBgContainer: "#FFFFFF",
      colorBorder: "#E8DDD4",
      algorithm: true,
    },
    Collapse: {
      colorBgContainer: "#FFFFFF",
      colorBorder: "#E8DDD4",
      algorithm: true,
    },
    Drawer: {
      colorBgElevated: "#FFFFFF",
      algorithm: true,
    },
    Dropdown: {
      colorBgElevated: "#FFFFFF",
      algorithm: true,
    },
    List: {
      colorBorder: "#E8DDD4",
      algorithm: true,
    },
    Tooltip: {
      algorithm: true,
    },
    Popover: {
      colorBgElevated: "#FFFFFF",
      algorithm: true,
    },
    Popconfirm: {
      algorithm: true,
    },
    Steps: {
      colorPrimary: "#C9A38C",
      algorithm: true,
    },
    Timeline: {
      algorithm: true,
    },
    Pagination: {
      colorPrimary: "#C9A38C",
      algorithm: true,
    },
    Segmented: {
      colorBgLayout: "#F0EEEC",
      itemSelectedBg: "#FFFFFF",
      algorithm: true,
    },
    Slider: {
      colorPrimaryBorderHover: "#B8927A",
      algorithm: true,
    },
    Switch: {
      colorPrimary: "#C9A38C",
      algorithm: true,
    },
    Checkbox: {
      colorPrimary: "#C9A38C",
      algorithm: true,
    },
    Radio: {
      colorPrimary: "#C9A38C",
      algorithm: true,
    },
    Upload: {
      colorPrimaryHover: "#B8927A",
      algorithm: true,
    },
    Calendar: {
      colorPrimary: "#C9A38C",
      algorithm: true,
    },
    Notification: {
      colorBgElevated: "#FFFFFF",
      algorithm: true,
    },
    Alert: {
      algorithm: true,
    },
    Spin: {
      colorPrimary: "#C9A38C",
    },
    Result: {
      algorithm: true,
    },
    Empty: {
      algorithm: true,
    },
  },
};

// ============================================
//  DARK THEME
// ============================================
export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: "#D4A89A",
    colorSuccess: "#6DB193",
    colorWarning: "#E8A838",
    colorError: "#D17A7A",
    colorInfo: "#7B8DD9",
    colorLink: "#E5B9AB",
    colorTextBase: "#F5EDE7",
    colorBgBase: "#1A1614",
    borderRadius: 8,

    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    colorBgContainer: "#241E1C",
    colorBgElevated: "#241E1C",
    colorBgLayout: "#1A1614",
    colorBorder: "#3D3532",
    colorBorderSecondary: "#2F2825",
    colorSplit: "#3D3532",
    colorText: "#F5EDE7",
    colorTextSecondary: "#BCB3AD",
    colorTextTertiary: "#9B8F88",
    colorTextQuaternary: "#6B6460",

    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    boxShadowSecondary: "0 2px 4px rgba(0,0,0,0.3)",
  },

  components: {
    Button: {
      colorPrimary: "#D4A89A",
      colorPrimaryHover: "#E5B9AB",
      colorPrimaryActive: "#C39789",
      defaultBg: "#2F2825",
      defaultBorderColor: "#3D3532",
      defaultColor: "#F5EDE7",
      fontWeight: 500,
      algorithm: true,
    },
    Input: {
      colorBgContainer: "#2F2825",
      colorBorder: "#3D3532",
      activeBorderColor: "#D4A89A",
      hoverBorderColor: "#D4A89A",
      colorText: "#F5EDE7",
      algorithm: true,
    },
    Select: {
      colorBgContainer: "#2F2825",
      colorBorder: "#3D3532",
      algorithm: true,
    },
    Card: {
      colorBgContainer: "#241E1C",
      colorBorderSecondary: "#3D3532",
      algorithm: true,
    },
    Modal: {
      contentBg: "#241E1C",
      headerBg: "#241E1C",
      algorithm: true,
    },
    Table: {
      colorBgContainer: "#241E1C",
      headerBg: "#2A2421",
      borderColor: "#3D3532",
      algorithm: true,
    },
    Menu: {
      colorBgContainer: "#241E1C",
      itemSelectedBg: "#2F2825",
      itemSelectedColor: "#D4A89A",
      algorithm: true,
    },
    Tag: {
      algorithm: true,
    },
    Progress: {
      defaultColor: "#D4A89A",
      algorithm: true,
    },
    Tabs: {
      inkBarColor: "#D4A89A",
      itemActiveColor: "#D4A89A",
      itemSelectedColor: "#D4A89A",
      itemHoverColor: "#E5B9AB",
      algorithm: true,
    },
    Badge: {
      colorError: "#E88A7E",
    },
    Divider: {
      colorSplit: "#3D3532",
    },
    Typography: { algorithm: true },
    Statistic: { algorithm: true },
    Form: { algorithm: true },
    DatePicker: {
      colorBgContainer: "#2F2825",
      colorBorder: "#3D3532",
      algorithm: true,
    },
    Collapse: {
      colorBgContainer: "#241E1C",
      colorBorder: "#3D3532",
      algorithm: true,
    },
    Drawer: {
      colorBgElevated: "#241E1C",
      algorithm: true,
    },
    Dropdown: {
      colorBgElevated: "#241E1C",
      algorithm: true,
    },
    List: {
      colorBorder: "#3D3532",
      algorithm: true,
    },
    Tooltip: { algorithm: true },
    Popover: {
      colorBgElevated: "#241E1C",
      algorithm: true,
    },
    Popconfirm: { algorithm: true },
    Steps: {
      colorPrimary: "#D4A89A",
      algorithm: true,
    },
    Timeline: { algorithm: true },
    Pagination: {
      colorPrimary: "#D4A89A",
      algorithm: true,
    },
    Segmented: {
      colorBgLayout: "#2F2825",
      itemSelectedBg: "#241E1C",
      algorithm: true,
    },
    Slider: {
      colorPrimaryBorderHover: "#E5B9AB",
      algorithm: true,
    },
    Switch: {
      colorPrimary: "#D4A89A",
      algorithm: true,
    },
    Checkbox: {
      colorPrimary: "#D4A89A",
      algorithm: true,
    },
    Radio: {
      colorPrimary: "#D4A89A",
      algorithm: true,
    },
    Upload: {
      colorPrimaryHover: "#E5B9AB",
      algorithm: true,
    },
    Calendar: {
      colorPrimary: "#D4A89A",
      algorithm: true,
    },
    Notification: {
      colorBgElevated: "#241E1C",
      algorithm: true,
    },
    Alert: { algorithm: true },
    Spin: { colorPrimary: "#D4A89A" },
    Result: { algorithm: true },
    Empty: { algorithm: true },
  },
};
```

---

## 4. Step 2 — Create a ThemeProvider Wrapper

Because this is **Next.js App Router** (server components by default), the `ConfigProvider` must live in a **client component**.

Create `src/theme/ThemeProvider.tsx`:

```tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ConfigProvider, theme as antTheme } from "antd";
import { lightTheme, darkTheme } from "./themeConfig";

// Optional: bring in your locale
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>("light");

  // Sync data-theme attribute on <html> for your CSS variables
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // Persist preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    if (saved) setMode(saved);
  }, []);

  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("theme", next);
  };

  const setTheme = (m: ThemeMode) => {
    setMode(m);
    localStorage.setItem("theme", m);
  };

  const currentTheme =
    mode === "light"
      ? lightTheme
      : {
          ...darkTheme,
          algorithm: antTheme.darkAlgorithm, // Enables antd dark derivation
        };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider
        theme={currentTheme}
        locale={enUS} // or switch based on your useLocale hook
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
```

---

## 5. Step 3 — Wire It Into the Root Layout

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "antd/dist/reset.css";
import { EventProvider } from "./contexts/EventContext";
import ThemeProvider from "@/theme/ThemeProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RBR Planning",
  description: "Wedding & Event Planning App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <EventProvider>{children}</EventProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 6. Step 4 — Global Token → CSS Variable Mapping

This is the **Rosetta Stone** between your `globals.css` variables and antd Design Tokens.

### Seed Tokens

| antd Token      | Light Value           | Dark Value | CSS Variable           |
| --------------- | --------------------- | ---------- | ---------------------- |
| `colorPrimary`  | `#C9A38C`             | `#D4A89A`  | `--primary`            |
| `colorSuccess`  | `#4A9872`             | `#6DB193`  | `--status-completed`   |
| `colorError`    | `#B85C5C`             | `#D17A7A`  | `--status-canceled`    |
| `colorInfo`     | `#5B6BC1`             | `#7B8DD9`  | `--status-in-progress` |
| `colorLink`     | `#B8927A`             | `#E5B9AB`  | `--link-color`         |
| `colorTextBase` | `#2A2421`             | `#F5EDE7`  | `--text-color`         |
| `colorBgBase`   | `#FFFBF8`             | `#1A1614`  | `--background`         |
| `borderRadius`  | `8`                   | `8`        | `--radius-md`          |
| `fontFamily`    | `Inter, system-ui...` | same       | `--font-family`        |

### Map / Alias Tokens

| antd Token             | Light Value | Dark Value | CSS Variable             |
| ---------------------- | ----------- | ---------- | ------------------------ |
| `colorBgContainer`     | `#FFFFFF`   | `#241E1C`  | `--primary-background`   |
| `colorBgElevated`      | `#FFFFFF`   | `#241E1C`  | `--card-background`      |
| `colorBgLayout`        | `#FFFBF8`   | `#1A1614`  | `--background`           |
| `colorBorder`          | `#E8DDD4`   | `#3D3532`  | `--card-border`          |
| `colorBorderSecondary` | `#F5EDE7`   | `#2F2825`  | `--divider-light`        |
| `colorSplit`           | `#E8DDD4`   | `#3D3532`  | `--divider`              |
| `colorText`            | `#2A2421`   | `#F5EDE7`  | `--text-color`           |
| `colorTextSecondary`   | `#6B6460`   | `#BCB3AD`  | `--text-color-secondary` |
| `colorTextTertiary`    | `#9B8F88`   | `#9B8F88`  | `--text-color-tertiary`  |
| `colorTextQuaternary`  | `#BCB3AD`   | `#6B6460`  | `--text-color-muted`     |

---

## 7. Step 5 — Component-by-Component Theming Checklist

Work through each feature area. For each component, the table shows which **Component Tokens** to set and which **CSS variable** they map to.

### 🔘 Button (20+ files)

| Component Token       | Light     | Dark      | CSS Variable                |
| --------------------- | --------- | --------- | --------------------------- |
| `colorPrimary`        | `#C9A38C` | `#D4A89A` | `--primary-button`          |
| `colorPrimaryHover`   | `#B8927A` | `#E5B9AB` | `--primary-button-hover`    |
| `colorPrimaryActive`  | `#A67F68` | `#C39789` | `--primary-active`          |
| `primaryColor` (text) | `#FFFFFF` | `#1A1614` | `--primary-button-text`     |
| `defaultBg`           | `#FFFFFF` | `#2F2825` | `--secondary-button`        |
| `defaultBorderColor`  | `#E8DDD4` | `#3D3532` | `--secondary-button-border` |
| `fontWeight`          | `500`     | `500`     | `--medium-font`             |

**Files to verify:**

- [ ] `event-list.tsx`
- [ ] `event-card.tsx`
- [ ] `TableAssignmentPage.tsx`
- [ ] `SidePanel.tsx`
- [ ] `Schedule.tsx`
- [ ] `ExpenseModal.tsx`
- [ ] `BudgetDashboard.tsx`
- [ ] All budget sub-components

---

### 📝 Input / InputNumber / DatePicker (15+ files)

| Component Token        | Light     | Dark      | CSS Variable           |
| ---------------------- | --------- | --------- | ---------------------- |
| `colorBgContainer`     | `#FFFFFF` | `#2F2825` | `--input-background`   |
| `colorBorder`          | `#E8DDD4` | `#3D3532` | `--input-border`       |
| `activeBorderColor`    | `#C9A38C` | `#D4A89A` | `--input-border-focus` |
| `hoverBorderColor`     | `#C9A38C` | `#D4A89A` | `--input-border-focus` |
| `colorText`            | `#2A2421` | `#F5EDE7` | `--input-text`         |
| `colorTextPlaceholder` | `#9B8F88` | `#6B6460` | `--input-placeholder`  |

**Files to verify:**

- [ ] `create-event-modal.tsx` / `ClientInfoForm.tsx`
- [ ] `SidePanel.tsx`
- [ ] `StatusFilter.tsx`
- [ ] `ExpenseModal.tsx`
- [ ] `AddTimelineItemModal.tsx`
- [ ] Budget search / filter inputs

---

### 🎴 Card (20+ files)

| Component Token        | Light     | Dark      | CSS Variable        |
| ---------------------- | --------- | --------- | ------------------- |
| `colorBgContainer`     | `#FFFFFF` | `#241E1C` | `--card-background` |
| `colorBorderSecondary` | `#E8DDD4` | `#3D3532` | `--card-border`     |

**Files to verify:**

- [ ] `event-card.tsx`
- [ ] `SeatingAIChat.tsx`
- [ ] `SidePanel.tsx`
- [ ] `CategoryCard` (budget)
- [ ] `VendorDetails`
- [ ] `PaymentCalendar`

---

### 🔲 Modal / Drawer (10+ files)

| Component Token            | Light     | Dark      | CSS Variable        |
| -------------------------- | --------- | --------- | ------------------- |
| `contentBg`                | `#FFFFFF` | `#241E1C` | `--card-background` |
| `headerBg`                 | `#FFFFFF` | `#241E1C` | `--card-background` |
| `colorBgElevated` (Drawer) | `#FFFFFF` | `#241E1C` | `--card-background` |

**Files to verify:**

- [ ] `create-event-modal.tsx`
- [ ] `ExpenseModal.tsx`
- [ ] `AddTimelineItemModal.tsx`
- [ ] Budget modals
- [ ] Table assignment drawers

---

### 📊 Table (8+ files)

| Component Token    | Light     | Dark      | CSS Variable                 |
| ------------------ | --------- | --------- | ---------------------------- |
| `colorBgContainer` | `#FFFFFF` | `#241E1C` | `--card-background`          |
| `headerBg`         | `#FAF6F2` | `#2A2421` | `--secondary-background`     |
| `borderColor`      | `#E8DDD4` | `#3D3532` | `--card-border`              |
| `rowHoverBg`       | `#F5EDE7` | `#2F2825` | `--primary-background-hover` |

**Files to verify:**

- [ ] `ExpenseList.tsx`
- [ ] `VendorList.tsx`
- [ ] `PaymentStatus.tsx`
- [ ] `ReportsPage.tsx`
- [ ] `BulkOperations.tsx`
- [ ] `MultiClientPage.tsx`

---

### 🔖 Tag (20+ files)

Tags are used **heavily** for statuses. Map the status colors:

```ts
// In your component code, use antd's color prop:
<Tag color="processing">In Progress</Tag>  // uses colorInfo
<Tag color="success">Completed</Tag>       // uses colorSuccess
<Tag color="error">Canceled</Tag>          // uses colorError
<Tag color="default">Not Started</Tag>     // uses default
```

Or for custom status badges, use your CSS variables directly:

```tsx
<Tag
  style={{
    backgroundColor: "var(--status-in-progress-bg)",
    color: "var(--status-in-progress)",
    border: "1px solid var(--status-in-progress-border)",
  }}
>
  In Progress
</Tag>
```

**Files to verify:**

- [ ] `Schedule.tsx` (status tags)
- [ ] `SidePanel.tsx` (guest tags)
- [ ] `DraggableGuestRow.tsx`
- [ ] All budget status tags

---

### 📈 Progress (7+ files)

| Component Token  | Light     | Dark      | CSS Variable            |
| ---------------- | --------- | --------- | ----------------------- |
| `defaultColor`   | `#C9A38C` | `#D4A89A` | `--progress-color`      |
| `remainingColor` | `#F0EEEC` | `#2F2825` | `--progress-background` |

**Files to verify:**

- [ ] `StatusProgressBar.tsx`
- [ ] `BudgetAllocation.tsx`
- [ ] `BudgetProgress.tsx`
- [ ] `MultiClientPage.tsx`

---

### 📑 Tabs (5+ files)

| Component Token     | Light     | Dark      | CSS Variable      |
| ------------------- | --------- | --------- | ----------------- |
| `inkBarColor`       | `#C9A38C` | `#D4A89A` | `--primary`       |
| `itemSelectedColor` | `#C9A38C` | `#D4A89A` | `--primary`       |
| `itemHoverColor`    | `#B8927A` | `#E5B9AB` | `--primary-hover` |

**Files to verify:**

- [ ] `BudgetDashboard.tsx`
- [ ] `TableAssignmentPage.tsx`
- [ ] `Schedule.tsx`

---

### 🍔 Menu (2+ files)

| Component Token     | Light     | Dark      | CSS Variable                 |
| ------------------- | --------- | --------- | ---------------------------- |
| `colorBgContainer`  | `#FFFFFF` | `#241E1C` | `--primary-background`       |
| `itemSelectedBg`    | `#F5EDE7` | `#2F2825` | `--primary-background-hover` |
| `itemSelectedColor` | `#C9A38C` | `#D4A89A` | `--primary`                  |

**Files to verify:**

- [ ] `page.tsx` (root)
- [ ] `nav-bar.tsx`

---

### 📃 Select / Dropdown (15+ files)

| Component Token                    | Light     | Dark      | CSS Variable                 |
| ---------------------------------- | --------- | --------- | ---------------------------- |
| `colorBgContainer`                 | `#FFFFFF` | `#2F2825` | `--input-background`         |
| `colorBorder`                      | `#E8DDD4` | `#3D3532` | `--input-border`             |
| `colorBgElevated` (dropdown popup) | `#FFFFFF` | `#241E1C` | `--card-background`          |
| `optionSelectedBg`                 | `#F5EDE7` | `#2F2825` | `--primary-background-hover` |

**Files to verify:**

- [ ] `SidePanel.tsx`
- [ ] `StatusFilter.tsx`
- [ ] `create-event-modal.tsx`
- [ ] All budget selects

---

### 📄 Form (6+ files)

Form inherits most tokens from the global config. Key thing: labels and validation colors.

| Token        | Light     | Dark      | CSS Variable        |
| ------------ | --------- | --------- | ------------------- |
| `labelColor` | `#2A2421` | `#F5EDE7` | `--text-color`      |
| `colorError` | `#B85C5C` | `#D17A7A` | `--status-canceled` |

**Files to verify:**

- [ ] `create-event-modal.tsx`
- [ ] `ClientInfoForm.tsx`
- [ ] `ExpenseModal.tsx`
- [ ] Budget forms

---

### 📊 Statistic (7+ files)

| Token                  | Light     | Dark      | CSS Variable             |
| ---------------------- | --------- | --------- | ------------------------ |
| `colorTextHeading`     | `#2A2421` | `#F5EDE7` | `--text-color`           |
| `colorTextDescription` | `#6B6460` | `#BCB3AD` | `--text-color-secondary` |

**Files to verify:**

- [ ] `BudgetStats.tsx`
- [ ] `VendorDetails.tsx`
- [ ] `ReportsPage.tsx`

---

### 🔔 Badge (5+ files)

| Component Token | Light     | Dark      | CSS Variable    |
| --------------- | --------- | --------- | --------------- |
| `colorError`    | `#D4756B` | `#E88A7E` | `--badge-color` |

**Files to verify:**

- [ ] `nav-bar.tsx`
- [ ] `TableTileContent.tsx`
- [ ] `Notifications.tsx`

---

### ➖ Divider (5+ files)

| Component Token | Light     | Dark      | CSS Variable |
| --------------- | --------- | --------- | ------------ |
| `colorSplit`    | `#E8DDD4` | `#3D3532` | `--divider`  |

---

### 📝 Typography (20+ files)

Typography will inherit global `colorText*` tokens automatically.

| Token                  | Maps to                  |
| ---------------------- | ------------------------ |
| `colorTextHeading`     | `--text-color`           |
| `colorText`            | `--text-color`           |
| `colorTextSecondary`   | `--text-color-secondary` |
| `colorTextDescription` | `--text-color-secondary` |

---

### 📦 Collapse (Budget feature)

| Token              | Light     | Dark      | CSS Variable             |
| ------------------ | --------- | --------- | ------------------------ |
| `colorBgContainer` | `#FFFFFF` | `#241E1C` | `--card-background`      |
| `colorBorder`      | `#E8DDD4` | `#3D3532` | `--card-border`          |
| `headerBg`         | `#FAF6F2` | `#2A2421` | `--secondary-background` |

---

### 🗓 Calendar (Budget PaymentCalendar)

| Token              | Light     | Dark      | CSS Variable        |
| ------------------ | --------- | --------- | ------------------- |
| `colorPrimary`     | `#C9A38C` | `#D4A89A` | `--primary`         |
| `colorBgContainer` | `#FFFFFF` | `#241E1C` | `--card-background` |

---

### ⏳ Steps / Timeline (Schedule, Budget)

| Token                  | Light     | Dark      | CSS Variable             |
| ---------------------- | --------- | --------- | ------------------------ |
| `colorPrimary`         | `#C9A38C` | `#D4A89A` | `--primary`              |
| `colorTextDescription` | `#6B6460` | `#BCB3AD` | `--text-color-secondary` |

---

### 📋 List (SidePanel, SeatingAIChat, Budget)

| Token              | Light     | Dark      | CSS Variable           |
| ------------------ | --------- | --------- | ---------------------- |
| `colorBorder`      | `#E8DDD4` | `#3D3532` | `--card-border`        |
| `colorBgContainer` | `#FFFFFF` | `#241E1C` | `--primary-background` |

---

### 🎚 Segmented (SidePanel)

| Token            | Light     | Dark      | CSS Variable            |
| ---------------- | --------- | --------- | ----------------------- |
| `colorBgLayout`  | `#F0EEEC` | `#2F2825` | `--progress-background` |
| `itemSelectedBg` | `#FFFFFF` | `#241E1C` | `--primary-background`  |

---

### ⚙️ Other Components (Spin, Empty, Result, Popconfirm, Switch, Checkbox, Radio, Slider, Upload, Alert, notification, message)

These all inherit from global tokens when `algorithm: true` is set. The key tokens are:

- `colorPrimary` → your wedding accent color
- `colorBgContainer` / `colorBgElevated` → surface backgrounds
- `colorBorder` → borders

No extra per-component work needed beyond what's in `themeConfig.ts`.

> **Note on `message` and `notification`:** These are called via static methods (`message.success(...)`) which don't have React context. Wrap your app with antd's `<App>` component to make them respect the theme:
>
> ```tsx
> import { App } from "antd";
>
> // Inside your ThemeProvider, wrap children:
> <ConfigProvider theme={currentTheme}>
>   <App>{children}</App>
> </ConfigProvider>;
> ```
>
> Then in components use `const { message, notification } = App.useApp();` instead of the static imports.

---

## 8. Step 6 — Dark Mode Toggle

Add a toggle button in your navbar or header:

```tsx
"use client";
import { useTheme } from "@/theme/ThemeProvider";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button } from "antd";

export function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    />
  );
}
```

This will:

1. Toggle `data-theme` on `<html>` → your CSS variables switch
2. Swap the antd `ConfigProvider` theme → all antd components switch
3. Persist to `localStorage`

---

## 9. Step 7 — ConfigProvider className / style Overrides

For things that tokens **can't** handle (gradients, complex pseudo-elements, specific padding), use ConfigProvider's `className` prop:

```tsx
<ConfigProvider
  button={{ className: 'wedding-btn' }}
  card={{ className: 'wedding-card' }}
  input={{ className: 'wedding-input' }}
  // ... etc for any component
>
```

Then in `globals.css` add targeted overrides:

```css
/* Example: softer focus ring using your CSS variables */
.wedding-input .ant-input:focus {
  box-shadow: 0 0 0 3px rgba(201, 163, 140, 0.15);
}

/* Example: card hover lift */
.wedding-card.ant-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

This is the approach the Ant Design blog recommends for **theme extension** beyond tokens.

---

## 10. Step 8 — Testing Checklist

### Per-Feature Verification

| Feature               | Route / Page                       | Components to Check                                                                                                         |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Home / Events Hub** | `/`                                | Menu, Card, Button, Typography                                                                                              |
| **Event List**        | Events list page                   | Table, Tag, Button, Progress, Badge, Select, Pagination                                                                     |
| **Create Event**      | Modal                              | Modal, Form, Input, Select, DatePicker, Button                                                                              |
| **Table Assignment**  | `/budget/[id]/dashboard` → seating | Card, Segmented, List, Input, Tag, Select, Popover, Badge, Drawer, Button, Empty                                            |
| **Schedule**          | Schedule tab                       | Timeline, Steps, Checkbox, Tag, Button, Progress, Input, Select, Modal, Form, DatePicker, Radio, Collapse                   |
| **Budget Dashboard**  | Budget tab                         | Tabs, Card, Statistic, Progress, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Collapse, Divider, Typography |
| **Budget Vendors**    | Vendors sub-tab                    | Table, Card, Descriptions, Tag, Button, Form, Select, Statistic, Divider, Badge                                             |
| **Budget Payments**   | Payments sub-tab                   | Table, Calendar, Tag, Select, Form, Modal, Steps, Statistic                                                                 |
| **Budget Reports**    | Reports sub-tab                    | Card, Statistic, Table, Divider, Button, Typography                                                                         |
| **Budget Planner**    | Planner sub-tab                    | Slider, InputNumber, Card, Button, Progress, Statistic                                                                      |
| **AI Chat**           | Seating AI                         | Card, Input, Button, List, Avatar, Spin, Tag                                                                                |
| **Multi-Client**      | Multi-client page                  | Card, Table, Typography, Progress, Tag, Select, Statistic                                                                   |

### Visual Testing Steps

For each page:

1. [ ] **Light mode** — verify all components use warm wedding palette (creams, tans, warm grays)
2. [ ] **Dark mode** — toggle and verify backgrounds are dark (#1A1614 / #241E1C), text is light, accents remain warm
3. [ ] **Hover states** — buttons, cards, table rows should use the correct hover colors
4. [ ] **Focus states** — inputs, selects should show the warm border focus (#C9A38C / #D4A89A)
5. [ ] **Status colors** — tags and badges use the correct status colors in both modes
6. [ ] **Modals/Drawers** — open and verify background, text, borders all match theme
7. [ ] **Scrollbar** — ensure scrollbars still use the subtle styling from globals.css
8. [ ] **message/notification** — trigger one and verify it matches theme (requires App wrapper)

---

## 11. FAQ & Tips

### Q: Should I use `algorithm: true` on every component?

**Yes, for most components.** When `algorithm: true` is set, the component derives its full color palette from the Seed Tokens you provided. Without it, component tokens only directly override — they don't cascade.

### Q: Why both CSS variables AND antd tokens?

Your `globals.css` variables control **your own custom components** (non-antd). The antd `ConfigProvider` tokens control **antd components**. Both need to stay in sync for visual consistency.

### Q: Can I use CSS variables directly in antd token values?

**No.** Ant Design's CSS-in-JS engine doesn't resolve CSS `var()` at build time. You must use literal color values in `themeConfig.ts`. Keep them in sync manually or create a shared constants file:

```ts
// src/theme/colors.ts
export const colors = {
  light: {
    primary: "#C9A38C",
    primaryHover: "#B8927A",
    // ... etc
  },
  dark: {
    primary: "#D4A89A",
    primaryHover: "#E5B9AB",
    // ... etc
  },
};
```

Then import in both `themeConfig.ts` and any component that needs the raw values.

### Q: What about the `message` and `notification` static methods?

Wrap your app content with antd's `<App>` component and use the hook-based APIs:

```tsx
// Instead of:
import { message } from "antd";
message.success("Done!");

// Use:
const { message } = App.useApp();
message.success("Done!");
```

### Q: How do I handle the locale?

Your existing `useLocale` hook can be integrated into the `ThemeProvider`:

```tsx
const locale = useLocale(); // returns 'en' or 'es'
<ConfigProvider locale={locale === 'es' ? esES : enUS} theme={currentTheme}>
```

### Q: What if a component still looks wrong after theming?

1. First check if the component has a **Component Token** you missed → [antd Component Token docs](https://ant.design/components/button#design-token)
2. Use the **ConfigProvider className approach** (Step 7) for anything tokens can't handle
3. As a last resort, use CSS overrides with `[data-theme="dark"]` selectors in your module CSS files

### Q: Order of implementation?

Recommended order (highest impact first):

1. **ThemeProvider + layout.tsx** (Steps 2–3) — gets global tokens working
2. **Button, Input, Card, Modal** — covers 80% of visual surface
3. **Table, Tag, Progress, Tabs** — covers data-heavy pages
4. **Menu, Select, Form, Divider** — navigation and forms
5. **Everything else** — Badge, Steps, Timeline, Calendar, etc.
6. **Dark mode toggle** — once everything looks good in light mode
7. **Static methods** (message/notification) — wrap with App component
8. **QA pass** — go through testing checklist

---

## Quick Reference: File Locations

| File                          | Purpose                               |
| ----------------------------- | ------------------------------------- |
| `src/app/globals.css`         | CSS variables (light + dark)          |
| `src/theme/themeConfig.ts`    | Ant Design theme configs              |
| `src/theme/ThemeProvider.tsx` | ConfigProvider + dark mode context    |
| `src/theme/colors.ts`         | (optional) Shared color constants     |
| `src/app/layout.tsx`          | Root layout — wrap with ThemeProvider |

---

**Happy theming! 🎨**
