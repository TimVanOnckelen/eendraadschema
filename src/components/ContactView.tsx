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
          Een gratis tool om elektrische installatieschema's te maken
        </p>

        <div className="contact-section">
          <h3>📧 Contact & Feedback</h3>
          <p>
            Voor vragen, suggesties of het melden van bugs:<br />
            <strong>Email:</strong> <a href="mailto:tim@xeweb.be">tim@xeweb.be</a><br />
            <strong>GitHub Issues:</strong> <a target="_blank" href="https://github.com/TimVanOnckelen/eendraadschema/issues" rel="noreferrer">github.com/TimVanOnckelen/eendraadschema</a>
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            <strong>Versies & Updates:</strong> <a target="_blank" href="https://github.com/TimVanOnckelen/eendraadschema/releases" rel="noreferrer">Bekijk alle releases</a>
          </p>
        </div>

        <div className="contact-section">
          <h3>📜 Licentie</h3>
          <p>
            Deze software is uitgebracht onder de GNU General Public License v3 (GPLv3).<br />
            Zie het <a href="LICENSE.md" target="_blank" rel="noreferrer">LICENSE.md</a> bestand voor meer details.
          </p>
        </div>

        <div className="contact-section">
          <h3>🙏 Dankwoord</h3>
          <p>
            Deze applicatie is gebouwd op het fundament van <a href="https://eendraadschema.goethals-jacobs.be/" target='_blank'>Ivan Goethals'</a> originele eendraadschema-tool.
            Dank aan Ivan voor het creëren van deze essentiële tool voor elektrische installaties volgens de Belgische normen.
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
            <strong>Origineel werk:</strong> Ivan Goethals<br />
            <strong>Aangepast versie:</strong> Tim Van Onckelen 
          </p>
        </div>
      </div>
    </div>
  );
};

