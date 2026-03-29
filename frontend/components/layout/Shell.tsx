import Navbar from './Navbar'

export default function Shell({
  children,
  role,
  orgName,
}: {
  children: React.ReactNode
  role: string
  orgName?: string
}) {
  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <Navbar role={role} orgName={orgName} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}