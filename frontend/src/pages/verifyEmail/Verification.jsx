import { useAuthContext } from "../../context/AuthContext";

const Verification = () => {
  const { authUser } = useAuthContext();

  return (
    <div className="flex flex-col items-center justify-center mt-20 p-4">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-6 flex flex-col items-center justify-center w-72 sm:w-96 min-h-[200px]">
        {!authUser ? (
          <>
            <span className="text-yellow-500 text-4xl mb-2">⏳</span>
            <p className="text-center text-base sm:text-lg font-semibold text-gray-700">
              Please log in to verify your email.
            </p>
          </>
        ) : authUser.isVerified ? (
          <>
            <span className="text-green-500 text-4xl mb-2">✅</span>
            <p className="text-center text-base sm:text-lg font-semibold text-gray-700">
              Your email is already verified!
            </p>
          </>
        ) : (
          <>
            <span className="text-yellow-500 text-4xl mb-2 animate-bounce">📨</span>
            <p className="text-center text-base sm:text-lg font-semibold text-gray-700">
              We've sent a verification link to your email.
            </p>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Please check your inbox and verify to continue.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Verification;
