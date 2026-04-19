import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chisel",
  description: "Turn ideas into agent-ready prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="h-screen flex flex-col font-mono">
        {/* Grid Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        {/* Glow Orb */}
        <div className="fixed w-[500px] h-[500px] -top-[100px] right-[15%] z-0 pointer-events-none">
          <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
