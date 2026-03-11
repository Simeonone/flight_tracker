import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FlightTracker from './FlightTracker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FlightTracker />
  </StrictMode>,
)
