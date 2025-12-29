import { InventoryTestPanel } from '@/components/game/InventoryTestPanel';

const InventoryTest = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold text-center text-foreground mb-4">
        Inventory System Test
      </h1>
      <InventoryTestPanel />
    </div>
  );
};

export default InventoryTest;
