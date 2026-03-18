import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import OrderDashboard from './pages/OrderDashboard';
import CreateOrder from './pages/CreateOrder';
import OrderEdit from './pages/OrderEdit';
import OrderView from './pages/OrderView';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OrderDashboard />} />
            <Route path="create" element={<CreateOrder />} />
            <Route path="order/:id" element={<OrderView />} />
            <Route path="order/:id/edit" element={<OrderEdit />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
