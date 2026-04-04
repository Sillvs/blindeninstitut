import Image from "next/image";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
        <Image
          src="/logo.jpg"
          alt="Blindeninstitut Logo"
          width={180}
          height={60}
          className="h-12 w-auto"
        />
        <div className="ml-auto text-right">
          <p className="text-sm font-medium text-[#005ca9]">
            Eltern-Infobogen Generator
          </p>
          <p className="text-xs text-gray-500">
            Orthoptische Berichte verständlich aufbereitet
          </p>
        </div>
      </div>
    </header>
  );
}
