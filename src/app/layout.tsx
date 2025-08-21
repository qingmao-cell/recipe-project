import { ChakraProvider } from "@/components/providers/ChakraProvider";
import type { Metadata } from 'next';
import "./globals.css";

export const metadata: Metadata = {
  title: '食谱收藏夹',
  description: '收藏和管理你喜欢的食谱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <ChakraProvider>
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
            {children}
          </div>
        </ChakraProvider>
      </body>
    </html>
  );
}