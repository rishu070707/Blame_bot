import React from 'react';
import { motion } from 'framer-motion';

// ─── Button ──────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 800,
      textTransform: 'uppercase',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.5 : 1,
      transition: 'all 0.1s step-end',
      border: 'var(--border-width) solid #000',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      letterSpacing: '0.05em',
      position: 'relative',
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: '0.8125rem' },
      md: { padding: '8px 16px', fontSize: '0.875rem' },
      lg: { padding: '12px 24px', fontSize: '1rem' },
      icon: { padding: '8px', fontSize: '0.875rem', aspectRatio: '1' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'var(--accent-cyan)',
        color: '#000',
        boxShadow: 'var(--shadow-raised)',
      },
      secondary: {
        background: '#fff',
        color: '#000',
        boxShadow: 'var(--shadow-raised)',
      },
      ghost: {
        background: 'transparent',
        color: '#000',
        borderColor: 'transparent',
      },
      danger: {
        background: 'var(--danger)',
        color: '#000',
        boxShadow: 'var(--shadow-raised)',
      },
      success: {
        background: 'var(--success)',
        color: '#000',
        boxShadow: 'var(--shadow-raised)',
      },
    };

    return (
      <motion.button
        ref={ref}
        style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant] }}
        whileHover={!disabled && !isLoading && variant !== 'ghost' ? { backgroundColor: 'var(--accent-yellow)' } : undefined}
        whileTap={!disabled && !isLoading && variant !== 'ghost' ? { x: 4, y: 4, boxShadow: '0px 0px 0px #000' } : undefined}
        disabled={disabled || isLoading}
        {...(props as any)}
      >
        {isLoading ? (
          <LoadingSpinner size={14} color="currentColor" />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

// ─── Card ─────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  onClick?: () => void;
  glow?: 'cyan' | 'purple' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  hover = false,
  onClick,
  glow = 'none',
  padding = 'md',
}) => {
  const paddingMap = {
    none: '0',
    sm: 'var(--space-3)',
    md: 'var(--space-5)',
    lg: 'var(--space-6)',
  };

  return (
    <motion.div
      onClick={onClick}
      style={{
        background: glow === 'cyan' ? 'var(--accent-cyan-dim)' : glow === 'purple' ? 'var(--accent-purple-dim)' : '#fff',
        border: `var(--border-width) solid #000`,
        boxShadow: hover ? 'var(--shadow-raised)' : 'var(--shadow-sm)',
        padding: paddingMap[padding],
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.1s step-end',
        position: 'relative',
        ...style,
      }}
      whileHover={
        hover
          ? {
              x: -4,
              y: -4,
              boxShadow: '8px 8px 0px #000',
            }
          : undefined
      }
      whileTap={
        hover
          ? {
              x: 0,
              y: 0,
              boxShadow: 'var(--shadow-sm)',
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
};

// ─── Input ────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, label, error, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '0.875rem', color: '#000', fontWeight: 800, textTransform: 'uppercase' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
          {leftIcon && (
            <div style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: '#000', display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: '100%',
              padding: `10px ${rightIcon ? '40px' : '14px'} 10px ${leftIcon ? '40px' : '14px'}`,
              background: '#fff',
              border: `var(--border-width) solid #000`,
              boxShadow: 'var(--shadow-sm)',
              color: '#000',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.1s step-end',
              ...style,
            }}
            onFocus={(e) => {
              e.target.style.background = 'var(--accent-yellow)';
              e.target.style.boxShadow = `4px 4px 0px #000`;
            }}
            onBlur={(e) => {
              e.target.style.background = '#fff';
              e.target.style.boxShadow = 'var(--shadow-sm)';
            }}
            {...props}
          />
          {rightIcon && (
            <div style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              color: '#000', display: 'flex', alignItems: 'center',
            }}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 800, textTransform: 'uppercase' }}>{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Badge ────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
}

const BADGE_STYLES: Record<string, React.CSSProperties> = {
  critical: { background: 'var(--danger)', color: '#000', border: 'var(--border-width) solid #000' },
  high:     { background: '#F97316', color: '#000', border: 'var(--border-width) solid #000' },
  medium:   { background: 'var(--warning)', color: '#000', border: 'var(--border-width) solid #000' },
  low:      { background: 'var(--accent-cyan)', color: '#000', border: 'var(--border-width) solid #000' },
  info:     { background: '#e2e8f0', color: '#000', border: 'var(--border-width) solid #000' },
  success:  { background: 'var(--success)', color: '#000', border: 'var(--border-width) solid #000' },
  purple:   { background: 'var(--accent-purple)', color: '#000', border: 'var(--border-width) solid #000' },
  cyan:     { background: 'var(--accent-cyan)', color: '#000', border: 'var(--border-width) solid #000' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', size = 'sm' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: size === 'sm' ? '4px 8px' : '6px 12px',
    fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
    fontWeight: 900, letterSpacing: '0.05em',
    textTransform: 'uppercase', boxShadow: '2px 2px 0px #000',
    ...BADGE_STYLES[variant],
  }}>
    {children}
  </span>
);

