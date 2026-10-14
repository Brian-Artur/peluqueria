import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Calendario from "./Calendario";
import Marco from "./Marco";
import PaginaClientes from "./clientes/PaginaClientes";
import { SesionProvider } from "./sesion/SesionProvider";
import RutasProtegidas from "./sesion/RutasProtegidas";
import PaginaEntrar from "./sesion/PaginaEntrar";
import PaginaMiCuenta from "./sesion/PaginaMiCuenta";
import PaginaUsuarios from "./usuarios/PaginaUsuarios";
import PaginaServicios from "./servicios/PaginaServicios";

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
              <Route path="/servicios" element={<PaginaServicios />} />
              <Route path="/servicios/nuevo" element={<PaginaServicios nuevo />} />
              <Route path="/servicios/:id" element={<PaginaServicios />} />
              <Route path="/usuarios" element={<PaginaUsuarios />} />
              <Route path="/usuarios/nuevo" element={<PaginaUsuarios nuevo />} />
              <Route path="/usuarios/:id" element={<PaginaUsuarios />} />
              <Route path="/mi-cuenta" element={<PaginaMiCuenta />} />
              <Route path="*" element={<Navigate to="/agenda" replace />} />
            </Route>
          </Route>
        </Routes>
      </SesionProvider>
    </BrowserRouter>
  );
}
export default App;
