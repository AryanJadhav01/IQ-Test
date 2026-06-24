import type { Metadata } from 'next';
import LandingPage from '../page';

export const metadata: Metadata = {
  title: 'Cognitive Ability Test & Logical Aptitude | College Simplified',
  description: 'Evaluate processing speed, pattern-matching capabilities, and consulting-tier problem-solving dynamics. Premium report breakdown included.',
  keywords: 'Cognitive Ability Test, Logical Aptitude Exam, Consulting Interview Prep, College Simplified Assessment',
};

export default function CognitiveAbilityTestSEOPage() {
  return <LandingPage />;
}
