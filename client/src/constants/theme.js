// Theme color constants for easy maintenance
export const colors = {
    // Brand Colors (Orange from Fintrixity)
    primary: {
        DEFAULT: '#FF6B35',
        dark: '#E85D2F',
        light: '#FF8A5C',
        lighter: '#FFB399',
    },

    // Semantic Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4',

    // Dark Theme
    dark: {
        background: '#0F0F0F',
        surface: '#1A1A1A',
        surfaceElevated: '#252525',
        surfaceHover: '#2A2A2A',
        border: '#333333',
        borderLight: '#404040',

        text: {
            primary: '#FFFFFF',
            secondary: '#A0A0A0',
            tertiary: '#6B6B6B',
            disabled: '#4A4A4A',
        },
    },

    // Light Theme
    light: {
        background: '#FAFAFA',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',
        surfaceHover: '#F5F5F5',
        border: '#E5E5E5',
        borderLight: '#F0F0F0',

        text: {
            primary: '#1A1A1A',
            secondary: '#6B6B6B',
            tertiary: '#9B9B9B',
            disabled: '#CCCCCC',
        },
    },
};

// Theme configuration
export const themes = {
    dark: {
        name: 'dark',
        colors: {
            primary: colors.primary.DEFAULT,
            primaryDark: colors.primary.dark,
            primaryLight: colors.primary.light,

            background: colors.dark.background,
            surface: colors.dark.surface,
            surfaceElevated: colors.dark.surfaceElevated,
            surfaceHover: colors.dark.surfaceHover,

            border: colors.dark.border,
            borderLight: colors.dark.borderLight,

            textPrimary: colors.dark.text.primary,
            textSecondary: colors.dark.text.secondary,
            textTertiary: colors.dark.text.tertiary,
            textDisabled: colors.dark.text.disabled,

            success: colors.success,
            warning: colors.warning,
            error: colors.error,
            info: colors.info,
        },
    },
    light: {
        name: 'light',
        colors: {
            primary: colors.primary.DEFAULT,
            primaryDark: colors.primary.dark,
            primaryLight: colors.primary.light,

            background: colors.light.background,
            surface: colors.light.surface,
            surfaceElevated: colors.light.surfaceElevated,
            surfaceHover: colors.light.surfaceHover,

            border: colors.light.border,
            borderLight: colors.light.borderLight,

            textPrimary: colors.light.text.primary,
            textSecondary: colors.light.text.secondary,
            textTertiary: colors.light.text.tertiary,
            textDisabled: colors.light.text.disabled,

            success: colors.success,
            warning: colors.warning,
            error: colors.error,
            info: colors.info,
        },
    },
};

export default themes;