// ─── Progress Bar ─────────────────────────────────────────────

interface ProgressProps {
  value: number; // 0-100
  color?: string;
  label?: string;
  height?: number;
  showValue?: boolean;
  style?: React.CSSProperties;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  color = 'var(--accent-cyan)',
  label,
  height = 12,
  showValue = false,
  style,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div style={style}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
          {label && <span style={{ fontSize: '0.875rem', color: '#000', fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>}
          {showValue && <span style={{ fontSize: '0.875rem', color: '#000', fontWeight: 900 }}>{clampedValue}%</span>}
        </div>
      )}
      <div style={{
        height: `${height}px`,
        background: '#fff', border: 'var(--border-width) solid #000', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRight: 'var(--border-width) solid #000',
          }}
        />
      </div>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const LoadingSpinner: React.FC<SpinnerProps> = ({
  size = 20,
  color = '#000',
}) => (
  <motion.div
    style={{
      width: size, height: size, flexShrink: 0,
      border: `3px solid ${color}40`,
      borderTopColor: color,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
  />
);

// ─── Thinking Indicator ───────────────────────────────────────

export const ThinkingDots: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 0' }}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        style={{
          width: 10, height: 10,
          background: '#000',
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'linear' }}
      />
    ))}
    <span style={{ fontSize: '0.875rem', color: '#000', marginLeft: '6px', fontWeight: 800, textTransform: 'uppercase' }}>
      PROCESSING...
    </span>
  </div>
);

// ─── Divider ──────────────────────────────────────────────────

export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
    <div style={{ flex: 1, height: '3px', background: '#000' }} />
    {label && <span style={{ fontSize: '0.875rem', color: '#000', whiteSpace: 'nowrap', fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>}
    {label && <div style={{ flex: 1, height: '3px', background: '#000' }} />}
  </div>
);

// ─── Score Ring ───────────────────────────────────────────────

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  color?: string;
  label?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 80,
  color = 'var(--accent-cyan)',
  label,
}) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const ringColor = color === 'var(--accent-cyan)' ? getColor() : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, border: 'var(--border-width) solid #000', borderRadius: '50%', boxShadow: '4px 4px 0px #000', background: '#fff' }}></div>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#e2e8f0" strokeWidth={10}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={10}
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: size > 60 ? '1.5rem' : '1rem', fontWeight: 900, color: '#000', textShadow: `2px 2px 0px ${ringColor}` }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      {label && <span style={{ fontSize: '0.875rem', color: '#000', fontWeight: 800, textTransform: 'uppercase' }}>{label}</span>}
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '16px', padding: '48px 24px', textAlign: 'center',
      background: '#fff', border: 'var(--border-width) solid #000', boxShadow: 'var(--shadow-raised)',
    }}
  >
    <div style={{ color: '#000' }}>{icon}</div>
    <div>
      <p style={{ fontWeight: 900, color: '#000', marginBottom: '8px', textTransform: 'uppercase', fontSize: '1.25rem' }}>{title}</p>
      {description && <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>{description}</p>}
    </div>
    {action}
  </motion.div>
);

// ─── Notification Toast ───────────────────────────────────────

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
}

const TOAST_COLORS = {
  success: { bg: 'var(--success)', icon: '#000' },
  error:   { bg: 'var(--danger)',  icon: '#000' },
  warning: { bg: 'var(--warning)', icon: '#000' },
  info:    { bg: 'var(--accent-cyan)', icon: '#000' },
};

export const Toast: React.FC<ToastProps> = ({ type, title, message, onClose }) => {
  const colors = TOAST_COLORS[type];
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      style={{
        background: 'var(--vscode-panel)',
        border: `1px solid var(--vscode-border)`,
        borderLeft: `4px solid ${colors.bg}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        maxWidth: '320px', minWidth: '240px',
        color: 'var(--text-primary)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</p>
        {message && <p style={{ fontSize: '0.8125rem', marginTop: '4px', color: 'var(--text-secondary)' }}>{message}</p>}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', padding: '2px', flexShrink: 0,
          fontSize: '18px', lineHeight: '14px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        ×
      </button>
    </motion.div>
  );
};
