import React, { useRef, useState, useEffect } from 'react';

export interface ScreenshotEditorProps {
  screenshot: Blob;
  onSave: (editedScreenshot: Blob) => void;
  onCancel: () => void;
}

type DrawingTool = 'arrow' | 'rectangle' | 'circle' | 'pen' | 'text';
type DrawingColor = 'red' | 'blue' | 'green' | 'yellow' | 'black';

interface Point {
  x: number;
  y: number;
}

/**
 * Screenshot Editor Component
 * Allows users to annotate screenshots with arrows, shapes, and text
 */
export const ScreenshotEditor: React.FC<ScreenshotEditorProps> = ({
  screenshot,
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<DrawingTool>('arrow');
  const [color, setColor] = useState<DrawingColor>('red');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [penPath, setPenPath] = useState<Point[]>([]);

  // Load screenshot onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setCtx(context);

    const img = new Image();
    const url = URL.createObjectURL(screenshot);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [screenshot]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getColorValue = (c: DrawingColor): string => {
    const colors: Record<DrawingColor, string> = {
      red: '#FF0000',
      blue: '#0000FF',
      green: '#00FF00',
      yellow: '#FFFF00',
      black: '#000000',
    };
    return colors[c];
  };

  const drawArrow = (from: Point, to: Point, ctx: CanvasRenderingContext2D) => {
    const headLength = 20;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLength * Math.cos(angle - Math.PI / 6),
      to.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - headLength * Math.cos(angle + Math.PI / 6),
      to.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(to.x, to.y);
    ctx.fill();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx) return;

    const point = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(point);
    setImageData(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height));

    if (tool === 'pen') {
      setPenPath([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ctx || !isDrawing || !startPoint || !imageData) return;

    const point = getMousePos(e);

    if (tool === 'pen') {
      setPenPath((prev) => [...prev, point]);
      ctx.strokeStyle = getColorValue(color);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(penPath[penPath.length - 1].x, penPath[penPath.length - 1].y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      return;
    }

    // Restore image for preview
    ctx.putImageData(imageData, 0, 0);

    ctx.strokeStyle = getColorValue(color);
    ctx.fillStyle = getColorValue(color);
    ctx.lineWidth = 3;

    switch (tool) {
      case 'arrow':
        drawArrow(startPoint, point, ctx);
        break;
      case 'rectangle':
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          point.x - startPoint.x,
          point.y - startPoint.y
        );
        break;
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(null);
    setImageData(null);
    setPenPath([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png');
  };

  const toolButtons: { tool: DrawingTool; label: string; icon: string }[] = [
    { tool: 'arrow', label: 'Pfeil', icon: '➡️' },
    { tool: 'rectangle', label: 'Rechteck', icon: '⬜' },
    { tool: 'circle', label: 'Kreis', icon: '⭕' },
    { tool: 'pen', label: 'Stift', icon: '✏️' },
  ];

  const colorButtons: DrawingColor[] = ['red', 'blue', 'green', 'yellow', 'black'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {toolButtons.map((t) => (
            <button
              key={t.tool}
              onClick={() => setTool(t.tool)}
              style={{
                padding: '8px 12px',
                backgroundColor: tool === t.tool ? '#4CAF50' : 'white',
                color: tool === t.tool ? 'white' : 'black',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title={t.label}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: '#ddd',
          }}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Farbe:</span>
          {colorButtons.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: getColorValue(c),
                border: color === c ? '3px solid #333' : '1px solid #ddd',
                borderRadius: '50%',
                cursor: 'pointer',
              }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            cursor: 'crosshair',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        />
      </div>

      {/* Action Buttons */}
      <div
        style={{
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          Speichern
        </button>
      </div>
    </div>
  );
};
