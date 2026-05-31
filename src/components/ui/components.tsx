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
      fontWeight: 500,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.5 : 1,
      transition: 'all var(--transition-fast)',
      border: '1px solid transparent',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: '0.8125rem', borderRadius: 'var(--radius-sm)' },
      md: { padding: '8px 16px', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' },
      lg: { padding: '12px 24px', fontSize: '1rem', borderRadius: 'var(--radius-md)' },
      icon: { padding: '8px', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', aspectRatio: '1' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'linear-gradient(135deg, var(--accent-cyan), #0EA5E9)',
        color: '#0F172A',
        fontWeight: 600,
        borderColor: 'transparent',
        boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)',
      },
      secondary: {
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-base)',
        boxShadow: 'var(--shadow-sm)',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--text-muted)',
        borderColor: 'transparent',
      },
      danger: {
        background: 'var(--danger-dim)',
        color: 'var(--danger)',
        borderColor: 'rgba(239,68,68,0.3)',
      },
      success: {
        background: 'var(--success-dim)',
        color: 'var(--success)',
        borderColor: 'rgba(16,185,129,0.3)',
      },
    };

    return (
      <motion.button
        ref={ref}
        style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant] }}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
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

  const glowMap = {
    none: 'var(--shadow-raised)',
    cyan: 'var(--shadow-raised), var(--shadow-glow-cyan)',
    purple: 'var(--shadow-raised), var(--shadow-glow-purple)',
  };

  return (
    <motion.div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${glow !== 'none' ? (glow === 'cyan' ? 'rgba(34,211,238,0.2)' : 'rgba(139,92,246,0.2)') : 'var(--border-base)'}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: glowMap[glow],
        padding: paddingMap[padding],
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      whileHover={
        hover
          ? {
              y: -2,
              borderColor: glow === 'cyan'
                ? 'rgba(34,211,238,0.4)'
                : glow === 'purple'
                ? 'rgba(139,92,246,0.4)'
                : 'var(--border-hover)',
              boxShadow: glowMap[glow].replace('var(--shadow-raised)', '16px 16px 32px rgba(0,0,0,0.4), -10px -10px 30px rgba(255,255,255,0.04)'),
            }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
          {leftIcon && (
            <div style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-dim)', display: 'flex', alignItems: 'center', pointerEvents: 'none',
            }}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: '100%',
              padding: `10px ${rightIcon ? '40px' : '14px'} 10px ${leftIcon ? '40px' : '14px'}`,
              background: 'var(--bg-base)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border-base)'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-inset)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              transition: 'all var(--transition-fast)',
              ...style,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-accent)';
              e.target.style.boxShadow = `var(--shadow-inset), 0 0 0 2px var(--accent-cyan-dim)`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-base)';
              e.target.style.boxShadow = 'var(--shadow-inset)';
            }}
            {...props}
          />
          {rightIcon && (
            <div style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-dim)', display: 'flex', alignItems: 'center',
            }}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>
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
  critical: { background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' },
  high:     { background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' },
  medium:   { background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)' },
  low:      { background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: '1px solid rgba(34,211,238,0.3)' },
  info:     { background: 'rgba(148,163,184,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(148,163,184,0.2)' },
  success:  { background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' },
  purple:   { background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.3)' },
  cyan:     { background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: '1px solid rgba(34,211,238,0.3)' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'info', size = 'sm' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: size === 'sm' ? '2px 8px' : '4px 10px',
    fontSize: size === 'sm' ? '0.7rem' : '0.8125rem',
    fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', borderRadius: 'var(--radius-full)',
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
  height = 6,
  showValue = false,
  style,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div style={style}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
          {label && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{label}</span>}
          {showValue && <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{clampedValue}%</span>}
        </div>
      )}
      <div style={{
        height: `${height}px`, borderRadius: 'var(--radius-full)',
        background: 'var(--bg-base)', boxShadow: 'var(--shadow-inset-sm)', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 'var(--radius-full)',
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}50`,
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
  color = 'var(--accent-cyan)',
}) => (
  <motion.div
    style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: '50%',
      border: `2px solid ${color}20`,
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
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent-cyan)',
        }}
        animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
      />
    ))}
    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
      AI is thinking...
    </span>
  </div>
);

// ─── Divider ──────────────────────────────────────────────────

export const Divider: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-base)' }} />
    {label && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{label}</span>}
    {label && <div style={{ flex: 1, height: '1px', background: 'var(--border-base)' }} />}
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
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const ringColor = color === 'var(--accent-cyan)' ? getColor() : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--bg-base)" strokeWidth={8}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={ringColor} strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${ringColor})` }}
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
            transition={{ delay: 0.5 }}
            style={{ fontSize: size > 60 ? '1.25rem' : '0.875rem', fontWeight: 700, color: ringColor }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      {label && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>}
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
      justifyContent: 'center', gap: '12px', padding: '48px 24px', textAlign: 'center',
    }}
  >
    <div style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{icon}</div>
    <div>
      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</p>
      {description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{description}</p>}
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
  success: { border: 'rgba(16,185,129,0.3)', icon: 'var(--success)', bg: 'var(--success-dim)' },
  error:   { border: 'rgba(239,68,68,0.3)',  icon: 'var(--danger)',  bg: 'var(--danger-dim)' },
  warning: { border: 'rgba(245,158,11,0.3)', icon: 'var(--warning)', bg: 'var(--warning-dim)' },
  info:    { border: 'rgba(34,211,238,0.3)', icon: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)' },
};

export const Toast: React.FC<ToastProps> = ({ type, title, message, onClose }) => {
  const colors = TOAST_COLORS[type];
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        boxShadow: 'var(--shadow-raised)',
        maxWidth: '320px', minWidth: '240px',
        borderLeft: `3px solid ${colors.icon}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{title}</p>
        {message && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>{message}</p>}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', color: 'var(--text-dim)',
          cursor: 'pointer', padding: '2px', flexShrink: 0,
        }}
      >
        ×
      </button>
    </motion.div>
  );
};

// End of component library
