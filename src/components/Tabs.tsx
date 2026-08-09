'use client';

import {
  Children,
  isValidElement,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

// Tabs / Tab — WAI-ARIA tab panel pattern with automatic activation.
//
//   <Tabs>
//     <Tab label="Researcher view">…</Tab>
//     <Tab label="Supervisor view">…</Tab>
//   </Tabs>
//
// `Tab` is a thin marker component; `Tabs` introspects its children to
// extract labels and render the tab list. Keyboard model:
//
//   ←/Home          focus + activate previous tab (wraps)
//   →/End           focus + activate next tab (wraps)
//   Tab             leave the tab list (roving tabindex)
//
// Automatic activation is appropriate here because all panel content
// is already in the DOM — switching is free, and matching keyboard
// focus to the visible panel feels more responsive.

type TabProps = { label: string; children: ReactNode };

export function Tab(_props: TabProps): ReactNode {
  // Marker only — Tabs walks `children` and renders the panel itself.
  return null;
}

type TabElement = ReactElement<TabProps>;

function isTabElement(node: ReactNode): node is TabElement {
  return (
    isValidElement(node) &&
    typeof (node as ReactElement<{ label?: unknown }>).props.label === 'string'
  );
}

export function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(isTabElement);
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (tabs.length === 0) return null;

  function focusTab(index: number) {
    const next = ((index % tabs.length) + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        focusTab(index + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusTab(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
    }
  }

  return (
    <div className="tabs">
      <div role="tablist" className="tabs-list">
        {tabs.map((tab, index) => {
          const tabId = `${baseId}-tab-${index}`;
          const panelId = `${baseId}-panel-${index}`;
          const selected = index === active;
          return (
            <button
              key={tabId}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              className="tabs-tab"
              data-active={selected || undefined}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.props.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => {
        const tabId = `${baseId}-tab-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        const selected = index === active;
        return (
          <div
            key={panelId}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!selected}
            tabIndex={0}
            className="tabs-panel"
          >
            {tab.props.children}
          </div>
        );
      })}
    </div>
  );
}
