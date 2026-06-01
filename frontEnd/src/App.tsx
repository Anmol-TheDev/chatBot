import Background from './Background';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';

function App() {
  return (
    <div className="relative w-full min-h-screen">
      {/* Background Image Layer with Black Tint */}
      <div className="fixed inset-0 w-full h-screen bg-[url('/background2.png')] bg-cover bg-center bg-no-repeat -z-30">
        <div className="absolute inset-0 bg-black/15 dark:bg-black/40" />
      </div>
      
      {/* Particle Effect Layer - Interactive background */}
      <div className="fixed inset-0 z-0">
        <Background />
      </div>
      
      {/* Radial Gradient Overlay */}
      <div className="fixed inset-0 z-5 hero-gradient pointer-events-none" />
      
      {/* Content Layer - Everything transparent except interactive elements */}
      <div className='relative z-10'>
        <Navigation />
        <main>
          <HeroSection />
        </main>
      </div>
    </div>
  )
}

export default App
