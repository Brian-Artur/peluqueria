import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Calendario from "./Calendario";
import Marco from "./Marco";
import PaginaClientes from "./clientes/PaginaClientes";
import { SesionProvider } from "./sesion/SesionProvider";
import RutasProtegidas from "./sesion/RutasProtegidas";
import PaginaEntrar from "./sesion/PaginaEntrar";

function App(): ReactElement {
  return (
    <BrowserRouter>
      <SesionProvider>
        <Routes>
          <Route path="/entrar" element={<PaginaEntrar />} />
          <Route element={<RutasProtegidas />}>
            <Route element={<Marco />}>
              <Route path="/" element={<Navigate to="/agenda" replace />} />
              <Route path="/agenda" element={<Calendario />} />
              <Route path="/clientes" element={<PaginaClientes />} />
              <Route path="/clientes/nuevo" element={<PaginaClientes nuevo />} />
              <Route path="/clientes/:id" element={<PaginaClientes />} />
              <Route path="*" element={<Navigate to="/agenda" replace />} />
            </Route>
          </Route>
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}
export default App;
