import { useNavigate } from 'react-router-dom';
import { CampaignManager } from '@/components/campaign';
import { PageTransition } from '@/components/ui/PageTransition';

const Campaigns = () => {
  const navigate = useNavigate();
  
  return (
    <PageTransition>
      <CampaignManager
        onCreateNew={() => navigate('/campaigns/new')}
        onSelectCampaign={() => navigate('/')}
      />
    </PageTransition>
  );
};

export default Campaigns;
