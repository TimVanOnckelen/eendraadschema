/**
 * DocumentationView - React component for documentation page
 */

import React from 'react';
import { Icon } from './Icon';
import { IconName } from '../utils/icons';

interface GuideCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  intro: string;
  topics: string[];
  onOpen: () => void;
}

const GuideCard: React.FC<GuideCardProps> = ({ icon, title, subtitle, intro, topics, onOpen }) => (
  <section className="card">
    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="doc-card-header">
        <div className="doc-card-icon"><Icon name={icon} size={18} /></div>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>{title}</h3>
          <p className="meta-text" style={{ margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      <p>{intro}</p>
      <ul style={{ flexGrow: 1 }}>
        {topics.map((topic) => <li key={topic}>{topic}</li>)}
      </ul>
      <div className="doc-card-footer">
        <button className="btn btn-primary" onClick={onOpen}>
          Handleiding openen
          <Icon name="external-link" size={14} />
        </button>
      </div>
    </div>
  </section>
);

export const DocumentationView: React.FC = () => {
  const handleOpenNewSitPlanGuide = () => {
    window.open('Documentation/sitplan-guide.html', '_blank');
  };

  const handleOpenNewEdsGuide = () => {
    window.open('Documentation/eds-guide.html', '_blank');
  };

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-header">
          <p className="page-eyebrow">Documentatie</p>
          <h1 className="page-title">Handleidingen</h1>
          <p className="page-subtitle">
            Stapsgewijze uitleg over het tekenen van eéndraadschema's en situatieschema's.
          </p>
        </header>

        <div className="grid grid-2">
          <GuideCard
            icon="schema"
            title="Eéndraadschema"
            subtitle="Volledige handleiding voor de editor"
            intro="Complete uitleg over het maken van eéndraadschema's:"
            topics={[
              'Interface en driekolommen layout',
              'Elementen toevoegen en beheren (kringen, verbruikers, etc.)',
              'Beveiligingen en kabeldoorsnedes',
              'Best practices en tips',
            ]}
            onOpen={handleOpenNewEdsGuide}
          />
          <GuideCard
            icon="floorplan"
            title="Situatieschema"
            subtitle="Handleiding voor situatieschema's"
            intro="Alles over het tekenen van situatieschema's (plattegronden):"
            topics={[
              'Muren tekenen (binnen- en buitenmuren met textuur)',
              'Properties sidebar voor real-time aanpassingen',
              'Layer manager voor organisatie',
              'Alle sneltoetsen en functies',
            ]}
            onOpen={handleOpenNewSitPlanGuide}
          />
        </div>

        <section className="card page-section">
          <div className="card-body">
            <h3 className="card-title"><Icon name="info" />Over dit programma</h3>
            <p>
              Deze applicatie is een gratis tool om eéndraadschema's en situatieschema's voor elektrische installaties te maken
              volgens de Belgische normen. Het programma is volledig browser-gebaseerd en vereist geen installatie.
            </p>
            <p>
              Voor vragen, suggesties of het melden van bugs, kan u mailen naar <a href="mailto:tim@xeweb.be">tim@xeweb.be</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
