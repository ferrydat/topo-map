import MapApplication from "@/components/map-application"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full h-screen">
        <MapApplication />
      </div>
    </main>
  )
}

