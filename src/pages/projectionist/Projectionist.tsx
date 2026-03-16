import { create } from "zustand";
import ConeIcon from "@/assets/cone.svg?react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import PCs from "@/pages/projectionist/sections/PCs";
import Upload from "@/pages/projectionist/sections/Upload";
import type { parseUserData } from "@/workers/worker";

export type UserData = ReturnType<typeof parseUserData>;

export const useData = create<UserData>(() => ({
  taxa: [],
  samples: [],
  projected: [],
}));

export type UserMeta = Record<string, string>[];

export const useUserMeta = create<UserMeta>(() => []);

const Projectionist = () => (
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

export default Projectionist;
