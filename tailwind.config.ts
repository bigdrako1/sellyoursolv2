
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Custom trading platform colors that support themes
        trading: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          success: 'hsl(var(--trading-success))',
          danger: 'hsl(var(--trading-danger))',
          warning: 'hsl(var(--trading-warning))',
          dark: 'hsl(var(--trading-dark))',
          darkAccent: 'hsl(var(--trading-darkAccent))',
          highlight: 'hsl(var(--trading-highlight))'
        },
        solana: '#9945FF',
        // Additional colors for UI
        indigo: {
          600: '#4f46e5',
        },
        purple: {
          500: '#8b5cf6',
          700: '#6d28d9',
          900: '#4c1d95',
        },
        gray: {
          700: '#374151',
          900: '#111827',
        },
        green: {
          300: '#86efac',
          500: '#22c55e',
        },
        red: {
          300: '#fca5a5',
          500: '#ef4444',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)'
          },
          '50%': {
            opacity: '0.7',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.8)'
          }
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite',
        'fade-in': 'fadeIn 0.3s ease-out'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'blue-purple-gradient': 'linear-gradient(to right, #3b82f6, #8b5cf6)',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    // Add custom variant for dark mode only
    plugin(function({ addVariant }) {
      // Add dark variant
      addVariant('dark', ['.dark &', '.dark&']);
      
      // Add border utility variant
      addVariant('with-border', '&.with-border');
    }),
  ],
} satisfies Config;
