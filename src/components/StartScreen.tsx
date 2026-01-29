import React from 'react';
import { EDStoStructure } from '../importExport/importExport';
import { useApp } from '../AppContext';
import { EXAMPLE0, EXAMPLE1 } from '../constants/examples';

interface StartScreenProps {
  onExampleSelect: (exampleNumber: number) => void;
  onNewSchema: () => void;
  onLoadFile: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onExampleSelect,
  onNewSchema,
  onLoadFile,
}) => {
  const { setStructure } = useApp();

  const handleLoadExample = (nr: number) => {
    try {
      switch (nr) {
        case 0:
          EDStoStructure(EXAMPLE0);
          (globalThis as any).fileAPIobj.clear();
          break;
        case 1:
          EDStoStructure(EXAMPLE1);
          (globalThis as any).fileAPIobj.clear();
          break;
      }
      // Manually sync the structure to React state
      if ((globalThis as any).structure) {
        setStructure((globalThis as any).structure);
      }
      onExampleSelect(nr);
    } catch (error) {
      console.error(`Failed to load example ${nr}:`, error);
      alert(`Failed to load example ${nr + 1}. The example data may be corrupted. Please try another example or create a new schema.`);
    }
  };

  const handleNewSchema = () => {
    // Call read_settings to create a new empty structure
    if ((globalThis as any).read_settings) {
      (globalThis as any).read_settings();
    }
    // Manually sync the structure to React state
    if ((globalThis as any).structure) {
      setStructure((globalThis as any).structure);
    }
    // Navigate to editor
    onExampleSelect(2); // Use onExampleSelect to go to editor
  };

  const handleLoadFile = async () => {
    // Trigger the file input click
    if ((globalThis as any).loadClicked) {
      await (globalThis as any).loadClicked();
      // Manually sync the structure to React state after loading
      setTimeout(() => {
        if ((globalThis as any).structure) {
          setStructure((globalThis as any).structure);
        }
      }, 100);
      onLoadFile();
    }
  };

  return (
    <div style={{ 
      height: 'calc(100vh - var(--menu-height))', 
      overflow: 'auto',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      padding: '0'
    }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #1e40af 50%, #1e3a8a 100%)',
        color: 'white',
        padding: '80px 20px 60px 20px',
        textAlign: 'center',
        marginBottom: '60px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle overlay pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800',
            margin: '0 0 16px 0',
            letterSpacing: '-1px',
            width: '100%',
            textAlign: 'center',
            wordBreak: 'break-word',
            background: 'transparent',
            color: 'white'
          }}>
            ⚡ Ééndraadschema
          </h1>
          <p style={{ 
            fontSize: '18px', 
            margin: '0 0 32px 0', 
            lineHeight: '1.6',
            opacity: 0.95,
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Plan je huisinstallatie zelf - Gratis, makkelijk en gebruiksvriendelijk
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: '14px',
            opacity: 0.9
          }}>
            <span>✓ Ééndraadschema's</span>
            <span>•</span>
            <span>✓ Situatieschema's</span>
            <span>•</span>
            <span>✓ PDF Export</span>
            <span>•</span>
            <span>✓ Compatibel met eendraadschema.goethals-jacobs.be</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 60px 20px' }}>
        
        {/* Quick Start Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {/* Card 1: Example 1 */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '4px solid #10b981'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 25px rgba(16, 185, 129, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)';
          }}>
            {/* Image Container */}
            <div style={{
              background: '#f3f4f6',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
              overflow: 'hidden'
            }}>
              <img src="examples/example000.svg" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Voorbeeld 1" />
            </div>
            
            {/* Content */}
            <div style={{ padding: '32px 24px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 Voorbeeld 1
                <span style={{ 
                  background: '#d1fae5', 
                  color: '#065f46', 
                  fontSize: '11px', 
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  EENVOUDIG
                </span>
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: '0 0 24px 0', 
                flex: 1,
                lineHeight: '1.6'
              }}>
                Perfecte startpunt voor beginners. Leer de basis met contactdozen en lichtpunten.
              </p>
              <button 
                onClick={() => handleLoadExample(0)}
                style={{
                  width: 'auto',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '0.9';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                Open voorbeeld
              </button>
            </div>
          </div>

          {/* Card 2: Example 2 */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '4px solid #f59e0b'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 25px rgba(245, 158, 11, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)';
          }}>
            {/* Image Container */}
            <div style={{
              background: '#f3f4f6',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
              overflow: 'hidden'
            }}>
              <img src="examples/example001.svg" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Voorbeeld 2" />
            </div>
            
            {/* Content */}
            <div style={{ padding: '32px 24px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📊 Voorbeeld 2
                <span style={{ 
                  background: '#fed7aa', 
                  color: '#92400e', 
                  fontSize: '11px', 
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  GEMIDDELD
                </span>
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: '0 0 24px 0', 
                flex: 1,
                lineHeight: '1.6'
              }}>
                Leer geavanceerde functies met teleruptoren, verbruikers en gesplitste kringen.
              </p>
              <button 
                onClick={() => handleLoadExample(1)}
                style={{
                  width: 'auto',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '0.9';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                Open voorbeeld
              </button>
            </div>
          </div>

          {/* Card 3: New Schema */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '4px solid #8b5cf6'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 25px rgba(139, 92, 246, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)';
          }}>
            {/* Image Container */}
            <div style={{
              background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: '80px' }}>🛠️</div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '32px 24px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ✨ Nieuw schema
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: '0 0 24px 0', 
                flex: 1,
                lineHeight: '1.6'
              }}>
                Start met een leeg canvas en bouw uw eigen elektrotechnisch schema op.
              </p>
              <button 
                onClick={handleNewSchema}
                style={{
                  width: 'auto',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '0.9';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                Nieuw schema starten
              </button>
            </div>
          </div>

          {/* Card 4: Open File */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '4px solid #06b6d4'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 20px 25px rgba(6, 182, 212, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.05)';
          }}>
            {/* Image Container */}
            <div style={{
              background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: '80px' }}>📂</div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '32px 24px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📁 Bestand openen
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: '0 0 24px 0', 
                flex: 1,
                lineHeight: '1.6'
              }}>
                Open een eerder opgeslagen EDS-bestand van uw computer.
              </p>
              <button 
                onClick={handleLoadFile}
                style={{
                  width: 'auto',
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(6, 182, 212, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '0.9';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                Bestand kiezen
              </button>
            </div>
          </div>
        </div>

        <div id="autoSaveRecover"></div>

        {/* Info Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Features */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0', color: '#1f2937' }}>
              ✨ Functies
            </h2>
            <ul style={{ 
              margin: '0', 
              padding: '0',
              listStyle: 'none'
            }}>
              {[
                'Ééndraadschema\'s en situatieschema\'s',
                'Domotica en geavanceerde installaties',
                'PDF export en printen',
                'SVG vectorformaat',
                'Auto-opslaan',
                'Ongedaan maken/Herhalen'
              ].map((feature, i) => (
                <li key={i} style={{
                  padding: '10px 0',
                  borderBottom: i < 5 ? '1px solid #e5e7eb' : 'none',
                  fontSize: '14px',
                  color: '#4b5563',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ color: 'var(--primary-color)', fontSize: '16px' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Tips */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0', color: '#1f2937' }}>
              💡 Tips
            </h2>
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              padding: '16px',
              borderRadius: '8px',
              borderLeft: '4px solid #f59e0b',
              marginBottom: '16px'
            }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#92400e', lineHeight: '1.6' }}>
                <strong>Start met voorbeelden:</strong> De voorbeelden laten zien hoe je het programma gebruikt. Dit is veel sneller dan van nul beginnen.
              </p>
            </div>

          </div>

          {/* About */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 20px 0', color: '#1f2937' }}>
              ℹ️ Over deze versie
            </h2>
            <p style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Deze versie is gebaseerd op het originele werk van <strong>Ivan Goethals</strong> en is verbeterd voor gebruiksgemak en prestaties.
            </p>
            <p style={{ 
              margin: '0', 
              fontSize: '13px', 
              color: '#9ca3af'
            }}>
              🏗️ <a href="https://eendraadschema.goethals-jacobs.be" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Originele versie</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
