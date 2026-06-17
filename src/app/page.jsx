import Image from "next/image";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen text-white">

      {/* Background Image */}
      <Image
        src="/bg_image.png"
        alt="Background"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">
          Welcome to Blackhole Retail
        </h1>
        <p className="text-slate-300 text-sm mb-8">
          HR Management System
        </p>
        <div className="flex gap-4">
          <a href="/register" className="bg-blue-500 px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm">
            Add Employee
          </a>
          <a href="/login" className="bg-green-500 px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-medium text-sm">
            Login
          </a>
        </div>
      </div>

    </div>
  );
}