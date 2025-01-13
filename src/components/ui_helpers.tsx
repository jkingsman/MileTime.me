import { StandardDistance } from "./types";

export const DistanceNameDisplay = ({ dist }: { dist: StandardDistance }) => {
  return (
    <div>
      {dist.longName ? (
        <>
          <span className="block lg:hidden">{dist.name}</span>
          <span className="hidden lg:block">{dist.longName}</span>
        </>
      ) : (
        <span>{dist.name}</span>
      )}
    </div>
  );
};
