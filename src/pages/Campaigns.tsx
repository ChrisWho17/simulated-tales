import { useNavigate } from 'react-router-dom';
import { CampaignManager } from '@/components/campaign';

const Campaigns = () => {
  const navigate = useNavigate();
  
  return (
    <CampaignManager
      onCreateNew={() => navigate('/campaigns/new')}
      onSelectCampaign={() => navigate('/play')}
    />
  );
};

export default Campaigns;
