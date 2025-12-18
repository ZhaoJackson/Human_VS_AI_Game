import { useGame } from '../../features/game/contexts/GameContext';
import { useState, useEffect } from 'react';

export default function GameSettings({ onClose }) {
    const {
        darkMode,
        setDarkMode,
        fontSize,
        setFontSize
    } = useGame();

    const [tempSettings, setTempSettings] = useState({
        darkMode,
        fontSize
    });

    useEffect(() => {
        setTempSettings({
            darkMode,
            fontSize
        });
    }, [darkMode, fontSize]);

    const handleConfirm = () => {
        setDarkMode(tempSettings.darkMode);
        setFontSize(tempSettings.fontSize);
        onClose();
    };

    const handleReset = () => {
        setTempSettings({
            darkMode,
            fontSize
        });
    };

    return (
        <div className="settings-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: tempSettings.darkMode ? '#333' : '#fff',
                padding: '20px',
                borderRadius: '8px',
                width: '300px',
                color: tempSettings.darkMode ? '#fff' : '#000'
            }}>
                <h2>Settings</h2>
                <div style={{ marginTop: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Theme
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setTempSettings(prev => ({ ...prev, darkMode: false }))}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    backgroundColor: !tempSettings.darkMode ? '#0070f3' : '#666',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                ☀️ Light
                            </button>
                            <button
                                onClick={() => setTempSettings(prev => ({ ...prev, darkMode: true }))}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    backgroundColor: tempSettings.darkMode ? '#0070f3' : '#666',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    flex: 1
                                }}
                            >
                                🌙 Dark
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Font Size
                        </label>
                        <input
                            type="range"
                            min="12"
                            max="24"
                            value={tempSettings.fontSize}
                            onChange={(e) => setTempSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                            style={{ width: '100%' }}
                        />
                        <span style={{ fontSize: `${tempSettings.fontSize}px` }}>Aa</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '20px',
                        gap: '10px'
                    }}>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                backgroundColor: '#666',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleConfirm}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '4px',
                                backgroundColor: '#0070f3',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
