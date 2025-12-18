/**
 * ResponseOption Component
 * 
 * Visual component for displaying Human/AI response options with clear visual indicators
 */
export function ResponseOption({
    response,
    type, // 'human' or 'ai'
    onClick,
    isHovered = false,
    darkMode = false
}) {
    const colors = {
        human: {
            bg: darkMode ? 'rgba(59,130,246,0.15)' : '#dbeafe',
            bgHover: darkMode ? 'rgba(59,130,246,0.25)' : '#bfdbfe',
            border: '#3b82f6',
            icon: '👤',
            label: 'HUMAN',
            accent: '#3b82f6'
        },
        ai: {
            bg: darkMode ? 'rgba(168,85,247,0.15)' : '#fae8ff',
            bgHover: darkMode ? 'rgba(168,85,247,0.25)' : '#f3e8ff',
            border: '#a855f7',
            icon: '🤖',
            label: 'AI',
            accent: '#a855f7'
        }
    };

    const theme = colors[type];

    return (
        <div
            onClick={onClick}
            style={{
                padding: '24px 20px',
                borderRadius: 16,
                background: isHovered ? theme.bgHover : theme.bg,
                border: `3px solid ${isHovered ? theme.border : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isHovered
                    ? `0 12px 24px ${darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`
                    : '0 4px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = theme.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.background = theme.bg}
        >
            {/* Label Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: `2px solid ${theme.accent}40`
            }}>
                <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                    {theme.icon}
                </span>
                <div>
                    <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 1.2,
                        color: theme.accent
                    }}>
                        {theme.label}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        opacity: 0.6,
                        marginTop: 2
                    }}>
                        Click to select
                    </div>
                </div>
            </div>

            {/* Response Text */}
            <div style={{
                lineHeight: 1.6,
                fontSize: '1rem',
                color: darkMode ? '#e2e8f0' : '#1e293b'
            }}>
                {response}
            </div>
        </div>
    );
}
