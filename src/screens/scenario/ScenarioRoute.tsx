import { Navigate, useParams } from 'react-router-dom';
import { InterviewFlow } from './InterviewFlow';
import { ScenarioFlow } from './ScenarioFlow';

export function ScenarioRoute() {
  const { id } = useParams();
  if (id === 'interview') return <InterviewFlow />;
  if (id === 'talk' || id === 'pitch' || id === 'event') return <ScenarioFlow key={id} id={id} />;
  return <Navigate to="/practice" replace />;
}
