import { useNavigate } from 'react-router-dom';
import { CampaignManager } from '@/components/campaign';
import { PageTransition } from '@/components/ui/PageTransition';
import { SeoHead } from '@/components/seo/SeoHead';

const Campaigns = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <SeoHead
        title="Your Campaigns — The Untold Stories"
        description="Browse, load, and manage your saved AI text adventure campaigns."
        path="/campaigns"
      />
      <CampaignManager
        onCreateNew={() => navigate('/campaigns/new')}
        onSelectCampaign={() => navigate('/')}
      />
    </PageTransition>
  );
};

export default Campaigns;
