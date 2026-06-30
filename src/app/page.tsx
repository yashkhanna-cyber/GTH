import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import AboutSection from '@/components/landing/AboutSection'
import HighlightsSection from '@/components/landing/HighlightsSection'
import ProjectsSection from '@/components/landing/ProjectsSection'
import PrizesSection from '@/components/landing/PrizesSection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <HighlightsSection />
      <ProjectsSection />
      <PrizesSection />
      <Footer />
    </main>
  )
}
