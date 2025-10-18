// App.tsx
import { Routes, Route, useLocation } from "react-router-dom";
import LoginScreen from "./Screens/Login";
import ListPhotosScreen from "./Screens/ListPhotosScreen";
import PhotoScreen from "./Screens/PhotoScreen";
import Header from "./components/Header";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const location = useLocation();

  // Lista de paths donde NO queremos mostrar el header
  const noHeaderPaths = ["/", "/login"];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  return (
    <div>
      {showHeader && <Header />}

      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route
          path="/photos"
          element={
            <ListPhotosScreen />
          }
        />
        <Route
          path="/photo"
          element={
            <PhotoScreen />
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
