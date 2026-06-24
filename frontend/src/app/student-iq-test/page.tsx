import type { Metadata } from 'next';
import LandingPage from '../page';

export const metadata: Metadata = {
  title: 'Student IQ Test & Cognitive Agility Analysis | College Simplified',
  description: 'Evaluate logical accuracy, cognitive processing speeds, and GMAT-level analytical thinking designed specifically for college students.',
  keywords: 'Student IQ Test, College Placement Exam, Academic Cognitive Agility, College Simplified IQ',
};

export default function StudentIQTestSEOPage() {
  return <LandingPage />;
}
