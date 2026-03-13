import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'FitCoach — AI Fitness Coach',
  description: 'Your personal AI-powered fitness coach for workouts, nutrition, and progress tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '10px',
            },
          }}
        />
      </body>
    </html>
  );
}
