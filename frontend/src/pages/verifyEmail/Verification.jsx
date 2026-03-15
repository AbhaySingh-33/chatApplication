import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";

const Verification = () => {
  const { authUser } = useAuthContext();
  const {logout}= useLogout();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center w-72 sm:w-96 animate-slide-up">
        {!authUser ? (
          <>
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-center text-base font-semibold text-white">Please log in to verify your email.</p>
          </>
        ) : authUser.isVerified ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-center text-base font-semibold text-white">Email already verified!</p>
            <p className="text-sm text-blue-200 mt-1 text-center">You're all set to use Chattrix.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-center text-base font-semibold text-white">Verification email sent!</p>
            <p className="text-sm text-blue-200 mt-2 text-center">Check your inbox and click the link to verify your account.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Verification;
