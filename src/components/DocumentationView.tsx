/**
 * DocumentationView - React component for documentation page
 */

import React from 'react';

export const DocumentationView: React.FC = () => {
  const handleOpenEdsManual = () => {
    window.open('Documentation/edsdoc.pdf', '_blank');
  };

  const handleOpenSitPlanManual = () => {
    window.open('Documentation/sitplandoc.pdf', '_blank');
  };

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

        {/* Warning Banner */}
        <div style={{
          backgroundColor: '#d1ecf1',
          borderLeft: '4px solid #0c5460',
          padding: '15px 20px',
          margin: '0',
          borderBottom: '1px solid #0c5460'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              fontSize: '24px',
              color: '#0c5460'
            }}>ℹ️</span>
            <div>
              <strong style={{
                color: '#0c5460',
                fontSize: '16px'
              }}>Nieuwe handleiding beschikbaar!</strong>
              <span style={{
                color: '#0c5460',
                marginLeft: '8px'
              }}>
                Er zijn nu uitgebreide handleidingen voor de nieuwe React-versie van zowel het eéndraadschema als het situatieschema.
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white'
        }}>
          {/* New Guides Section */}
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2c3e50' }}>
            ✨ Nieuwe interactieve handleidingen (2026)
          </h3>

          {/* New EDS Guide */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            marginBottom: '20px',
            gap: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '8px',
            border: '2px solid #0d6efd'
          }}>
            <div style={{
              minWidth: '180px',
              flexShrink: 0
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
                  width: '100%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#157347'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#198754'}
              >
                ⚡ Eéndraadschema<br/>
                <span style={{ fontSize: '12px', fontWeight: '400' }}>(NIEUW 2026)</span>
              </button>
            </div>
            <div style={{
              flex: '1 1 400px',
              minWidth: '300px',
              paddingTop: '5px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>
                Volledige handleiding voor de editor
              </h4>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px' }}>
                Complete uitleg over het maken van eéndraadschema's met de React-versie:
              </p>
              <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.6', fontSize: '14px' }}>
                <li>Interface en driekolommen layout</li>
                <li>Elementen toevoegen en beheren (kringen, verbruikers, etc.)</li>
                <li>Beveiligingen en kabeldoorsnedes</li>
                <li>Best practices en tips</li>
              </ul>
            </div>
          </div>

          {/* New Situation Plan Guide */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            marginBottom: '30px',
            gap: '20px',
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '8px',
            border: '2px solid #0d6efd'
          }}>
            <div style={{
              minWidth: '180px',
              flexShrink: 0
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
                  width: '100%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#157347'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#198754'}
              >
                🏠 Situatieschema<br/>
                <span style={{ fontSize: '12px', fontWeight: '400' }}>(NIEUW 2026)</span>
              </button>
            </div>
            <div style={{
              flex: '1 1 400px',
              minWidth: '300px',
              paddingTop: '5px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>
                Handleiding voor situatieschema's
              </h4>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px' }}>
                Alles over het tekenen van situatieschema's (plattegronden):
              </p>
              <ul style={{ margin: '8px 0 0 20px', lineHeight: '1.6', fontSize: '14px' }}>
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

          <div style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong style={{ color: '#856404' }}>📚 Oude handleidingen (legacy versie):</strong>
            <p style={{ margin: '8px 0 0 0', color: '#856404', fontSize: '14px' }}>
              De onderstaande PDF's zijn van de oude versie. Voor de nieuwe React-interface, 
              gebruik de nieuwe interactieve handleiding hierboven.
            </p>
          </div>

          {/* Eéndraadschema Manual */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            marginBottom: '30px',
            gap: '20px'
          }}>
            <div style={{
              minWidth: '180px',
              flexShrink: 0
            }}>
              <button
                onClick={handleOpenEdsManual}
                style={{
                  fontSize: '14px',
                  padding: '10px 20px',
                  backgroundColor: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  width: '100%',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0b5ed7'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d6efd'}
              >
                Eéndraadschema
              </button>
            </div>
            <div style={{
              flex: '1 1 400px',
              minWidth: '300px',
              paddingTop: '5px'
            }}>
              <p style={{ margin: 0, lineHeight: '1.6' }}>
                Een volledige handleiding is beschikbaar in PDF formaat.
                Klik links om deze in een ander venster te openen.
              </p>
              <p style={{ margin: '10px 0 0 0', lineHeight: '1.6', color: '#666' }}>
                Het programma is in volle ontwikkeling dus delen van de handleiding zijn
                mogelijk ietwat verouderd.
              </p>
            </div>
          </div>

          {/* Situatieschema Manual */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{
              minWidth: '180px',
              flexShrink: 0
            }}>
              <button
                onClick={handleOpenSitPlanManual}
                style={{
                  fontSize: '14px',
                  padding: '10px 20px',
                  backgroundColor: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  width: '100%',
                  whiteSpace: 'normal',
                  lineHeight: '1.4'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0b5ed7'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d6efd'}
              >
                Situatieschema
              </button>
            </div>
            <div style={{
              flex: '1 1 400px',
              minWidth: '300px',
              paddingTop: '5px'
            }}>
              <p style={{ margin: 0, lineHeight: '1.6' }}>
                Specifiek voor het werken met het situatieschema werd een ander korter document opgesteld.
                Klik links om deze in een ander venster te openen.
              </p>
            </div>
          </div>
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
          Voor vragen, suggesties of het melden van bugs, gebruik het contact formulier of bezoek de{' '}
          <a 
            href="https://eendraadschema.goethals-jacobs.be/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#0d6efd', textDecoration: 'none' }}
          >
            originele website
          </a>.
        </p>
      </div>
    </div>
  );
};

