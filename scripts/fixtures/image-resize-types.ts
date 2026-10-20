// Type-checked, never run: `check:components` compiles this file against the
// built declarations. What it holds is the shape an application writes against:
// the options, the event's detail, and the return, which a test run in JavaScript
// cannot refuse.
import {
  attachImageResize,
  clampImageWidth,
  imageWidthForDrag,
  imageWidthForKey,
  IMAGE_RESIZE_EVENT,
  type ImageResizeControl,
  type ImageResizeDetail,
  type ImageResizeEvent,
} from '../../dist/src/a11y/index.js';

declare const handle: HTMLElement;
declare const frame: HTMLElement;

export const control: ImageResizeControl = attachImageResize({
  handle,
  frame,
  width: 50,
  min: 10,
  max: 100,
  step: 5,
  pageStep: 25,
  valueText: (width) => `${width} of 100`,
});
control.update(75);
control.destroy();

// The event's detail is typed: the phase is one of three, the source one of two.
handle.addEventListener(IMAGE_RESIZE_EVENT, (event) => {
  const { width, phase, source } = (event as ImageResizeEvent).detail;
  const w: number = width;
  const p: 'move' | 'commit' | 'cancel' = phase;
  const s: 'pointer' | 'keyboard' = source;
  void [w, p, s];
});
export const detail: ImageResizeDetail = { width: 60, phase: 'commit', source: 'keyboard' };

export const next: number = clampImageWidth(120);
export const key: number | null = imageWidthForKey('ArrowRight', 50, { rtl: true });
export const drag: number = imageWidthForDrag(50, 40, 400, { rtl: false, min: 20 });

// @ts-expect-error a width is a number, not the string a style holds
attachImageResize({ handle, frame, width: '50%' });
// @ts-expect-error the handle and the frame are both required
attachImageResize({ width: 50 });
// @ts-expect-error a phase the helper does not send
export const refused: ImageResizeDetail = { width: 60, phase: 'end', source: 'pointer' };
