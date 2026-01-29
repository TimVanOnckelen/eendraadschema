/**
 * DocumentationView - React component for documentation page
 */

import React from 'react';

export const DocumentationView: React.FC = () => {
  const handleOpenNewSitPlanGuide = () => {
    window.open('Documentation/sitplan-guide.html', '_blank');
  };

  const handleOpenNewEdsGuide = () => {
    window.open('Documentation/eds-guide.html', '_blank');
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#d3d3d3',
          padding: '15px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          Handleiding
        </div>



        {/* Content */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white'
        }}>
          {/* Guides Section */}
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>
            📚 Handleidingen
          </h3>

          {/* Guides Container - Side by Side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* EDS Guide Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              border: '2px solid #0d6efd',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <button
                onClick={handleOpenNewEdsGuide}
                style={{
                  fontSize: '14px',
                  padding: '12px 20px',
                  backgroundColor: '#198754',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginBottom: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#157347'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#198754'}
              >
                ⚡ Eéndraadschema
              </button>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>
                Volledige handleiding voor de editor
              </h4>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px' }}>
                Complete uitleg over het maken van eéndraadschema's:
              </p>
              <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.6', fontSize: '14px', flexGrow: 1 }}>
                <li>Interface en driekolommen layout</li>
                <li>Elementen toevoegen en beheren (kringen, verbruikers, etc.)</li>
                <li>Beveiligingen en kabeldoorsnedes</li>
                <li>Best practices en tips</li>
              </ul>
            </div>

            {/* Situatieschema Guide Card */}
            <div style={{
              padding: '20px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              border: '2px solid #0d6efd',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <button
                onClick={handleOpenNewSitPlanGuide}
                style={{
                  fontSize: '14px',
                  padding: '12px 20px',
                  backgroundColor: '#198754',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginBottom: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#157347'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#198754'}
              >
                🏠 Situatieschema
              </button>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>
                Handleiding voor situatieschema's
              </h4>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px' }}>
                Alles over het tekenen van situatieschema's (plattegronden):
              </p>
              <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.6', fontSize: '14px', flexGrow: 1 }}>
                <li>Muren tekenen (binnen- en buitenmuren met textuur)</li>
                <li>Properties sidebar voor real-time aanpassingen</li>
                <li>Layer manager voor organisatie</li>
                <li>Alle sneltoetsen en functies</li>
              </ul>
            </div>
          </div>


          <div style={{
            height: '1px',
            backgroundColor: '#dee2e6',
            margin: '30px 0'
          }}></div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>Over dit programma</h3>
        <p style={{ lineHeight: '1.6', color: '#666' }}>
          Deze applicatie is een gratis tool om eéndraadschema's en situatieschema's voor elektrische installaties te maken
          volgens de Belgische normen. Het programma is volledig browser-gebaseerd en vereist geen installatie.
        </p>
        <p style={{ lineHeight: '1.6', color: '#666', marginBottom: 0 }}>
          Voor vragen, suggesties of het melden van bugs, kan u mailen naar tim@xeweb.be
        </p>
      </div>
    </div>
  );
};

