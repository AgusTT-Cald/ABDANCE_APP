import { Link } from 'react-router-dom';
import './App.css'
import {Background, Logo, LoginForm} from './components'
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useFavicon } from './hooks/useFavicon';
import { useNavigate } from "react-router-dom";


function App() {
  useDocumentTitle("Academia ABDANCE");
  useFavicon("/dance.ico")
  
  const navigate = useNavigate();

  const irAEventos = () => {
    navigate("/eventos");
  };

  return (
    <>
        {/* <PagosTest></PagosTest> */}
        <Background />
        <Logo /> 
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <LoginForm ></LoginForm>
          

          <h3 className='relative top-40'>
            ¿Te interesa saber sobre nuestros eventos?{" "}
            <button onClick={irAEventos} className='text-blue-400 underline hover:text-blue-600'>
              ¡Hace click Aquí!
            </button>
          </h3>
        
        </div>
    </>
  )
}

export default App
