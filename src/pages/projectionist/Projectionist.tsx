import { useCallback, useEffect } from "react";
import { ConeIcon } from "lucide-react";
import { create } from "zustand";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import PCs from "@/pages/projectionist/sections/PCs";
import Upload from "@/pages/projectionist/sections/Upload";
import { useThread } from "@/workers";
import type {
  parseCompendiumData,
  parseUserData,
  parseUserMeta,
} from "@/workers/worker";

export type UserData = ReturnType<typeof parseUserData>;
export type UserMeta = ReturnType<typeof parseUserMeta>;
export type CompendiumData = ReturnType<typeof parseCompendiumData>;

export const useData = create<{
  compendium: CompendiumData;
  userData: UserData;
  userMeta: UserMeta;
}>(() => ({
  compendium: {
    taxa: [],
    weights: [],
    projected: [],
  },
  userData: {
    taxa: [],
    samples: [],
    projected: [],
  },
  userMeta: [],
}));

const Projectionist = () => {
  /** parse compendium data */
  const [compendiumData] = useThread(
    useCallback((worker) => worker.parseCompendiumData(), []),
  );

  /** update global state with parsed data */
  useEffect(() => {
    if (compendiumData) useData.setState({ compendium: compendiumData });
  }, [compendiumData]);

  return (
    <>
      <Meta
        title="Projectionist"
        description="Compare your data with data from the Human Microbiome Compendium"
      />

      <Header>
        <h2>
          <ConeIcon />
          Projectionist
        </h2>
      </Header>

      <main>
        <Upload />
        <PCs />
      </main>
      <Footer />
    </>
  );
};

export default Projectionist;
