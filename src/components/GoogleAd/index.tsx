/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

const GoogleAd = ({
  client,
  slot,
  format,
}: {
  client: string;
  slot: string;
  format?: string;
}) => {
  useEffect(() => {
    const initializeAds = () => {
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    };

    // Delay initialization to ensure page layout is complete
    const timer = setTimeout(initializeAds, 1000);

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, []);

  return (
    <ins
      className="adsbygoogle ads-container"
      style={{ display: "flex", width: "300px", height: "250px" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format || "auto"}
    />
  );
};

export default GoogleAd;
