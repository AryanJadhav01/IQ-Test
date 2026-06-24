import type { Metadata } from 'next';
import LandingPage from '../page';

export const metadata: Metadata = {
  title: 'Free IQ Test with Percentile Score | College Simplified',
  description: 'Take a free, fast, and scientifically structure cognitive ability test. Receive detailed reports and domain breakdowns without mandatory fee registration.',
  keywords: 'Free IQ Test, Student Cognitive Assessment, Free Aptitude Test, Logic Percentiles',
};

export default function FreeIQTestSEOPage() {
  return <LandingPage />;
}
