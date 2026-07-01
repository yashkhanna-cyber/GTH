import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import AboutSection from '@/components/landing/AboutSection'
import HighlightsSection from '@/components/landing/HighlightsSection'
import ProjectsSection from '@/components/landing/ProjectsSection'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <HighlightsSection />
      <ProjectsSection />
      <Footer />
    </main>
  )
}
