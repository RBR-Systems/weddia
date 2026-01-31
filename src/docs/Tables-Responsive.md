# Canvas Scaling System - Core Implementation

## Problem

Display wedding venues of any size (600-6000+ sq ft) in the same viewport while maintaining accurate proportions.

## Solution: Dual Coordinate System

**Room Coordinates** = Real venue dimensions (e.g., 1200×800 feet)  
**Screen Coordinates** = Pixel positions on screen

Scale = min(viewportWidth/roomWidth, viewportHeight/roomHeight)

---

## 1. Core Types (types/canvas.types.ts)

```typescript
export interface RoomDimensions {
  width: number;
  height: number;
  unit: "feet" | "meters";
}

export interface Position {
  x: number;
  y: number;
}

export interface Table {
  id: string;
  shape: "round" | "rectangular" | "square";
  capacity: number;
  width: number;
  height: number;
  position: Position;
  rotation: number;
  assignedGuests: string[];
}

export interface SeatingLayout {
  id: string;
  eventId: string;
  roomDimensions: RoomDimensions;
  tables: Table[];
  backgroundImage?: string;
}
```

---

## 2. Canvas Scaler (utils/canvas-scaler.ts)

```typescript
export class CanvasScaler {
  private scale: number;
  private offset: Position;
  private roomDimensions: RoomDimensions;

  constructor(
    roomDimensions: RoomDimensions,
    containerElement: HTMLElement,
    padding = 40,
  ) {
    const rect = containerElement.getBoundingClientRect();
    const availableWidth = rect.width - padding * 2;
    const availableHeight = rect.height - padding * 2;

    this.scale = Math.min(
      availableWidth / roomDimensions.width,
      availableHeight / roomDimensions.height,
    );

    const scaledWidth = roomDimensions.width * this.scale;
    const scaledHeight = roomDimensions.height * this.scale;

    this.offset = {
      x: (availableWidth - scaledWidth) / 2 + padding,
      y: (availableHeight - scaledHeight) / 2 + padding,
    };

    this.roomDimensions = roomDimensions;
  }

  roomToScreen(x: number, y: number): Position {
    return {
      x: x * this.scale + this.offset.x,
      y: y * this.scale + this.offset.y,
    };
  }

  screenToRoom(x: number, y: number): Position {
    return {
      x: (x - this.offset.x) / this.scale,
      y: (y - this.offset.y) / this.scale,
    };
  }

  scaleDimension(dimension: number): number {
    return dimension * this.scale;
  }

  constrainPosition(
    x: number,
    y: number,
    width: number,
    height: number,
  ): Position {
    return {
      x: Math.max(
        width / 2,
        Math.min(x, this.roomDimensions.width - width / 2),
      ),
      y: Math.max(
        height / 2,
        Math.min(y, this.roomDimensions.height - height / 2),
      ),
    };
  }
}
```

---

## 3. Main Canvas Component (components/SeatingCanvas.tsx)

```typescript
import { useEffect, useRef, useState } from 'react';
import { CanvasScaler } from '../utils/canvas-scaler';
import { SeatingLayout } from '../types/canvas.types';

interface Props {
  layout: SeatingLayout;
  onTableMove: (tableId: string, x: number, y: number) => void;
}

export function SeatingCanvas({ layout, onTableMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaler, setScaler] = useState<CanvasScaler | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScaler = () => {
      setScaler(new CanvasScaler(layout.roomDimensions, containerRef.current!));
    };

    updateScaler();
    window.addEventListener('resize', updateScaler);
    return () => window.removeEventListener('resize', updateScaler);
  }, [layout.roomDimensions]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scaler || !draggingId) return;

    const table = layout.tables.find(t => t.id === draggingId);
    if (!table) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const roomPos = scaler.screenToRoom(screenPos.x, screenPos.y);
    const constrained = scaler.constrainPosition(roomPos.x, roomPos.y, table.width, table.height);

    onTableMove(draggingId, constrained.x, constrained.y);
  };

  if (!scaler) return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDraggingId(null)}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#f5f5f5' }}
    >
      {/* Room boundary */}
      <div
        style={{
          position: 'absolute',
          left: scaler.offset.x,
          top: scaler.offset.y,
          width: scaler.scaleDimension(layout.roomDimensions.width),
          height: scaler.scaleDimension(layout.roomDimensions.height),
          border: '2px solid #333'
        }}
      />

      {/* Tables */}
      {layout.tables.map(table => {
        const screenPos = scaler.roomToScreen(table.position.x, table.position.y);
        const width = scaler.scaleDimension(table.width);
        const height = scaler.scaleDimension(table.height);

        return (
          <div
            key={table.id}
            onMouseDown={() => setDraggingId(table.id)}
            style={{
              position: 'absolute',
              left: screenPos.x - width/2,
              top: screenPos.y - height/2,
              width,
              height,
              background: '#fff',
              border: '2px solid #333',
              borderRadius: table.shape === 'round' ? '50%' : '8px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: Math.max(12, width/8) }}>
              Table {table.id}
              <br />
              {table.assignedGuests.length}/{table.capacity}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 4. Usage Example

```typescript
const [layout, setLayout] = useState<SeatingLayout>({
  id: 'layout-1',
  eventId: 'event-1',
  roomDimensions: { width: 1200, height: 800, unit: 'feet' },
  tables: [
    {
      id: 'table-1',
      shape: 'round',
      capacity: 8,
      width: 150,
      height: 150,
      position: { x: 300, y: 400 },
      rotation: 0,
      assignedGuests: []
    }
  ]
});

function handleTableMove(tableId: string, x: number, y: number) {
  setLayout(prev => ({
    ...prev,
    tables: prev.tables.map(t =>
      t.id === tableId ? { ...t, position: { x, y } } : t
    )
  }));
}

<SeatingCanvas layout={layout} onTableMove={handleTableMove} />
```

---

## Key Points

1. **Always store positions in room coordinates** - this makes layouts portable
2. **Convert to screen coordinates only for rendering** - use `roomToScreen()`
3. **Convert from screen coordinates for mouse events** - use `screenToRoom()`
4. **Recreate scaler on resize** - ensures proper scaling on window changes
5. **Constrain positions** - use `constrainPosition()` to keep tables in bounds

This is the minimal implementation. Add features incrementally: collision detection, auto-layout, grid overlay, etc.
