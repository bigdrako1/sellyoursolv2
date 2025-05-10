import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrencyStore } from "@/store/currencyStore";
import TrencherCard from "./TrencherCard";

const TrencherPnLExample: React.FC = () => {
  const { setCurrency } = useCurrencyStore();

  // Set USD as currency for this example
  React.useEffect(() => {
    setCurrency("USD");
  }, [setCurrency]);

  // Sample data for $TRENCHER with 82.2x multiplier
  const tokenSymbol = "$TRENCHER";
  const calledAt = "110.7K";
  const multiplier = 82.2; // 82.2x as shown in the image
  const holdingTime = "18h, 7m";

  // Username from the image
  const username = "TURBOMPOWER";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>$TRENCHER PnL Card Example</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm mx-auto">
          <TrencherCard
            tokenSymbol={tokenSymbol}
            calledAt={calledAt}
            multiplier={multiplier}
            holdingTime={holdingTime}
          />

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              This card shows an 82.2x return on $TRENCHER token.
              Called at 110.7K market cap as shown in the reference image.
            </p>
            <p className="text-sm font-semibold mt-2">
              Trader: {username}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This card design matches the reference image with the Pepe mascot in a suit
              with money guns and cash stacks on a green background.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrencherPnLExample;
