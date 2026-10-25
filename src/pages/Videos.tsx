import { PageHeader } from '../components/Gate';
import YouTubeGallery from '../components/YouTubeGallery';

export default function Videos() {
  return (
    <>
      <PageHeader eyebrow="Press Play on YouTube" title="All Videos">
        Every upload from our channel, updated automatically the moment we post something new.
      </PageHeader>
      <div className="container mx-auto px-4 py-10">
        <YouTubeGallery />
      </div>
    </>
  );
}
