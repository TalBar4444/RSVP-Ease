import GuestShell from '../components/guest/GuestShell';
import WeddingHeader from '../components/guest/WeddingHeader';

export default function HomePage() {
  return (
    <GuestShell>
      <WeddingHeader />
      <p className="text-center font-medium leading-relaxed text-[#082D58]">
        נא להיכנס דרך הקישור האישי שקיבלת בוואטסאפ.
      </p>
    </GuestShell>
  );
}
