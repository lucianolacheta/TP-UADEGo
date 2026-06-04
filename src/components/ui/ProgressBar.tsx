export default function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  )
}
