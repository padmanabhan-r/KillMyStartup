import { useState } from 'react';
import type { Source } from '../types';
import { getDomain } from '../types';

interface Props {
  sources: Source[];
  idea: string;
}

export function SourcesPanel({ sources, idea }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (sources.length === 0) return null;

  return (
    <aside className={`sources-panel ${expanded ? 'sources-panel--expanded' : 'sources-panel--collapsed'}`}>
      <button className="sources-panel__toggle" onClick={() => setExpanded((e) => !e)}>
        <span className="sources-panel__chevron">{expanded ? '›' : '‹'}</span>
      </button>

      {expanded && (
        <div className="sources-panel__content">
          <div className="sources-panel__header">
            <p className="sources-panel__eyebrow">Researched</p>
            <h2 className="sources-panel__idea">{idea}</h2>
          </div>

          <ul className="sources-list">
            {sources.map((source, i) => (
              <li key={`${source.url}-${i}`} className="source-card" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="source-card__top">
                  <img
                    className="source-card__favicon"
                    src={`https://www.google.com/s2/favicons?domain=${source.url}&sz=32`}
                    alt=""
                    width={14}
                    height={14}
                  />
                  <span className="source-card__domain">{getDomain(source.url)}</span>
                </div>
                <a
                  className="source-card__title"
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title}
                </a>
                {source.description && (
                  <p className="source-card__description">{source.description}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
