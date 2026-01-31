# Canvas Features - Add-ons

Build on core implementation with these features.

---

## Collision Detection (utils/collision.ts)

```typescript
import { Table } from "../types/canvas.types";

export function tablesCollide(
  table1: Table,
  table2: Table,
  clearance = 24,
): boolean {
  if (table1.shape === "round" && table2.shape === "round") {
    const dx = table1.position.x - table2.position.x;
    const dy = table1.position.y - table2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < table1.width / 2 + table2.width / 2 + clearance;
  }

  // Rectangle collision (simplified)
  const rect1 = {
    x: table1.position.x - table1.width / 2 - clearance,
    y: table1.position.y - table1.height / 2 - clearance,
    w: table1.width + clearance * 2,
    h: table1.height + clearance * 2,
  };
  const rect2 = {
    x: table2.position.x - table2.width / 2,
    y: table2.position.y - table2.height / 2,
    w: table2.width,
    h: table2.height,
  };

  return !(
    rect1.x + rect1.w < rect2.x ||
    rect2.x + rect2.w < rect1.x ||
    rect1.y + rect1.h < rect2.y ||
    rect2.y + rect2.h < rect1.y
  );
}

export function hasCollision(table: Table, others: Table[]): boolean {
  return others.some(
    (other) => other.id !== table.id && tablesCollide(table, other),
  );
}
```

Use in canvas:

```typescript
const constrained = scaler.constrainPosition(
  roomPos.x,
  roomPos.y,
  table.width,
  table.height,
);
const testTable = { ...table, position: constrained };
if (!hasCollision(testTable, layout.tables)) {
  onTableMove(draggingId, constrained.x, constrained.y);
}
```

---

## Grid Overlay (components/GridOverlay.tsx)

```typescript
interface Props {
  scaler: CanvasScaler;
  roomDimensions: { width: number; height: number };
  gridSize?: number;
}

export function GridOverlay({ scaler, roomDimensions, gridSize = 100 }: Props) {
  const lines = [];

  for (let x = 0; x <= roomDimensions.width; x += gridSize) {
    const start = scaler.roomToScreen(x, 0);
    const end = scaler.roomToScreen(x, roomDimensions.height);
    lines.push(
      <line key={`v${x}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            stroke="#e0e0e0" strokeWidth="1" opacity="0.3" />
    );
  }

  for (let y = 0; y <= roomDimensions.height; y += gridSize) {
    const start = scaler.roomToScreen(0, y);
    const end = scaler.roomToScreen(roomDimensions.width, y);
    lines.push(
      <line key={`h${y}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            stroke="#e0e0e0" strokeWidth="1" opacity="0.3" />
    );
  }

  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {lines}
    </svg>
  );
}
```

---

## Auto-Layout Algorithms (utils/auto-layout.ts)

### Grid Layout

```typescript
export function arrangeInGrid(
  tables: Table[],
  roomDim: RoomDimensions,
  spacing = 200,
) {
  const cols = Math.floor(roomDim.width / spacing);
  const rows = Math.floor(roomDim.height / spacing);

  return tables.map((table, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...table,
      position: {
        x: (col + 1) * (roomDim.width / (cols + 1)),
        y: (row + 1) * (roomDim.height / (rows + 1)),
      },
    };
  });
}
```

### Circle Layout

```typescript
export function arrangeInCircle(tables: Table[], roomDim: RoomDimensions) {
  const cx = roomDim.width / 2;
  const cy = roomDim.height / 2;
  const radius = Math.min(roomDim.width, roomDim.height) * 0.35;

  return tables.map((table, i) => {
    const angle = (i / tables.length) * 2 * Math.PI;
    return {
      ...table,
      position: {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      },
      rotation: (angle * 180) / Math.PI + 90,
    };
  });
}
```

---

## Fixed Elements (dance floor, stage, etc.)

Add to types:

```typescript
export interface FixedElement {
  id: string;
  type: "danceFloor" | "stage" | "bar";
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Render in canvas:

```typescript
{layout.fixedElements?.map(el => {
  const pos = scaler.roomToScreen(el.x, el.y);
  const w = scaler.scaleDimension(el.width);
  const h = scaler.scaleDimension(el.height);

  return (
    <div key={el.id} style={{
      position: 'absolute',
      left: pos.x, top: pos.y,
      width: w, height: h,
      background: 'rgba(139,69,19,0.6)',
      border: '2px dashed #8B4513',
      pointerEvents: 'none'
    }}>
      {el.type}
    </div>
  );
})}
```

---

## Selection & Hover States

Add to canvas state:

```typescript
const [selectedId, setSelectedId] = useState<string | null>(null);
const [hoveredId, setHoveredId] = useState<string | null>(null);
```

Update table style:

```typescript
style={{
  // ... existing styles
  border: table.id === selectedId ? '3px solid #2196F3' : '2px solid #333',
  boxShadow: table.id === hoveredId ? '0 8px 16px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
  zIndex: table.id === draggingId ? 1000 : table.id === selectedId ? 900 : 100
}}
onMouseEnter={() => setHoveredId(table.id)}
onMouseLeave={() => setHoveredId(null)}
onClick={() => setSelectedId(table.id)}
```

---

## Performance for 50+ Tables

Memoize table component:

```typescript
const TableItem = memo(({ table, scaler, ... }) => {
  // render logic
}, (prev, next) =>
  prev.table.id === next.table.id &&
  prev.table.position.x === next.table.position.x &&
  prev.table.position.y === next.table.position.y
);
```

Debounce drag updates:

```typescript
import { debounce } from "lodash";

const debouncedMove = useMemo(
  () =>
    debounce((id: string, x: number, y: number) => {
      onTableMove(id, x, y);
    }, 16), // ~60fps
  [onTableMove],
);
```

---

## Export/Import Layouts

```typescript
export function exportLayout(layout: SeatingLayout): string {
  return JSON.stringify(layout, null, 2);
}

export function importLayout(json: string): SeatingLayout {
  const data = JSON.parse(json);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}
```

---

## Integration with AI Chat

Example prompts to handle:

```typescript
function handleAICommand(command: string, layout: SeatingLayout) {
  if (command.includes("arrange in grid")) {
    return {
      ...layout,
      tables: arrangeInGrid(layout.tables, layout.roomDimensions),
    };
  }
  if (command.includes("arrange in circle")) {
    return {
      ...layout,
      tables: arrangeInCircle(layout.tables, layout.roomDimensions),
    };
  }
  if (command.includes("group families")) {
    // Your family grouping logic
  }
  return layout;
}
```

---

## Add Each Feature One at a Time

1. Start with core canvas (previous doc)
2. Add collision detection
3. Add grid overlay
4. Add auto-layout
5. Add fixed elements
6. Add selection states
7. Optimize performance
8. Add AI integration
