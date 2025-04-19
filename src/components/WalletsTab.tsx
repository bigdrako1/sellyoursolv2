
import TrackingWallets from "@/components/TrackingWallets";
import TransactionHistory from "@/components/TransactionHistory";

const WalletsTab = () => {
  return (
    <>
      <div className="mb-6">
        <TrackingWallets />
      </div>
      
      <div className="mb-6">
        <TransactionHistory />
      </div>
    </>
  );
};

export default WalletsTab;
