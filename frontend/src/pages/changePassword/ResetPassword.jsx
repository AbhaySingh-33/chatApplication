import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/reset/reset-password/${token}`, { password },{ withCredentials: true });
      toast.success("Password reset successful. You can now login.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      toast.error("Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[55vh] bg-gray-900 px-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-white mb-2">New Password</label>
          <input
            type="password"
            className="w-full input input-bordered h-10 bg-gray-700 text-white mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label className="block text-white mb-2">Confirm Password</label>
          <input
            type="password"
            className="w-full input input-bordered h-10 bg-gray-700 text-white mb-4"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="btn btn-success w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Resetting...</span>
              </div>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
