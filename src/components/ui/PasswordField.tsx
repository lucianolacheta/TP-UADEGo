import { useState } from 'react'
import { IconLock, IconEye, IconEyeOff } from '@tabler/icons-react'

type Props = {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  autoFocus?: boolean
  disabled?: boolean
}

/** Campo de contraseña con botón "ojito" para mostrar/ocultar el texto. */
export default function PasswordField({
  label, value, onChange, placeholder, autoComplete, autoFocus, disabled,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div className="input-with-icon">
        <span className="input-icon"><IconLock size={18} /></span>
        <input
          className="input-field"
          style={{ paddingRight: 46 }}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
            display: 'flex', alignItems: 'center', padding: 4,
          }}
        >
          {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
        </button>
      </div>
    </div>
  )
}
