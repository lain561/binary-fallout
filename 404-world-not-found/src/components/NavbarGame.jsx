// NavbarGame.jsx - For logged in users (Card and Progress pages)
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/login"; // Import the logout function

export default function NavbarGame() {
  const navigate = useNavigate(); // For redirecting after logout
  
  const handleLogout = () => {
    // Call the logout function from your API
    logoutUser();
    console.log("Logged out successfully");
    // Redirect to home page after logout
    navigate('/');
  };

  return (
    <nav className="w-full flex justify-end items-center px-12 py-8 text-green-400 font-theme text-xl font-bold text-shadow-lg">
      <button
        onClick={handleLogout}
        className="hover:underline cursor-pointer"
      >
        LOGOUT
      </button>
    </nav>
  );
}