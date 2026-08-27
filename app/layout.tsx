import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'高2013级5班十周年聚会',description:'十年之后，我们再聚一次。',openGraph:{title:'高2013级5班十周年聚会',description:'十年之后，我们再聚一次。',images:['/og.png']}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#241b16'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-CN"><body>{children}</body></html>}
