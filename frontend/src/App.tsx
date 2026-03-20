import './App.css';
import { MainButton } from './components/MainButton';
import { SourcesPanel } from './components/SourcesPanel';
import { useAppConversation } from './hooks/useAppConversation';

export default function App() {
  const { appState, sources, idea, startSession, endSession, error } = useAppConversation();

  return (
    <div className={`app app--${appState}`}>
      <div className="left-panel">
        <h1 className="wordmark">KillMyStartup</h1>
        <MainButton state={appState} onStart={startSession} onStop={endSession} />
        {error && <p className="error-msg">{error}</p>}
      </div>

      <SourcesPanel sources={sources} idea={idea} />
    </div>
  );
}
