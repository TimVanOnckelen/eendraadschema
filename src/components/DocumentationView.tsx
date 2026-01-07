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
          backgroundColor: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          padding: '15px 20px',
          margin: '0',
          borderBottom: '1px solid #ffc107'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{
              fontSize: '24px',
              color: '#856404'
            }}>⚠️</span>
            <div>
              <strong style={{
                color: '#856404',
                fontSize: '16px'
              }}>Let op:</strong>
              <span style={{
                color: '#856404',
                marginLeft: '8px'
              }}>
                Deze handleidingen zijn van de oude versie van de applicatie. 
                Voor deze nieuwe React-versie bestaat nog geen aparte handleiding.
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white'
        }}>
          {/* Eéndraadschema Manual */}
          <div style={{
            display: 'flex',
            marginBottom: '30px',
            gap: '20px'
          }}>
            <div style={{
              minWidth: '150px'
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
                  width: '100%'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0b5ed7'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d6efd'}
              >
                Eéndraadschema
              </button>
            </div>
            <div style={{
              flex: 1,
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
            gap: '20px'
          }}>
            <div style={{
              minWidth: '150px'
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
                  width: '100%'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0b5ed7'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0d6efd'}
              >
                Situatieschema
              </button>
            </div>
            <div style={{
              flex: 1,
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

