import { Navigate } from 'react-router-dom';

export default function Index() {
  return <Navigate to="/stock/dashboard" replace />;
}
