import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata = {
  title: "İSTADENTAL — AI Destekli Diş Analizi",
  description:
    "İSTADENTAL AI Doktor: Ağız içi fotoğraflarınızı yükleyin, yapay zeka destekli kapsamlı diş analizi alın. Kron, veneer, implant ve kanal tedavisi değerlendirmesi.",
  keywords: "diş analizi, AI, yapay zeka, kron, veneer, implant, diş hekimi, İSTADENTAL",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
