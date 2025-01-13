import { StandardDistance } from "./types";

export const DistanceNameDisplay = ({ dist }: { dist: StandardDistance }) => {
  return (
    <div>
      {dist.longName ? (
        <>
          <span className="block md:hidden">{dist.name}</span>
          <span className="hidden md:block">{dist.longName}</span>
        </>
      ) : (
        <span>{dist.name}</span>
      )}
    </div>
  );
};
