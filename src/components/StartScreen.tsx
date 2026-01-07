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
    console.log('handleLoadExample called with:', nr);
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
    console.log('Calling onExampleSelect');
    onExampleSelect(nr);
  };

  const handleNewSchema = () => {
    console.log('handleNewSchema called');
    // Call read_settings to create a new empty structure
    if ((globalThis as any).read_settings) {
      (globalThis as any).read_settings();
    }
    // Manually sync the structure to React state
    if ((globalThis as any).structure) {
      setStructure((globalThis as any).structure);
    }
    // Navigate to editor
    console.log('Calling onExampleSelect(2) to go to editor');
    onExampleSelect(2); // Use onExampleSelect to go to editor
  };

  const handleLoadFile = async () => {
    console.log('handleLoadFile called');
    // Trigger the file input click
    if ((globalThis as any).loadClicked) {
      await (globalThis as any).loadClicked();
      // Manually sync the structure to React state after loading
      setTimeout(() => {
        if ((globalThis as any).structure) {
          setStructure((globalThis as any).structure);
        }
      }, 100);
      console.log('Calling onLoadFile');
      onLoadFile();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Welcome Section */}
      <table 
        style={{ 
          border: '1px solid #ddd', 
          borderCollapse: 'collapse', 
          width: '100%',
          marginBottom: '20px',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: '20px 10px' }}>
              <p style={{ fontSize: '24px', margin: '10px 0' }}>
                <b>Welkom op ééndraadschema</b>
              </p>
              <p style={{ fontSize: '18px', margin: '15px 0' }}>
                Deze gratis tool laat toe zowel ééndraadschema's als situatieschema's te tekenen, 
                inclusief complexere schema's met bijvoorbeeld domotica. De schema's kunnen als PDF 
                bestand worden geëxporteerd en geprint. Voor de experts kunnen schema's eveneens 
                worden omgezet in SVG vectorformaat om in andere programma's verder te bewerken.
              </p>
              <p style={{ fontSize: '18px', margin: '15px 0' }}>
                Kies één van onderstaande voorbeelden om van te starten of start van een leeg schema (optie 3).
              </p>
              <p style={{ fontSize: '18px', margin: '15px 0', fontStyle: 'italic' }}>
                <b>Tip: </b>Om de mogelijkheden van het programma te leren kennen is het vaak beter 
                eerst een voorbeeldschema te bekijken alvorens van een leeg schema te vertrekken.
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      <div id="autoSaveRecover"></div>

      {/* Options Grid */}
      <table 
        style={{ 
          border: '1px solid #ddd', 
          borderCollapse: 'collapse', 
          width: '100%',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <tbody>
          {/* Headers */}
          <tr>
            <td 
              style={{ 
                width: '25%', 
                textAlign: 'center', 
                backgroundColor: '#e0e0e0',
                padding: '10px',
                fontWeight: 'bold'
              }}
            >
              Voorbeeld 1
            </td>
            <td 
              style={{ 
                width: '25%', 
                textAlign: 'center', 
                backgroundColor: '#e0e0e0',
                padding: '10px',
                fontWeight: 'bold'
              }}
            >
              Voorbeeld 2
            </td>
            <td 
              style={{ 
                width: '25%', 
                textAlign: 'center', 
                backgroundColor: '#e0e0e0',
                padding: '10px',
                fontWeight: 'bold'
              }}
            >
              Leeg schema
            </td>
            <td 
              style={{ 
                width: '25%', 
                textAlign: 'center', 
                backgroundColor: '#e0e0e0',
                padding: '10px',
                fontWeight: 'bold'
              }}
            >
              Openen
            </td>
          </tr>

          {/* Content */}
          <tr>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <br />
              <img src="examples/example000.svg" height="300px" alt="Example 1" style={{ maxWidth: '100%' }} />
              <br /><br />
              Eenvoudig schema, enkel contactdozen en lichtpunten.
              <br /><br />
            </td>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <br />
              <img src="examples/example001.svg" height="300px" alt="Example 2" style={{ maxWidth: '100%' }} />
              <br /><br />
              Iets complexer schema met teleruptoren, verbruikers achter contactdozen en gesplitste kringen.
              <br /><br />
            </td>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <br />
              <img src="examples/gear.svg" height="100px" alt="New Schema" style={{ maxWidth: '100%' }} />
              <br /><br />
              Start met een leeg schema en bouw uw eigen installatie op.
              <br /><br />
            </td>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <br />
              <img src="examples/import_icon.svg" height="100px" alt="Import" style={{ maxWidth: '100%' }} />
              <br /><br />
              Open een schema dat u eerder heeft opgeslagen op uw computer (EDS-bestand). 
              Enkel bestanden aangemaakt na 12 juli 2019 worden herkend.
              <br /><br />
            </td>
          </tr>

          {/* Buttons */}
          <tr>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <button 
                onClick={() => handleLoadExample(0)}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Verdergaan met deze optie
              </button>
            </td>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <button 
                onClick={() => handleLoadExample(1)}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Verdergaan met deze optie
              </button>
            </td>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <button 
                onClick={handleNewSchema}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Verdergaan met deze optie
              </button>
            </td>
            <td style={{ textAlign: 'center', padding: '20px' }}>
              <button 
                onClick={handleLoadFile}
                style={{
                  background: 'linear-gradient(135deg, #4a90e2, #357abd)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Verdergaan met deze optie
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
