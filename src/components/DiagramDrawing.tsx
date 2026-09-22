import React, { memo, useLayoutEffect, useRef } from 'react';

interface DiagramDrawingProps {
  id: string;
  markup: string;
  zoom: number;
  panX: number;
  panY: number;
  panning: boolean;
  selectedId: number | null;
  highlightEnabled: boolean;
  onSelect: (id: number) => void;
}

/** React owns the host; generated SVG remains inside this one DOM boundary. */
export const DiagramDrawing = memo(function DiagramDrawing({
  id, markup, zoom, panX, panY, panning, selectedId, highlightEnabled, onSelect,
}: DiagramDrawingProps) {
  const host = useRef<HTMLDivElement>(null);
  const hovered = useRef<Element | null>(null);

  // Hit areas are rebuilt only when the diagram changes, never during panning.
  useLayoutEffect(() => {
    const areas: SVGRectElement[] = [];
    host.current?.querySelectorAll<SVGGraphicsElement>('g[data-element-id], svg[data-element-id]').forEach(group => {
      if (group.querySelector('[data-element-id]')) return;
      const box = group.getBBox();
      if (!box.width && !box.height) return;
      const area = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const elementId = group.getAttribute('data-element-id');
      area.setAttribute('x', String(box.x - 4));
      area.setAttribute('y', String(box.y - 4));
      area.setAttribute('width', String(box.width + 8));
      area.setAttribute('height', String(box.height + 8));
      area.setAttribute('fill', 'transparent');
      area.setAttribute('stroke', 'none');
      area.setAttribute('data-diagram-hit-area', '');
      if (elementId) area.setAttribute('data-element-id', elementId);
      // The transparent rectangle is the interaction surface for the whole
      // element, including empty space inside its visible SVG bounds.
      area.setAttribute('pointer-events', 'all');
      group.insertBefore(area, group.firstChild);
      areas.push(area);
    });
    return () => areas.forEach(area => area.remove());
  // React can replace dangerously-set inner HTML during selection updates;
  // rebuild the interaction rectangles whenever that host is rendered again.
  }, [markup, selectedId, highlightEnabled]);

  useLayoutEffect(() => {
    const selectedElements = highlightEnabled && selectedId !== null
      ? host.current?.querySelectorAll(`[data-element-id="${selectedId}"]:not([data-diagram-hit-area])`)
      : [];
    selectedElements?.forEach(element => element.classList.add('diagram-selected'));
    host.current?.querySelectorAll<SVGElement>('[data-diagram-hit-area]').forEach(area => {
      const selected = highlightEnabled && selectedId !== null
        && area.getAttribute('data-element-id') === String(selectedId);
      area.toggleAttribute('data-selected', selected);
    });
    return () => selectedElements?.forEach(element => element.classList.remove('diagram-selected'));
  }, [markup, selectedId, highlightEnabled]);

  useLayoutEffect(() => {
    hovered.current?.classList.remove('diagram-hover');
    hovered.current = null;
  }, [markup, highlightEnabled]);

  const elementAt = (target: EventTarget) => {
    const element = target instanceof Element
      ? target.closest('[data-diagram-hit-area], [data-element-id]')
      : null;
    return element && host.current?.contains(element) ? element : null;
  };

  const updateHovered = (target: EventTarget) => {
    const element = highlightEnabled ? elementAt(target) : null;
    if (hovered.current === element) return;
    hovered.current?.classList.remove('diagram-hover');
    hovered.current = element;
    element?.classList.add('diagram-hover');
  };

  return <div
    ref={host}
    id={id}
    className="diagram-drawing"
    onClick={event => {
      const element = elementAt(event.target);
      const elementId = Number(element?.getAttribute('data-element-id'));
      if (!Number.isInteger(elementId) || elementId <= 0) return;
      event.stopPropagation();
      onSelect(elementId);
    }}
    onPointerOver={event => updateHovered(event.target)}
    onPointerMove={event => updateHovered(event.target)}
    onPointerLeave={() => {
      hovered.current?.classList.remove('diagram-hover');
      hovered.current = null;
    }}
    onDragStart={event => event.preventDefault()}
    style={{
      width: '100%', height: '100%',
      cursor: panning ? 'grabbing' : 'grab',
      // Keep the drawing on its own compositor layer while wheel events update
      // the transform. This avoids subpixel repaint jitter on large SVGs.
      transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`,
      transformOrigin: 'top left',
      willChange: 'transform',
      backfaceVisibility: 'hidden',
    }}
    dangerouslySetInnerHTML={{ __html: markup }}
  />;
});
