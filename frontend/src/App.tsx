import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Calendario from "./Calendario";
import Marco from "./Marco";
import PaginaClientes from "./clientes/PaginaClientes";

function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Marco />}>
          <Route path="/" element={<Navigate to="/agenda" replace />} />
          <Route path="/agenda" element={<Calendario />} />
          <Route path="/clientes" element={<PaginaClientes />} />
          <Route path="/clientes/nuevo" element={<PaginaClientes nuevo />} />
          <Route path="/clientes/:id" element={<PaginaClientes />} />
          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;
