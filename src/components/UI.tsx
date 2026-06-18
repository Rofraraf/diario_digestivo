import React from 'react'

// ─── BigButton ────────────────────────────────────────────────────────────────
interface BigButtonProps {
  onClick?: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  icon?: React.ReactNode
  fullWidth?: boolean
}

export function BigButton({ onClick, children, variant = 'primary', className = '', disabled, type = 'button', icon, fullWidth = true }: BigButtonProps) {
  const base = 'flex items-center justify-center gap-2 rounded-2xl font-semibold text-[17px] px-5 py-4 transition-all active:scale-95 select-none'
  const widthClass = fullWidth ? 'w-full' : ''
  const variants: Record<string, string> = {
    primary:   'bg-[#2D6A4F] text-white shadow-sm active:bg-[#245A41]',
    secondary: 'bg-white text-[#2D6A4F] border-2 border-[#2D6A4F] active:bg-[#F0FFF4]',
    danger:    'bg-[#E76F51] text-white shadow-sm active:bg-[#c85d3f]',
    ghost:     'bg-[#F3F4F6] text-[#374151] active:bg-[#E5E7EB]',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${widthClass} ${variants[variant]} ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-[#F0F0EE] p-4 ${className}`}>
      {children}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[22px] font-bold text-[#1A1A2E]">{title}</h2>
      {subtitle && <p className="text-[15px] text-[#6B7280] mt-1">{subtitle}</p>}
    </div>
  )
}

// ─── Label ────────────────────────────────────────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-[15px] font-semibold text-[#374151] mb-1">{children}</span>
}

// ─── ToggleChip ───────────────────────────────────────────────────────────────
interface ToggleChipProps {
  label: string
  selected: boolean
  onToggle: () => void
  color?: 'green' | 'red' | 'yellow' | 'blue'
}

export function ToggleChip({ label, selected, onToggle, color = 'green' }: ToggleChipProps) {
  const colors: Record<string, string> = {
    green:  selected ? 'bg-[#2D6A4F] text-white' : 'bg-[#F3F4F6] text-[#374151]',
    red:    selected ? 'bg-[#E76F51] text-white' : 'bg-[#F3F4F6] text-[#374151]',
    yellow: selected ? 'bg-[#E9C46A] text-[#1A1A2E]' : 'bg-[#F3F4F6] text-[#374151]',
    blue:   selected ? 'bg-[#3B82F6] text-white' : 'bg-[#F3F4F6] text-[#374151]',
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-4 py-2 text-[15px] font-medium border transition-all active:scale-95 ${colors[color]} ${selected ? 'border-transparent' : 'border-[#E5E7EB]'}`}
    >
      {label}
    </button>
  )
}

// ─── SelectRow ────────────────────────────────────────────────────────────────
interface SelectRowProps {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}

export function SelectRow({ label, options, value, onChange }: SelectRowProps) {
  return (
    <div className="mb-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-xl px-4 py-2 text-[15px] font-medium border transition-all active:scale-95 ${
              value === opt.value
                ? 'bg-[#2D6A4F] text-white border-transparent'
                : 'bg-white text-[#374151] border-[#E5E7EB]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── TextArea ─────────────────────────────────────────────────────────────────
interface TextAreaProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }: TextAreaProps) {
  return (
    <div className="mb-3">
      {label && <Label>{label}</Label>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[16px] text-[#1A1A2E] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
      />
    </div>
  )
}

// ─── TextInput ────────────────────────────────────────────────────────────────
interface TextInputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}

export function TextInput({ label, value, onChange, placeholder, type = 'text' }: TextInputProps) {
  return (
    <div className="mb-3">
      {label && <Label>{label}</Label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[16px] text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
      />
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-[#E5E7EB] rounded-full mx-auto mb-4" />
        <h3 className="text-[20px] font-bold text-[#1A1A2E] mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}

// ─── DayBadge ─────────────────────────────────────────────────────────────────
export function DayBadge({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) {
  const styles: Record<string, string> = {
    green:  'bg-[#D1FAE5] text-[#065F46]',
    yellow: 'bg-[#FEF3C7] text-[#92400E]',
    red:    'bg-[#FEE2E2] text-[#991B1B]',
    gray:   'bg-[#F3F4F6] text-[#6B7280]',
  }
  const labels: Record<string, string> = {
    green: 'Buen día', yellow: 'Molestias moderadas', red: 'Molestias fuertes', gray: 'Sin datos'
  }
  return (
    <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${styles[color]}`}>
      {labels[color]}
    </span>
  )
}

// ─── IntensitySlider ──────────────────────────────────────────────────────────
interface IntensitySliderProps {
  value: number
  onChange: (v: number) => void
}

export function IntensitySlider({ value, onChange }: IntensitySliderProps) {
  const labels = ['Sin molestia', 'Muy leve', 'Leve', 'Moderada', 'Fuerte', 'Muy fuerte']
  const colors = ['#6B7280', '#52B788', '#E9C46A', '#F4A261', '#E76F51', '#C1121F']
  return (
    <div className="mb-3">
      <Label>Intensidad: {labels[value]}</Label>
      <div className="flex gap-2 mt-2">
        {[0, 1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 h-12 rounded-xl font-bold text-[16px] transition-all active:scale-95 ${
              value === v ? 'text-white shadow-sm' : 'bg-[#F3F4F6] text-[#6B7280]'
            }`}
            style={value === v ? { backgroundColor: colors[v] } : {}}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string
  type?: 'success' | 'error'
}

export function Toast({ message, type = 'success' }: ToastProps) {
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 text-white text-[15px] font-semibold shadow-lg ${
      type === 'success' ? 'bg-[#2D6A4F]' : 'bg-[#E76F51]'
    }`}>
      {message}
    </div>
  )
}

// ─── DateTimeInput ────────────────────────────────────────────────────────────
interface DateTimeInputProps {
  label: string
  value: number
  onChange: (v: number) => void
}

export function DateTimeInput({ label, value, onChange }: DateTimeInputProps) {
  const toLocalISO = (ts: number) => {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return (
    <div className="mb-3">
      <Label>{label}</Label>
      <input
        type="datetime-local"
        value={toLocalISO(value)}
        onChange={e => onChange(new Date(e.target.value).getTime())}
        className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[16px] text-[#1A1A2E] focus:outline-none focus:border-[#2D6A4F]"
      />
    </div>
  )
}

// ─── ConfirmModal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h3 className="text-[20px] font-bold text-[#1A1A2E] mb-2">{title}</h3>
        <p className="text-[16px] text-[#6B7280] mb-6">{message}</p>
        <div className="flex gap-3">
          <BigButton variant="ghost" onClick={onCancel}>Cancelar</BigButton>
          <BigButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirmar</BigButton>
        </div>
      </div>
    </div>
  )
}
