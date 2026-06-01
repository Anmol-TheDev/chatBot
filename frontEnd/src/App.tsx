import Background from './Background';

function App() {
  return (
    <>
      {/* Background Image Layer with Black Tint */}
      <div className="fixed inset-0 w-full h-screen bg-[url('/background2.png')] bg-cover bg-center bg-no-repeat -z-20">
        <div className="absolute inset-0 bg-black/15" />
      </div>
      
      {/* Particle Effect Layer */}
      <div className="-z-10">
        <Background />
      </div>
      
      {/* Content Layer */}
      <div className='relative z-10'>
        {/* Your home page content goes here */}
      </div>
    </>
  )
}

export default App
