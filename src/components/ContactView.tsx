/**
 * ContactView - React component for contact/info page
 */

import React from 'react';
import { Icon } from './Icon';

export const ContactView: React.FC = () => {
  return (
    <div className="page">
      <div className="page-inner narrow">
        <header className="page-header">
          <p className="page-eyebrow">Info</p>
          <h1 className="page-title">Een eéndraadschema tekenen</h1>
          <p className="page-subtitle">
            Een gratis tool om elektrische installatieschema's te maken.
          </p>
        </header>

        <section className="card">
          <div className="card-body">
            <h3 className="card-title"><Icon name="sparkle" />Wat is nieuw in versie 1.1.0</h3>
            <ul>
              <li><strong>Contextmenu in de hiërarchie:</strong> rechtsklik op een element voor snelle acties zoals toevoegen, verplaatsen, dupliceren, wijzigen en verwijderen.</li>
              <li><strong>Bovenliggend element beheren:</strong> in het eigenschappenpaneel zie je nu direct onder welk element het geselecteerde item hangt, en je kunt het via een dropdown aanpassen.</li>
              <li><strong>Drag-and-drop verbeterd:</strong> sleep een element naar het midden van een ander element om er automatisch een kind van te maken. Bovenste/onderste zone blijft voor invoegen ervoor/erna.</li>
              <li><strong>JSON-bestandsondersteuning:</strong> naast het klassieke <code>.eds</code>-formaat kun je schema's nu ook opslaan en openen als JSON.</li>
              <li><strong>Darkmode:</strong> schakel eenvoudig tussen licht en donker thema voor een betere leesbaarheid en comfort.</li>
            </ul>
            <p className="meta-text" style={{ marginTop: '12px' }}>
              <strong>Versies & Updates:</strong> <a target="_blank" href="https://github.com/TimVanOnckelen/eendraadschema/releases" rel="noreferrer">Bekijk alle releases</a>
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-body">
            <h3 className="card-title"><Icon name="mail" />Contact & Feedback</h3>
            <p>
              Voor vragen, suggesties of het melden van bugs:<br />
              <strong>Email:</strong> <a href="mailto:tim@xeweb.be">tim@xeweb.be</a><br />
              <strong>GitHub Issues:</strong> <a target="_blank" href="https://github.com/TimVanOnckelen/eendraadschema/issues" rel="noreferrer">github.com/TimVanOnckelen/eendraadschema</a>
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-body">
            <h3 className="card-title"><Icon name="scale" />Licentie</h3>
            <p>
              Deze software is uitgebracht onder de GNU General Public License v3 (GPLv3).<br />
              Zie het <a href="LICENSE.md" target="_blank" rel="noreferrer">LICENSE.md</a> bestand voor meer details.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-body">
            <h3 className="card-title"><Icon name="heart" />Dankwoord</h3>
            <p>
              Deze applicatie is gebouwd op het fundament van <a href="https://eendraadschema.goethals-jacobs.be/" target='_blank' rel="noreferrer">Ivan Goethals'</a> originele eendraadschema-tool.
              Dank aan Ivan voor het creëren van deze essentiële tool voor elektrische installaties volgens de Belgische normen.
            </p>
            <p className="meta-text">
              <strong>Origineel werk:</strong> Ivan Goethals<br />
              <strong>Aangepast versie:</strong> Tim Van Onckelen
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
