import type { Metadata } from 'next';
import './globals.css';

const inter = { variable: '' };
const poppins = { variable: '' };

export const metadata: Metadata = {
  title: 'College Simplified Advanced IQ Assessment - Measure Your Cognitive Profile',
  description: 'Measure your logical reasoning, numerical intelligence, pattern recognition, verbal reasoning, analytical thinking, and problem solving with College Simplified advanced student assessment.',
  keywords: 'IQ Test, Free IQ Test, Student IQ Test, Cognitive Ability Test, Aptitude Test, College Simplified, Intelligence Quotient',
  authors: [{ name: 'College Simplified' }],
  openGraph: {
    title: 'College Simplified Advanced IQ Assessment',
    description: 'Measure your logical reasoning, numerical intelligence, pattern recognition, verbal reasoning, analytical thinking, and problem solving with College Simplified.',
    url: 'https://collegesimplified.in/iq-test',
    type: 'website',
    images: [
      {
        url: 'https://collegesimplified.in/assets/og-iq-test.jpg',
        width: 1200,
        height: 630,
        alt: 'College Simplified IQ Assessment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Simplified Advanced IQ Assessment',
    description: 'Measure your logical reasoning, numerical intelligence, pattern recognition, verbal reasoning, analytical thinking, and problem solving with College Simplified.',
    images: ['https://collegesimplified.in/assets/og-iq-test.jpg'],
  },
};

export default function RootLayout({
  children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* SEO Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              'name': 'College Simplified',
              'url': 'https://collegesimplified.in',
              'logo': 'https://collegesimplified.in/logo.png',
              'description': 'Advanced cognitive assessments and career orientation platforms for students.',
              'sameAs': [
                'https://www.instagram.com/collegesimplified.in',
                'https://www.linkedin.com/company/collegesimplified'
              ]
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-dark-bg text-gray-100 antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
