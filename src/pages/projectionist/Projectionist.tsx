import type { Remote } from "comlink";
import type * as ProjectionistWorkerType from "@/pages/projectionist/project";
import { useCallback, useEffect } from "react";
import { ConeIcon } from "lucide-react";
import { create } from "zustand";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import PCs from "@/pages/projectionist/sections/PCs";
import Upload from "@/pages/projectionist/sections/Upload";
import { useWorker } from "@/util/worker";

export type UserData = Awaited<
  ReturnType<typeof ProjectionistWorkerType.parseUserData>
>;
export type UserMeta = Awaited<
  ReturnType<typeof ProjectionistWorkerType.parseUserMeta>
>;
export type CompendiumData = Awaited<
  ReturnType<typeof ProjectionistWorkerType.parseCompendiumData>
>;

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
  const [compendiumData] = useWorker(
    ProjectionistWorker,
    useCallback(
      (worker: Remote<typeof ProjectionistWorkerType>) =>
        worker.parseCompendiumData(),
      [],
    ),
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
