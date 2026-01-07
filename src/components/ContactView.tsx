/**
 * ContactView - React component for contact/info page
 */

import React from 'react';

export const ContactView: React.FC = () => {
  return (
    <div className="contact-view">
      <div className="contact-container">
        <h2>Een eéndraadschema tekenen.</h2>
        <p className="subtitle">
          Original Application: <a target="_blank" href="https://github.com/igoethal/eendraadschema" rel="noreferrer">Ivan Goethals</a> (2019-2025)
        </p>
        <p className="subtitle">
          React 19 Refactor & UI Improvements: <a target="_blank" href="https://github.com/TimVanOnckelen" rel="noreferrer">Tim Van Onckelen</a> (2025-2026)
        </p>

        <div className="contact-section">
          <h3>📖 Over deze versie</h3>
          <p>
            Deze versie is een moderne refactor van de originele eendraadschema applicatie.
            De applicatie is volledig gemigreerd naar React 19 met een verbeterde gebruikersinterface,
            terwijl alle originele logica en functionaliteit van Ivan Goethals behouden blijft.
          </p>
        </div>

        <div className="contact-section">
          <h3>🏗️ Originele Applicatie</h3>
          <p>
            <strong>Auteur:</strong> Ivan Goethals<br />
            <strong>Website:</strong> <a target="_blank" href="https://eendraadschema.goethals-jacobs.be" rel="noreferrer">eendraadschema.goethals-jacobs.be</a><br />
            <strong>Persoonlijke website:</strong> <a target="_blank" href="https://ivan.goethals-jacobs.be" rel="noreferrer">ivan.goethals-jacobs.be</a><br />
            <strong>Repository:</strong> <a target="_blank" href="https://github.com/igoethal/eendraadschema" rel="noreferrer">github.com/igoethal/eendraadschema</a>
          </p>
        </div>

        <div className="contact-section">
          <h3>⚛️ React Versie</h3>
          <p>
            <strong>Ontwikkelaar:</strong> Tim Van Onckelen<br />
            <strong>GitHub:</strong> <a target="_blank" href="https://github.com/TimVanOnckelen" rel="noreferrer">github.com/TimVanOnckelen</a><br />
            <strong>Repository:</strong> <a target="_blank" href="https://github.com/TimVanOnckelen/eendraadschema" rel="noreferrer">github.com/TimVanOnckelen/eendraadschema</a><br />
            <strong>LinkedIn:</strong> <a target="_blank" href="https://www.linkedin.com/in/tim-van-onckelen" rel="noreferrer">linkedin.com/in/tim-van-onckelen</a>
          </p>
        </div>

        <div className="contact-section">
          <h3>🔧 Technische Stack</h3>
          <ul className="tech-list">
            <li>⚛️ React 19</li>
            <li>📘 TypeScript</li>
            <li>⚡ Vite</li>
            <li>🎨 Modern CSS</li>
            <li>📱 Responsive Design</li>
          </ul>
        </div>

        <div className="contact-section">
          <h3>📜 Licentie</h3>
          <p>
            Deze software is uitgebracht onder de GNU General Public License v3 (GPLv3).<br />
            Zie het <a href="LICENSE.md" target="_blank" rel="noreferrer">LICENSE.md</a> bestand voor meer details.
          </p>
          <p>
            <strong>Original Application Copyright:</strong> (C) 2019-2025 Ivan Goethals<br />
            <strong>React Refactor & UI Improvements:</strong> (C) 2025-2026 Tim Van Onckelen
          </p>
        </div>

        <div className="contact-section">
          <h3>🙏 Erkenningen</h3>
          <p>
            Alle kernfunctionaliteit voor het tekenen van eéndraadschema's volgens de Belgische AREI-wetgeving
            is ontwikkeld door Ivan Goethals. Deze React-versie is een modernisering van de architectuur en
            gebruikersinterface, maar de elektrische schema-logica blijft volledig het werk van Ivan.
          </p>
        </div>

        <div className="contact-section">
          <h3>🐛 Bugs & Feature Requests</h3>
          <p>
            Voor bugs of feature requests in deze React versie, gelieve een issue aan te maken op:<br />
            <a target="_blank" href="https://github.com/TimVanOnckelen/eendraadschema/issues" rel="noreferrer">
              github.com/TimVanOnckelen/eendraadschema/issues
            </a>
          </p>
          <p>
            Voor vragen over de originele applicatie of elektrische standaarden:<br />
            <a target="_blank" href="https://github.com/igoethal/eendraadschema" rel="noreferrer">
              github.com/igoethal/eendraadschema
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

