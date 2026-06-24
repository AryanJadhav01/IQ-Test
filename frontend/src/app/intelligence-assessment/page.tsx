import type { Metadata } from 'next';
import LandingPage from '../page';

export const metadata: Metadata = {
  title: 'College Simplified Student Intelligence Assessment Platform',
  description: 'Participate in our advanced student intelligence diagnostics mapping 6 key verticals. Designed for academic planning and career matching.',
  keywords: 'Intelligence Assessment, Psychometric Testing, Career Counseling Diagnostics, College Simplified',
};

export default function IntelligenceAssessmentSEOPage() {
  return <LandingPage />;
}
