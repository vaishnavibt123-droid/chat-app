import { useAuth } from "./AuthContext";
import AuthForm from "./components/AuthForm";
import Chat from "./components/Chat";

export default function App() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <p className="msg">Loading...</p>;

  return (
    <>
      <header className="top">
        <h1>Huddle</h1>
        {user && (
          <div className="top-right">
            <span>Hi, {user.name}</span>
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </header>
      {user ? <Chat /> : <AuthForm />}
    </>
  );
}