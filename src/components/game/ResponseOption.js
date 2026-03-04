export function ResponseOption({
    response,
    type,
    onClick,
    isHovered = false,
    darkMode = false
}) {
    const colors = {
        human: {
            bg: darkMode ? 'rgba(117,170,219,0.15)' : 'rgba(117,170,219,0.12)',
            bgHover: darkMode ? 'rgba(117,170,219,0.28)' : 'rgba(117,170,219,0.22)',
            border: '#75AADB',
            icon: '👤',
            label: 'HUMAN',
            accent: '#75AADB'
        },
        ai: {
            bg: darkMode ? 'rgba(168,191,168,0.15)' : 'rgba(168,191,168,0.18)',
            bgHover: darkMode ? 'rgba(168,191,168,0.28)' : 'rgba(168,191,168,0.32)',
            border: '#A8BFA8',
            icon: '🤖',
            label: 'AI',
            accent: '#A8BFA8'
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
                color: darkMode ? '#e2e8f0' : '#1A2E4A'
            }}>
                {response}
            </div>
        </div>
    );
}