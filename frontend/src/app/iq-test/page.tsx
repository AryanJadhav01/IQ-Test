import type { Metadata } from 'next';
import LandingPage from '../page';

export const metadata: Metadata = {
  title: 'Official IQ Test & Cognitive Diagnostics | College Simplified',
  description: 'Participate in College Simplified official advanced IQ assessment. Accurately measure logic reasoning, quantitative metrics, and pattern matching.',
  keywords: 'IQ Test, Official IQ Test, Cognitive Diagnostics, College Simplified, Aptitude Testing',
};

export default function IQTestSEOPage() {
  return <LandingPage />;
}
