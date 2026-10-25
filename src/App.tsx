import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './lib/AppContext';
import Layout from './components/Layout';
import Gate from './components/Gate';
import Home from './pages/Home';
import Videos from './pages/Videos';
import { Browse, SeriesDetail } from './pages/Catalog';
import Watch from './pages/Watch';
import { CampaignDetail, Campaigns } from './pages/Campaigns';
import News from './pages/News';
import Premium from './pages/Premium';
import Account from './pages/Account';
import Join from './pages/Join';
import Advertiser from './pages/Advertiser';
import Licensor from './pages/Licensor';
import Admin from './pages/admin/Admin';

document.documentElement.classList.add('dark');

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Gate><Home /></Gate>} />
            <Route path="/videos" element={<Gate section="youtube"><Videos /></Gate>} />
            <Route path="/browse" element={<Gate section="browse"><Browse /></Gate>} />
            <Route path="/series/:id" element={<Gate section="browse"><SeriesDetail /></Gate>} />
            <Route path="/watch/:episodeId" element={<Gate section="browse"><Watch /></Gate>} />
            <Route path="/campaigns" element={<Gate section="campaigns"><Campaigns /></Gate>} />
            <Route path="/campaigns/:id" element={<Gate section="campaigns"><CampaignDetail /></Gate>} />
            <Route path="/news" element={<Gate section="news"><News /></Gate>} />
            <Route path="/premium" element={<Gate section="premium"><Premium /></Gate>} />
            <Route path="/account" element={<Gate requireAuth><Account /></Gate>} />
            <Route path="/join" element={<Gate requireAuth><Join /></Gate>} />
            <Route path="/advertiser" element={<Gate roles={['Advertiser', 'Admin']}><Advertiser /></Gate>} />
            <Route path="/licensor" element={<Gate roles={['Licensor', 'Admin']}><Licensor /></Gate>} />
            <Route path="/admin" element={<Gate roles={['Admin', 'Moderator']}><Admin /></Gate>} />
            <Route path="*" element={<Gate><Home /></Gate>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
