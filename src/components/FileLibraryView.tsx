import React, { useState, useEffect } from 'react';
import { FileLibraryStorage, EdsFileMetadata } from '../storage/FileLibraryStorage';
import { dialogAlert, dialogConfirm, dialogPrompt } from '../utils/DialogHelpers';

interface FileLibraryViewProps {
    onFileOpen: (content: string, filename: string) => void;
    onBack: () => void;
}

export const FileLibraryView: React.FC<FileLibraryViewProps> = ({ onFileOpen, onBack }) => {
    const [browserFiles, setBrowserFiles] = useState<EdsFileMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    const storage = new FileLibraryStorage();

    // Load browser files on mount
    useEffect(() => {
        loadBrowserFiles();
    }, []);

    const loadBrowserFiles = async () => {
        setLoading(true);
        try {
            const files = await storage.listFiles();
            setBrowserFiles(files);
        } catch (error) {
            console.error('Error loading browser files:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBrowserFile = async (file: EdsFileMetadata) => {
        onFileOpen(file.content, file.filename);
    };

    const handleDeleteBrowserFile = async (id: string) => {
        const confirmed = await dialogConfirm('Bestand verwijderen', 'Weet u zeker dat u dit bestand wilt verwijderen?');
        if (!confirmed) return;
        
        const success = await storage.deleteFile(id);
        if (success) {
            loadBrowserFiles();
        } else {
            await dialogAlert('Fout', 'Kon bestand niet verwijderen');
        }
    };

    const handleDuplicateBrowserFile = async (id: string) => {
        const newId = await storage.duplicateFile(id);
        if (newId) {
            loadBrowserFiles();
        } else {
            await dialogAlert('Fout', 'Kon bestand niet dupliceren');
        }
    };

    const handleRenameBrowserFile = async (file: EdsFileMetadata) => {
        const newName = await dialogPrompt('Bestand hernoemen', 'Nieuwe bestandsnaam:', file.filename.replace(/\.eds$/, ''));
        if (!newName || newName.trim() === '') return;
        
        const success = await storage.renameFile(file.id, newName.trim());
        if (success) {
            loadBrowserFiles();
        } else {
            await dialogAlert('Fout', 'Kon bestand niet hernoemen');
        }
    };

    const handleExportBrowserFile = async (file: EdsFileMetadata) => {
        try {
            const blob = new Blob([file.content], { type: 'application/eds' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting file:', error);
            await dialogAlert('Fout', 'Kon bestand niet exporteren');
        }
    };

    const handleSaveCurrentToBrowser = async () => {
        const content = "TXT0040000" + (globalThis as any).structure.toJsonObject(true);
        const filename = (globalThis as any).structure.properties.filename || 'untitled.eds';
        
        const id = await storage.saveFile(filename, content, false);
        if (id) {
            loadBrowserFiles();
            await dialogAlert('Succes', 'Bestand opgeslagen in browser bibliotheek');
        } else {
            await dialogAlert('Fout', 'Kon bestand niet opslaan');
        }
    };

    const handleImportFromSystem = async () => {
        try {
            // Check if File System Access API is supported
            if (!(window as any).showOpenFilePicker) {
                await dialogAlert('Fout', 'Uw browser ondersteunt deze functie niet. Gebruik Chrome, Edge of een andere moderne browser.');
                return;
            }

            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: 'Eendraadschema (.eds)',
                        accept: { 'application/eds': ['.eds'] },
                    },
                ],
                multiple: false,
            });

            const file = await fileHandle.getFile();
            const content = await file.text();
            
            // Save to library
            const id = await storage.saveFile(file.name, content, false);
            if (id) {
                loadBrowserFiles();
                alert(`Bestand "${file.name}" toegevoegd aan bibliotheek`);
            } else {
                alert('Kon bestand niet toevoegen aan bibliotheek');
            }
        } catch (error) {
            // User cancelled or error occurred
            console.log('Import cancelled or failed:', error);
        }
    };

    const handleClearBrowserStorage = async () => {
        if (!confirm('Weet u zeker dat u alle bestanden uit de browser wilt verwijderen?')) return;
        
        const success = await storage.clearAll();
        if (success) {
            loadBrowserFiles();
        }
    };

    const filteredBrowserFiles = searchQuery
        ? browserFiles.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
        : browserFiles;

    return (
        <div className="file-library-container">
            <div className="file-library-header">
                <button onClick={onBack} className="back-button">
                    ← Terug
                </button>
                <h1>Bestandsbibliotheek</h1>
                <div className="header-actions">
                    <button onClick={handleImportFromSystem} className="import-button">
                        📥 Bestand importeren
                    </button>
                    <button onClick={handleSaveCurrentToBrowser} className="save-current-button">
                        💾 Huidig schema opslaan
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Zoek bestanden..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="browser-storage-view">
                <div className="storage-info">
                    <p><strong>⚠️ Let op:</strong> Bestanden worden lokaal opgeslagen in deze browser op dit toestel. Ze zijn niet toegankelijk vanaf andere browsers of apparaten.</p>
                    {browserFiles.length > 0 && (
                        <button onClick={handleClearBrowserStorage} className="clear-button">
                            🗑️ Alle bestanden wissen
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading">Laden...</div>
                ) : filteredBrowserFiles.length === 0 ? (
                    <div className="empty-state">
                        <p>Geen bestanden gevonden</p>
                        <p className="empty-hint">Sla uw huidige schema op om te beginnen</p>
                    </div>
                ) : (
                    <div className="file-grid">
                        {filteredBrowserFiles.map((file) => (
                            <div key={file.id} className="file-card">
                                <div className="file-icon">📄</div>
                                <div className="file-info">
                                    <h3 className="file-name">{file.filename}</h3>
                                    <p className="file-date">{file.dateModified}</p>
                                    <p className="file-size">{FileLibraryStorage.formatFileSize(file.size)}</p>
                                    {file.isAutoSave && <span className="autosave-badge">AutoSave</span>}
                                </div>
                                <div className="file-actions">
                                    <button 
                                        onClick={() => handleOpenBrowserFile(file)}
                                        className="action-button open"
                                        title="Openen"
                                    >
                                        📂 Openen
                                    </button>
                                    <button 
                                        onClick={() => handleRenameBrowserFile(file)}
                                        className="action-button rename"
                                        title="Hernoemen"
                                    >
                                        ✏️ Hernoemen
                                    </button>
                                    <button 
                                        onClick={() => handleDuplicateBrowserFile(file.id)}
                                        className="action-button duplicate"
                                        title="Dupliceren"
                                    >
                                        📋 Kopiëren
                                    </button>
                                    <button 
                                        onClick={() => handleExportBrowserFile(file)}
                                        className="action-button export"
                                        title="Exporteren"
                                    >
                                        💾 Exporteren
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteBrowserFile(file.id)}
                                        className="action-button delete"
                                        title="Verwijderen"
                                    >
                                        🗑️ Verwijderen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

