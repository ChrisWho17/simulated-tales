import { CampaignGameWrapper } from '@/components/adventure/CampaignGameWrapper';
import { SeoHead } from '@/components/seo/SeoHead';

const Index = () => {
  return (
    <>
      <SeoHead
        title="The Untold Stories — AI Text Adventure RPG"
        description="Create your own epic AI-powered text adventure. Pick a genre, build a character, and play in a simulation-driven living world."
        path="/"
      />
      <CampaignGameWrapper />
    </>
  );
};

export default Index;
