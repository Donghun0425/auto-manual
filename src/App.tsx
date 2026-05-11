/**
 * 메인 App 컴포넌트
 * - React Router를 사용하여 메인 페이지와 결과 페이지를 라우팅
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainPage } from './pages/MainPage';
import { ResultPage } from './pages/ResultPage';
import { Header } from './components/layout/Header';
import { TooltipProvider } from './components/ui/tooltip';

function App() {
  return (
    <TooltipProvider delayDuration={300}>
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
