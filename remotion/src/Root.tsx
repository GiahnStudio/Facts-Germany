import React from "react";
import { Composition } from "remotion";
import { Video, VideoProps } from "./Video";
import { Thumb } from "./Thumb";
import { Banner, Profile, Watermark } from "./Brand";

const defaults: VideoProps = { fps: 30, width: 1920, height: 1080, totalFrames: 90, captions: false, scenes: [], slug: "demo" };

export const Root: React.FC = () => (
  <>
  <Composition id="Profile" component={Profile} durationInFrames={1} fps={30} width={800} height={800} />
  <Composition id="Banner" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} />
  <Composition id="Watermark" component={Watermark} durationInFrames={1} fps={30} width={150} height={150} />
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
