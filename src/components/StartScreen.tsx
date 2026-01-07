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
      background: 'var(--background)',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Welcome Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px'
        }}>
          {/* Left: Welcome Text */}
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              margin: '0 0 20px 0',
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '700'
            }}>
              Welkom op ééndraadschema
            </h1>
            <p style={{ fontSize: '16px', margin: '0 0 16px 0', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Deze gratis tool laat toe zowel ééndraadschema's als situatieschema's te tekenen, 
              inclusief complexere schema's met bijvoorbeeld domotica. De schema's kunnen als PDF 
              bestand worden geëxporteerd en geprint. Voor de experts kunnen schema's eveneens 
              worden omgezet in SVG vectorformaat om in andere programma's verder te bewerken.
            </p>
            <p style={{ fontSize: '16px', margin: '0 0 16px 0', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Kies één van onderstaande voorbeelden om van te starten of start van een leeg schema.
            </p>
            <div style={{ 
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              padding: '16px',
              borderRadius: '8px',
              borderLeft: '4px solid #f59e0b'
            }}>
              <p style={{ fontSize: '14px', margin: '0', lineHeight: '1.6', color: '#92400e' }}>
                <strong>💡 Tip: </strong>Om de mogelijkheden van het programma te leren kennen is het vaak beter 
                eerst een voorbeeldschema te bekijken alvorens van een leeg schema te vertrekken.
              </p>
            </div>
          </div>

          {/* Right: Version Info */}
          <div style={{ 
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            padding: '24px',
            borderRadius: '12px',
            borderLeft: '4px solid var(--primary-color)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', color: 'var(--primary-color)', fontSize: '24px', fontWeight: '600' }}>
              ✨ Nieuwe Versie - Eenvoudiger in Gebruik
            </h2>
            <p style={{ margin: '0 0 12px 0', lineHeight: '1.6', fontSize: '14px', color: '#1e3a8a' }}>
              Deze versie biedt dezelfde krachtige functionaliteit als de originele 
              versie van <strong>Ivan Goethals</strong>, maar is <strong>eenvoudiger in gebruik</strong>:
            </p>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', color: '#1e40af' }}>
              <li><strong>Duidelijker menu</strong> - alles makkelijk terug te vinden</li>
              <li><strong>Inklapbare lijsten</strong> - beter overzicht bij grote schema's</li>
              <li><strong>Betere zoekfunctie</strong> - vind elementen sneller</li>
              <li><strong>Visuele hulp</strong> - zie direct wat je selecteert</li>
              <li><strong>Helderder scherm</strong> - alles beter leesbaar</li>
              <li><strong>Sneller werken</strong> - vooral bij grote installaties</li>
            </ul>
            <p style={{ margin: '0', lineHeight: '1.6', fontSize: '13px', color: '#1e40af' }}>
              🏗️ <strong>Originele versie:</strong> <a href="https://eendraadschema.goethals-jacobs.be" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>eendraadschema.goethals-jacobs.be</a>
            </p>
          </div>
        </div>

        <div id="autoSaveRecover"></div>

        {/* Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          {/* Option 1: Example 1 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: 'var(--primary-color)' }}>
              📋 Voorbeeld 1
            </h3>
            <img src="examples/example000.svg" style={{ width: '100%', height: '200px', objectFit: 'contain', marginBottom: '16px' }} alt="Example 1" />
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)', margin: '0 0 20px 0', flex: '1' }}>
              Eenvoudig schema, enkel contactdozen en lichtpunten.
            </p>
            <button 
              onClick={() => handleLoadExample(0)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '1';
              }}
            >
              Start met dit voorbeeld
            </button>
          </div>

          {/* Option 2: Example 2 */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: 'var(--primary-color)' }}>
              📊 Voorbeeld 2
            </h3>
            <img src="examples/example001.svg" style={{ width: '100%', height: '200px', objectFit: 'contain', marginBottom: '16px' }} alt="Example 2" />
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)', margin: '0 0 20px 0', flex: '1' }}>
              Iets complexer schema met teleruptoren, verbruikers achter contactdozen en gesplitste kringen.
            </p>
            <button 
              onClick={() => handleLoadExample(1)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '1';
              }}
            >
              Start met dit voorbeeld
            </button>
          </div>

          {/* Option 3: New Schema */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: 'var(--primary-color)' }}>
              ➕ Leeg schema
            </h3>
            <img src="examples/gear.svg" style={{ width: '100%', height: '200px', objectFit: 'contain', marginBottom: '16px' }} alt="New Schema" />
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)', margin: '0 0 20px 0', flex: '1' }}>
              Start met een leeg schema en bouw uw eigen installatie op.
            </p>
            <button 
              onClick={handleNewSchema}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '1';
              }}
            >
              Start nieuw schema
            </button>
          </div>

          {/* Option 4: Open File */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: 'var(--primary-color)' }}>
              📂 Openen
            </h3>
            <img src="examples/import_icon.svg" style={{ width: '100%', height: '200px', objectFit: 'contain', marginBottom: '16px' }} alt="Import" />
            <p style={{ fontSize: '14px', textAlign: 'center', color: 'var(--text-secondary)', margin: '0 0 20px 0', flex: '1' }}>
              Open een schema dat u eerder heeft opgeslagen op uw computer (EDS-bestand).
            </p>
            <button 
              onClick={handleLoadFile}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                e.stopPropagation();
                e.currentTarget.style.opacity = '1';
              }}
            >
              Bestand openen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
