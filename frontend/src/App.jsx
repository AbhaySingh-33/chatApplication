import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";

function App() {
	const { authUser } = useAuthContext();
	return (
		<div className='p-4 container w-full h-full bg-cover bg-center flex items-center justify-center'>
			<Routes>
				<Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
				<Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
				<Route path='/signup' element={authUser ? <Navigate to='/' /> : <SignUp />} />
			</Routes>
			<div className="fixed bottom-0 w-full bg-gray-800 text-white text-center py-2 shadow-lg">
  				<p className="text-sm flex justify-center items-center gap-1">
  				  <span>🚀</span> Designed and developed by <span className="font-semibold">Abhay Kumar Singh</span>
  				</p>
			</div>


			<Toaster />
		</div>
	);
}

export default App;