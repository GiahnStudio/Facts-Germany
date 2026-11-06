import React from "react";
import { Composition } from "remotion";
import { Video, VideoProps } from "./Video";
import { Thumb } from "./Thumb";

const defaults: VideoProps = { fps: 30, width: 1920, height: 1080, totalFrames: 90, captions: false, scenes: [], slug: "demo" };

export const Root: React.FC = () => (
  <>
  <Composition id="Thumb" component={Thumb as any} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{ big: "Titel" }} />
  <Composition
    id="Video"
    component={Video as any}
    durationInFrames={90}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={defaults}
    calculateMetadata={({ props }) => {
      const p = props as unknown as VideoProps;
      return { durationInFrames: Math.max(1, p.totalFrames), width: p.width, height: p.height, fps: p.fps };
    }}
  />
  </>
);
