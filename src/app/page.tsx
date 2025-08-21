import { redirect } from 'next/navigation';

export default function RootPage() {
  // 直接重定向到中文页面
  redirect('/zh');
}