import { useOnlineStatus } from '@/hooks/use-online-status'

export function ConnectionBadge() {
  const online = useOnlineStatus()

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-extrabold text-gray-700">
      <span
        className={online ? 'size-2 rounded-full bg-success' : 'size-2 rounded-full bg-warning'}
        aria-hidden="true"
      />
      {online ? 'En línea' : 'Sin conexión'}
    </span>
  )
}
